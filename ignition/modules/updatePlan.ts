import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UpdatePlanModule = buildModule("UpdatePlanModule", (m) => {
  const contractAddress = m.getParameter("contractAddress");
  const planId = m.getParameter("planId");
  const name = m.getParameter("name");
  const priceUsd = m.getParameter("priceUsd");
  const duration = m.getParameter("duration");
  const active = m.getParameter("active");
  const owner = m.getAccount(0);

  const contract = m.contractAt("SubscriptionManager", contractAddress);

  m.call(
    contract,
    "updatePlan",
    [planId, name, priceUsd, duration, active],
    { from: owner }
  );

  return { contract };
});

export default UpdatePlanModule;

// npx hardhat ignition deploy ./ignition/modules/updatePlan.ts \
//   --parameters ignition/parameters/updatePlan.json \
//   --network bscTestnet

