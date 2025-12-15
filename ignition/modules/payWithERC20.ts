import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PayWithERC20Module = buildModule("PayWithERC20Module", (m) => {
    const contractAddress = m.getParameter("contractAddress");
    const planId = m.getParameter("planId");
    const invoiceId = m.getParameter("invoiceId");
    const user = m.getParameter("user");
    const token = m.getParameter("token");
    const maxTokenAmount = m.getParameter("maxTokenAmount");

    const contract = m.contractAt("SubscriptionManager", contractAddress);
    const erc20 = m.contractAt("IERC20Ignition", token);

    // Fetch required token amount
    const required = m.staticCall(contract, "getTokenAmountForPlan", [planId, token]);

    // Approve
    const approve = m.call(erc20, "approve", [contractAddress, required]);

    // Pay
    m.call(contract, "payWithERC20", [user, planId, invoiceId, token, maxTokenAmount], {
        after: [approve],
    });

    return { contract };
});

export default PayWithERC20Module;


//command to deploy:
// npx hardhat ignition deploy ./ignition/modules/payWithERC20.ts \
//   --parameters ignition/parameters/payWithERC20.json \
//   --network bscTestnet
