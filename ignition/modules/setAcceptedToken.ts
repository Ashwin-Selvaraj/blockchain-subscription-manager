import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SetAcceptedTokenModule = buildModule("SetAcceptedTokenModule", (m) => {
  const contractAddress = m.getParameter("contractAddress");
  const token = m.getParameter("token");
  const accept = m.getParameter("accept");
  const priceFeed = m.getParameter("priceFeed");
  const owner = m.getAccount(0);

  const contract = m.contractAt("SubscriptionManager", contractAddress);
  m.call(contract, "setAcceptedToken", [token, accept, priceFeed], { from: owner });
  return { contract };
});

export default SetAcceptedTokenModule;


// comment for running the module 
// npx hardhat ignition deploy ./ignition/modules/setAcceptedToken.ts \
//   --parameters ignition/parameters/setAcceptedToken.json \
//   --network bscTestnet