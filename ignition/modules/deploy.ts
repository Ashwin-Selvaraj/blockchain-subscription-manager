import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { config } from "dotenv";

config();

// Get treasury address from environment or use default
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || "0x14636799e52853eddbeabb5a088a0394975fcdec";

/**
 * Ignition Module for deploying SubscriptionManager
 * 
 * Usage:
 * 1. Deploy: npx hardhat ignition deploy ./ignition/modules/deploy.ts --network <network>
 * 2. Save deployment info: npx hardhat run scripts/save-deployment.ts --network <network>
 * 
 * This module defines the deployment structure. Ignition handles:
 * - Execution order and dependencies
 * - Error recovery and resuming
 * - State management
 * 
 * Deployment addresses are stored by Ignition in ignition/deployments/chain-{chainId}/
 * Use the save-deployment.ts script to extract and save to deployments/{network}.json
 */
export default buildModule("SubscriptionManagerModule", (m) => {
  // Deploy SubscriptionManager with treasury address
  const subscriptionManager = m.contract("SubscriptionManager", [TREASURY_ADDRESS]);

  return { subscriptionManager };
});
