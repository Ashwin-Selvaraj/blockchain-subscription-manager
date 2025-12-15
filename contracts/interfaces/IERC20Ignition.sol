// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IERC20Ignition {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);
    function decimals() external view returns (uint8);
}
