import { defineConfig, configVariable } from "hardhat/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatVerifyPlugin from "@nomicfoundation/hardhat-verify";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.30",
      },
      production: {
        version: "0.8.30",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    // Built-in Hardhat simulation networks
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },

    // ✅ Your networks converted
    sepolia: {
      type: "http",
      chainType: "l1",
      url: `https://sepolia.infura.io/v3/${configVariable("INFURA_API_KEY")}`,
      accounts: [configVariable("PRIVATE_KEY")],
    },
    matic: {
      type: "http",
      chainType: "l1",
      url: "https://autumn-falling-firefly.matic-testnet.quiknode.pro/c8e3ff914ff86361fd66c6de0e7aed3c878963fb/",
      accounts: [configVariable("PRIVATE_KEY")],
    },
    scrollSepolia: {
      type: "http",
      chainType: "l1",
      url: "https://winter-ultra-sheet.scroll-testnet.quiknode.pro/3d92ec6b4d0bd800befb790f751b5b79441575a1/",
      accounts: [configVariable("PRIVATE_KEY")],
    },
    HederaTestnet: {
      type: "http",
      chainType: "l1",
      url: `https://pool.arkhia.io/hedera/mainnet/api/v1/${configVariable("HBAR_API_KEY")}`,
      accounts: [configVariable("PRIVATE_KEY")],
    },
    bscTestnet: {
      type: "http",
      chainType: "l1",
      url: "https://cold-muddy-moon.bsc-testnet.quiknode.pro/91b6fb765255d79e84c9cd9f65ece85ef8b0c0ec/",
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable("BSCSCAN_API_KEY"),
    },
  },
});
