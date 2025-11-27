import { ethers } from "hardhat";
import { SubscriptionManager__factory } from "../types/ethers-contracts/factories/SubscriptionManager__factory";

type HexAddress = `0x${string}`;

function parseAddress(input: string | undefined, fallback: HexAddress): HexAddress {
  if (!input) {
    return fallback;
  }
  if (!ethers.isAddress(input)) {
    throw new Error(`Invalid address provided: ${input}`);
  }
  return input as HexAddress;
}

function parsePlanIds(raw: string | undefined): number[] {
  if (!raw) {
    return [0];
  }

  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => {
      const parsed = Number(id);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`Invalid plan id: ${id}`);
      }
      return parsed;
    });
}

async function main() {
  const [defaultSigner] = await ethers.getSigners();

  const contractAddress = parseAddress(
    process.env.CONTRACT_ADDRESS,
    "0x427d03a9e233752018D6e7a479fA9E5De8f643e3"
  );
  const tokenAddress = parseAddress(
    process.env.TOKEN_ADDRESS,
    ethers.ZeroAddress as HexAddress
  );
  const userAddress = parseAddress(
    process.env.USER_ADDRESS,
    defaultSigner.address as HexAddress
  );
  const planIds = parsePlanIds(process.env.PLAN_IDS);

  const subscriptionManager = SubscriptionManager__factory.connect(
    contractAddress,
    defaultSigner
  );

  console.log("===== SubscriptionManager View Report =====");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Signer used for calls: ${defaultSigner.address}`);
  console.log(`USD decimals: ${(await subscriptionManager.usdDecimals()).toString()}`);
  console.log(`Treasury: ${await subscriptionManager.treasury()}`);
  console.log(
    `Accepted token (${tokenAddress}): ${await subscriptionManager.acceptedToken(tokenAddress)}`
  );
  console.log(
    `Price feed for token (${tokenAddress}): ${await subscriptionManager.tokenPriceFeed(tokenAddress)}`
  );

  for (const planId of planIds) {
    console.log(`\n--- Plan ${planId} ---`);
    try {
      const plan = await subscriptionManager.plans(planId);
      console.log(`Name: ${plan.name}`);
      console.log(`Price (USD precision): ${plan.priceUsd.toString()}`);
      console.log(`Duration (s): ${plan.duration.toString()}`);
      console.log(`Active flag: ${plan.active}`);
      console.log(`isActive(): ${await subscriptionManager.isActive(planId)}`);

      const tokenQuote = await subscriptionManager.getTokenAmountForPlan(
        planId,
        tokenAddress
      );
      console.log(`Token amount for ${tokenAddress}: ${tokenQuote.toString()}`);

      const expiry = await subscriptionManager.expiresAt(userAddress, planId);
      console.log(`expiresAt(${userAddress}, ${planId}): ${expiry.toString()}`);
    } catch (error) {
      console.error(`Failed to read data for plan ${planId}:`, error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

