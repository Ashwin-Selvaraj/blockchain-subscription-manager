// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/*
  Beginner-friendly Subscription Manager
  - Supports native (ETH/BNB) and ERC20 payments.
  - Tracks expiresAt[user][planId].
  - Allows frontend to pass invoiceId (bytes32) for on-chain linking.
  - Uses Chainlink-like price feeds (aggregator interface) for USD->token conversion.
  - Uses SafeERC20, ReentrancyGuard, Pausable, Ownable.
  - Emits events for reconciliation.
*/

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface IAggregatorV3 {
    // minimal Chainlink interface used here
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function decimals() external view returns (uint8);
}

contract SubscriptionManager is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct Plan {
        string name; // human readable label
        uint256 priceUsd; // price in USD with usdPrecision (eg 2 decimal -> 100 => $1.00 if precision=2)
        uint256 duration; // subscription duration in seconds (e.g., 30 days)
        bool active;
    }

    // state
    uint8 public usdDecimals = 8; // USD precision used for prices (configurable). Example: 8 -> prices stored with 8 decimals.
    mapping(uint256 => Plan) public plans; // planId => Plan
    mapping(address => mapping(uint256 => uint256)) public expiresAt; // user => planId => expiry timestamp
    mapping(address => address) public tokenPriceFeed; // token => Chainlink-like aggregator
    mapping(address => bool) public acceptedToken; // token => accepted or not
    address public treasury; // where funds are forwarded

    // events
    event PlanCreated(
        uint256 indexed planId,
        string name,
        uint256 priceUsd,
        uint256 duration
    );
    event PlanUpdated(
        uint256 indexed planId,
        string name,
        uint256 priceUsd,
        uint256 duration,
        bool active
    );
    event SubscriptionPaid(
        address indexed payer,
        address indexed user,
        uint256 indexed planId,
        address token,
        uint256 tokenAmount,
        bytes32 invoiceId,
        uint256 expiresAt
    );
    event TreasuryUpdated(address indexed newTreasury);
    event TokenAccepted(address token, bool accepted, address priceFeed);

    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "treasury cannot be zero");
        treasury = _treasury;
    }

    // ------------------
    // ADMIN
    // ------------------

    function setUsdDecimals(uint8 d) external onlyOwner {
        usdDecimals = d;
    }

    function setTreasury(address t) external onlyOwner {
        require(t != address(0), "zero address");
        treasury = t;
        emit TreasuryUpdated(t);
    }

    function createPlan(
        uint256 planId,
        string calldata name,
        uint256 priceUsd,
        uint256 duration
    ) external onlyOwner {
        require(bytes(plans[planId].name).length == 0, "plan already exists");
        require(duration > 0, "duration=0");
        require(bytes(name).length > 0, "name empty");
        plans[planId] = Plan({
            name: name,
            priceUsd: priceUsd,
            duration: duration,
            active: true
        });
        emit PlanCreated(planId, name, priceUsd, duration);
    }

    function updatePlan(
        uint256 planId,
        string calldata name,
        uint256 priceUsd,
        uint256 duration,
        bool active
    ) external onlyOwner {
        require(bytes(plans[planId].name).length > 0, "plan not found");
        require(duration > 0, "duration=0");
        require(bytes(name).length > 0, "name empty");
        plans[planId] = Plan({
            name: name,
            priceUsd: priceUsd,
            duration: duration,
            active: active
        });
        emit PlanUpdated(planId, name, priceUsd, duration, active);
    }

    function setAcceptedToken(
        address token,
        bool accept,
        address priceFeed
    ) external onlyOwner {
        acceptedToken[token] = accept;
        tokenPriceFeed[token] = priceFeed; // priceFeed may be zero for tokens where frontend supplies token amount
        emit TokenAccepted(token, accept, priceFeed);
    }

    // ------------------
    // PUBLIC PAYMENT FLOWS
    // ------------------

    /**
     * pay with ERC20 token
     * - user must approve this contract for token amount
     * - invoiceId: bytes32 provided by frontend (useful for reconciliation)
     * - payer = msg.sender (payer pays for `user`)
     */
    function payWithERC20(
        address user,
        uint256 planId,
        bytes32 invoiceId,
        address token,
        uint256 maxTokenAmount // optional guard: frontend can compute required token and pass it
    ) external nonReentrant whenNotPaused {
        require(acceptedToken[token], "token not accepted");
        Plan memory plan = plans[planId];
        require(plan.active, "plan not active");

        uint256 tokenAmount = _usdToTokenAmount(plan.priceUsd, token);

        // if frontend wants safety: require tokenAmount <= maxTokenAmount
        if (maxTokenAmount > 0) {
            require(tokenAmount <= maxTokenAmount, "price slippage");
        }

        // transfer token to treasury
        IERC20(token).safeTransferFrom(msg.sender, treasury, tokenAmount);

        // extend expiry for user
        _extendExpiry(user, planId, plan.duration);

        emit SubscriptionPaid(
            msg.sender,
            user,
            planId,
            token,
            tokenAmount,
            invoiceId,
            expiresAt[user][planId]
        );
    }

    /**
     * pay with native (ETH/BNB)
     * - payable function: frontend must compute required native token amount using price feed for native token
     * - invoiceId helps reconcile txs.
     */
    function payWithNative(
        address user,
        uint256 planId,
        bytes32 invoiceId
    ) external payable nonReentrant whenNotPaused {
        Plan memory plan = plans[planId];
        require(plan.active, "plan not active");

        // native token feed is stored at address(0)
        require(tokenPriceFeed[address(0)] != address(0), "price feed not set");
        uint256 required = _usdToTokenAmount(plan.priceUsd, address(0));

        require(msg.value >= required, "insufficient native sent");

        // forward to treasury
        (bool ok, ) = treasury.call{value: required}("");
        require(ok, "transfer failed");

        // refund extra if any
        if (msg.value > required) {
            uint256 refund = msg.value - required;
            (bool ok2, ) = msg.sender.call{value: refund}("");
            require(ok2, "refund failed");
        }

        // extend expiry
        _extendExpiry(user, planId, plan.duration);

        emit SubscriptionPaid(
            msg.sender,
            user,
            planId,
            address(0),
            required,
            invoiceId,
            expiresAt[user][planId]
        );
    }

    // ------------------
    // VIEW Helpers
    // ------------------

    /**
     * @dev returns token amount required for USD price
     * token == address(0) means native token feed stored under address(0)
     */
    function getTokenAmountForPlan(
        uint256 planId,
        address token
    ) public view returns (uint256) {
        Plan memory plan = plans[planId];
        require(plan.active, "plan inactive");
        return _usdToTokenAmountView(plan.priceUsd, token);
    }

    function hasActiveSubscription(
        address user,
        uint256 planId
    ) external view returns (bool) {
        return expiresAt[user][planId] >= block.timestamp;
    }

    function claimFreePlan(uint256 planId) external whenNotPaused nonReentrant {
        Plan memory plan = plans[planId];
        require(plan.active, "plan not active");
        require(plan.priceUsd == 0, "plan not free");
        require(expiresAt[msg.sender][planId] == 0, "already claimed");

        _extendExpiry(msg.sender, planId, plan.duration);

        emit SubscriptionPaid(
            msg.sender,
            msg.sender,
            planId,
            address(0),
            0,
            bytes32(0),
            expiresAt[msg.sender][planId]
        );
    }

    function isActive(uint256 planId) external view returns (bool) {
        return plans[planId].active;
    }

    // ------------------
    // INTERNAL
    // ------------------

    function _extendExpiry(
        address user,
        uint256 planId,
        uint256 duration
    ) internal {
        uint256 current = expiresAt[user][planId];
        uint256 base = current > block.timestamp ? current : block.timestamp;
        expiresAt[user][planId] = base + duration;
    }

    // INTERNAL view version: does not modify state
    function _usdToTokenAmountView(
        uint256 priceUsd,
        address token
    ) internal view returns (uint256) {
        if (priceUsd == 0) {
            return 0;
        }

        address feed = tokenPriceFeed[token];
        require(feed != address(0), "price feed not set");
        IAggregatorV3 aggregator = IAggregatorV3(feed);
        (, int256 answer, , uint256 updatedAt, ) = aggregator.latestRoundData();
        require(answer > 0, "bad aggregator answer");
        require(updatedAt > block.timestamp - 1 days, "stale feed");

        uint8 feedDecimals = aggregator.decimals();
        uint8 tokenDecimals = _tokenDecimals(token);

        uint256 numerator = uint256(priceUsd) *
            _pow10(feedDecimals + tokenDecimals);
        uint256 denominator = uint256(answer) * _pow10(usdDecimals);

        return numerator / denominator;
    }

    // Non-view helper used in payable flow (simple wrapper)
    function _usdToTokenAmount(
        uint256 priceUsd,
        address token
    ) internal view returns (uint256) {
        return _usdToTokenAmountView(priceUsd, token);
    }

    function _tokenDecimals(address token) internal view returns (uint8) {
        if (token == address(0)) {
            return 18;
        }
        return IERC20Metadata(token).decimals();
    }

    function _pow10(uint256 exp) internal pure returns (uint256) {
        return 10 ** exp;
    }

    // ------------------
    // OWNER EMERGENCY FUNCTIONS
    // ------------------

    // withdraw ERC20 stuck in contract (should not normally happen)
    function withdrawERC20(
        address token,
        uint256 amount,
        address to
    ) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    // withdraw native stuck in contract
    function withdrawNative(uint256 amount, address to) external onlyOwner {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "native withdraw failed");
    }

    // pause/unpause
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
}



