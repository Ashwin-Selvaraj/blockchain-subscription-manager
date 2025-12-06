import { network } from "hardhat";
import { SubscriptionManager__factory } from "../types/ethers-contracts/factories/SubscriptionManager__factory.js";

// Minimal interface for Chainlink aggregator
const AggregatorV3ABI = [
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() external view returns (uint8)"
];

async function main() {
  const { ethers } = await network.connect({
    network: process.env.NETWORK || "bscTestnet",
    chainType: "l1",
  });

  const contractAddress = process.env.CONTRACT_ADDRESS || "0xeE8c9101d4082F9ea3fC0881067045F4C72a07f3";
  const tokenAddress = process.env.TOKEN_ADDRESS || "0x1A26d803C2e796601794f8C5609549643832702C";
  const planId = process.env.PLAN_ID ? Number(process.env.PLAN_ID) : 0;

  const [signer] = await ethers.getSigners();
  const subscriptionManager = SubscriptionManager__factory.connect(contractAddress, signer);

  console.log("===== Debug Token Amount Calculation =====");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Plan ID: ${planId}`);
  console.log(`Token: ${tokenAddress}\n`);

  // Get plan details
  const plan = await subscriptionManager.plans(planId);
  const usdDecimals = await subscriptionManager.usdDecimals();
  const priceFeedAddress = await subscriptionManager.tokenPriceFeed(tokenAddress);

  console.log("--- Plan Details ---");
  console.log(`Name: ${plan.name}`);
  console.log(`priceUsd (raw): ${plan.priceUsd.toString()}`);
  console.log(`priceUsd (formatted): $${Number(plan.priceUsd) / (10 ** Number(usdDecimals))}`);
  console.log(`usdDecimals: ${usdDecimals}`);
  console.log(`Duration: ${plan.duration.toString()} seconds\n`);

  console.log("--- Token Details ---");
  const token = new ethers.Contract(tokenAddress, ["function decimals() external view returns (uint8)"], signer);
  const tokenDecimals = await token.decimals();
  console.log(`Token decimals: ${tokenDecimals}\n`);

  console.log("--- Price Feed Details ---");
  console.log(`Price Feed Address: ${priceFeedAddress}`);
  
  if (priceFeedAddress === ethers.ZeroAddress) {
    console.log("❌ ERROR: Price feed not set!");
    return;
  }

  const priceFeed = new ethers.Contract(priceFeedAddress, AggregatorV3ABI, signer);
  const feedDecimals = await priceFeed.decimals();
  const roundData = await priceFeed.latestRoundData();
  const answer = roundData.answer;
  
  console.log(`Feed decimals: ${feedDecimals}`);
  console.log(`Price feed answer (raw): ${answer.toString()}`);
  console.log(`Price feed answer (formatted): $${Number(answer) / (10 ** Number(feedDecimals))}\n`);

  // Manual calculation
  console.log("--- Manual Calculation ---");
  const numerator = plan.priceUsd * (10n ** BigInt(feedDecimals + tokenDecimals));
  const denominator = BigInt(answer.toString()) * (10n ** BigInt(usdDecimals));
  const calculatedAmount = numerator / denominator;
  
  console.log(`Numerator: ${numerator.toString()}`);
  console.log(`Denominator: ${denominator.toString()}`);
  console.log(`Calculated token amount: ${calculatedAmount.toString()}\n`);

  // Get actual result from contract
  console.log("--- Contract Result ---");
  try {
    const tokenAmount = await subscriptionManager.getTokenAmountForPlan(planId, tokenAddress);
    console.log(`Contract token amount: ${tokenAmount.toString()}`);
    console.log(`Contract token amount (formatted): ${ethers.formatUnits(tokenAmount, tokenDecimals)}`);
  } catch (error: any) {
    console.log(`❌ ERROR: ${error.message}`);
  }

  console.log("\n--- Analysis ---");
  const priceInUsd = Number(plan.priceUsd) / (10 ** Number(usdDecimals));
  const tokenPrice = Number(answer) / (10 ** Number(feedDecimals));
  const expectedTokens = priceInUsd / tokenPrice;
  
  console.log(`Price in USD: $${priceInUsd}`);
  console.log(`Token price: $${tokenPrice}`);
  console.log(`Expected tokens: ${expectedTokens}`);
  console.log(`\n💡 If result is 0, the priceUsd value is too small!`);
  console.log(`💡 For $1.00 with usdDecimals=8, use priceUsd: 100000000`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

