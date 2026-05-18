import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const rootEnvPath = path.resolve(projectRoot, ".env");

if (fs.existsSync(rootEnvPath)) {
  const lines = fs.readFileSync(rootEnvPath, "utf8").split(/\r?\n/);
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

export const config = {
  port: Number(process.env.BACKEND_PORT || 3001),
  rpcUrl: process.env.HYPEREVM_RPC_URL || "https://rpc.hyperliquid-testnet.xyz/evm",
  bounceBaseUrl: process.env.BOUNCE_BASE_URL || "https://indexing.bounce.tech",
  deploymentFile: process.env.DEPLOYMENT_FILE
    ? path.resolve(projectRoot, process.env.DEPLOYMENT_FILE)
    : path.resolve(projectRoot, "deployments/hyperevmTestnet.json"),
  keeperPrivateKey: process.env.KEEPER_PRIVATE_KEY || "",
  keeperPollMs: Number(process.env.KEEPER_POLL_MS || 30_000),
  indexFromBlock: Number(process.env.INDEX_FROM_BLOCK || 0)
};

export function loadDeployment() {
  if (fs.existsSync(config.deploymentFile)) {
    return JSON.parse(fs.readFileSync(config.deploymentFile, "utf8"));
  }
  const deploymentsDir = path.resolve(projectRoot, "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    return null;
  }
  const firstJson = fs.readdirSync(deploymentsDir).find((file) => file.endsWith(".json"));
  if (!firstJson) {
    return null;
  }
  return JSON.parse(fs.readFileSync(path.join(deploymentsDir, firstJson), "utf8"));
}
