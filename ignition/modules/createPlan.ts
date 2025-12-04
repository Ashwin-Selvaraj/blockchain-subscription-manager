import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CreatePlanModule = buildModule("CreatePlanModule", (m) => {
  const contractAddress = m.getParameter("contractAddress");
  const planId = m.getParameter("planId");
  const name = m.getParameter("name");
  const priceUsd = m.getParameter("priceUsd");
  const duration = m.getParameter("duration");
  const owner = m.getAccount(0);

  const contract = m.contractAt("SubscriptionManager", contractAddress);

  m.call(contract, "createPlan", [planId, name, priceUsd, duration], { from: owner });

  return { contract };
});

export default CreatePlanModule;




// comment for running the module 
// npx hardhat ignition deploy ./ignition/modules/createPlan.ts \
//   --parameters ignition/parameters/createPlan.json \
//   --network bscTestnet

