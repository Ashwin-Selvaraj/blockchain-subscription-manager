import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GetTokenAmountModule = buildModule("GetTokenAmountModule", (m) => {
  const contractAddress = m.getParameter("contractAddress");
  const planId = m.getParameter("planId");
  const token = m.getParameter("token");

  const contract = m.contractAt("SubscriptionManager", contractAddress);
  const tokenAmount = m.staticCall(contract, "getTokenAmountForPlan", [planId, token]);
  return { contract };
});

export default GetTokenAmountModule;


// comment for running the module 
// npx hardhat ignition deploy ./ignition/modules/getTokenAmount.ts \
//   --parameters ignition/parameters/getTokenAmount.json \
//   --network bscTestnet