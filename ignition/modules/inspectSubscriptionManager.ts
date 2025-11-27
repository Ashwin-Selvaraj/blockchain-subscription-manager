import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const InspectSubscriptionManagerModule = buildModule("InspectSubscriptionManagerModule", (m) => {
  const address = m.getParameter("contractAddress");
  const planId = m.getParameter("planId", 0);
  const token = m.getParameter("token", "0x0000000000000000000000000000000000000000");
  const user = m.getParameter("user");

  const contract = m.contractAt("SubscriptionManager", address);

  const usdDecimals = m.staticCall(contract, "usdDecimals", []);
  const treasury = m.staticCall(contract, "treasury", []);
  const plan = m.staticCall(contract, "plans", [planId]);
  const isActive = m.staticCall(contract, "isActive", [planId]);
  const tokenAmount = m.staticCall(contract, "getTokenAmountForPlan", [planId, token]);
  const expiry = m.staticCall(contract, "expiresAt", [user, planId]);

  return { contract };
});

export default InspectSubscriptionManagerModule;





// npx hardhat ignition deploy ./ignition/modules/inspectSubscriptionManager.ts \
//   --parameters ignition/parameters/inspect.json \
//   --network bscTestnet