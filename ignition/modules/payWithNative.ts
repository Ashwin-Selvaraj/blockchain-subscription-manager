import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PayWithNativeModule = buildModule("PayWithNativeModule", (m) => {
  const contractAddress = m.getParameter("contractAddress");
  const planId = m.getParameter("planId");
  const invoiceId = m.getParameter("invoiceId");
  const user = m.getParameter("user");
  const nativeToken = m.getParameter("nativeToken");

  const contract = m.contractAt("SubscriptionManager", contractAddress);
  m.call(contract, "payWithNative", [user, planId, invoiceId, nativeToken]);
  return { contract };
});
  
export default PayWithNativeModule;


//command to deploy:
// npx hardhat ignition deploy ./ignition/modules/payWithNative.ts \
//   --parameters ignition/parameters/payWithNative.json \
//   --network bscTestnet