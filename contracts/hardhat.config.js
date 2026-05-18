import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "hardhat/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(__dirname, "../.env");

if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) {
      continue;
    }
    const [key, ...rest] = line.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").trim();
    }
  }
}

const privateKey = process.env.PRIVATE_KEY;

const config = defineConfig({
  plugins: [hardhatEthersPlugin],
  solidity: {
    version: "0.8.24",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      type: "edr-simulated"
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545"
    },
    hyperevmTestnet: {
      type: "http",
      url: process.env.HYPEREVM_RPC_URL || "https://rpc.hyperliquid-testnet.xyz/evm",
      chainType: "l1",
      chainId: Number(process.env.HYPEREVM_CHAIN_ID || "998"),
      accounts: privateKey ? [privateKey] : []
    },
    hyperevmMainnet: {
      type: "http",
      url: process.env.HYPEREVM_MAINNET_RPC_URL || "https://rpc.hyperliquid.xyz/evm",
      chainType: "l1",
      chainId: Number(process.env.HYPEREVM_MAINNET_CHAIN_ID || "999"),
      accounts: privateKey ? [privateKey] : []
    }
  }
});

export default config;
