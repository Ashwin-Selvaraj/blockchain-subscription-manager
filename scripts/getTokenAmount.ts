import { network } from "hardhat";
import { SubscriptionManager__factory } from "../types/ethers-contracts/factories/SubscriptionManager__factory.js";

// Minimal interface for ERC20Metadata decimals()
const ERC20MetadataABI = [
  "function decimals() external view returns (uint8)"
];

type HexAddress = `0x${string}`;

function parseAddress(ethers: any, input: string | undefined, fallback: HexAddress): HexAddress {
  if (!input) {
    return fallback;
  }
  if (!ethers.isAddress(input)) {
    throw new Error(`Invalid address provided: ${input}`);
  }
  return input as HexAddress;
}

async function main() {
  // Connect to the network (get ethers from network.connect in Hardhat 3.x)
  const { ethers } = await network.connect({
    network: process.env.NETWORK || "bscTestnet",
    chainType: "l1",
  });

  const [defaultSigner] = await ethers.getSigners();

  // Get parameters from environment or use defaults
  const contractAddress = parseAddress(
    ethers,
    process.env.CONTRACT_ADDRESS,
    "0xeE8c9101d4082F9ea3fC0881067045F4C72a07f3" as HexAddress
  );
  const planId = process.env.PLAN_ID ? Number(process.env.PLAN_ID) : 0;
  const tokenAddress = parseAddress(
    ethers,
    process.env.TOKEN_ADDRESS,
    "0x1A26d803C2e796601794f8C5609549643832702C" as HexAddress
  );

  const subscriptionManager = SubscriptionManager__factory.connect(
    contractAddress,
    defaultSigner
  );

  console.log("===== Get Token Amount for Plan =====");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Plan ID: ${planId}`);
  console.log(`Token: ${tokenAddress}`);

  try {
    const tokenAmount = await subscriptionManager.getTokenAmountForPlan(planId, tokenAddress);
    console.log(`\nToken Amount Required (raw): ${tokenAmount.toString()}`);
    
    // Get token decimals for proper formatting
    let tokenDecimals = 18; // default for native token
    if (tokenAddress !== ethers.ZeroAddress) {
      try {
        const token = new ethers.Contract(tokenAddress, ERC20MetadataABI, defaultSigner);
        tokenDecimals = await token.decimals();
      } catch (error) {
        console.log(`Warning: Could not fetch token decimals, using 18`);
      }
    }
    
    console.log(`Token Amount (formatted): ${ethers.formatUnits(tokenAmount, tokenDecimals)}`);
    console.log(`Token Decimals: ${tokenDecimals}`);
  } catch (error: any) {
    console.error(`Failed to get token amount:`, error.message || error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

