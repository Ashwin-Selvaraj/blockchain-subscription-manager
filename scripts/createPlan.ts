import { network } from "hardhat";
import { SubscriptionManager__factory } from "../types/ethers-contracts/factories/SubscriptionManager__factory.js";

async function main() {
  const { ethers } = await network.connect({
    network: process.env.NETWORK || "bscTestnet",
    chainType: "l1",
  });

  const [defaultSigner] = await ethers.getSigners();

  const contractAddress = process.env.CONTRACT_ADDRESS || "0x686c2613FDF9f82d20d03639B8C78ae064E2b0D4";
  const planId = process.env.PLAN_ID ? Number(process.env.PLAN_ID) : 0;
  const name = process.env.PLAN_NAME || "Basic Plan";
  const priceUsd = process.env.PRICE_USD ? BigInt(process.env.PRICE_USD) : 1000000000n; // Default: $10.00 with 8 decimals
  const duration = process.env.DURATION ? Number(process.env.DURATION) : 2592000; // Default: 30 days

  const contract = SubscriptionManager__factory.connect(contractAddress, defaultSigner);

  console.log("===== Create Plan =====");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Plan ID: ${planId}`);
  console.log(`Name: ${name}`);
  console.log(`Price USD: ${priceUsd.toString()}`);
  console.log(`Duration: ${duration} seconds (${duration / 86400} days)`);

  try {
    const tx = await contract.createPlan(planId, name, priceUsd, duration);
    console.log(`\n✅ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Plan created successfully! Block: ${receipt?.blockNumber}`);
  } catch (error: any) {
    console.error(`\n❌ Failed to create plan:`, error.message || error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


