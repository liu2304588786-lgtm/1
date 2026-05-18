import fs from "fs";
import path from "path";
import { network } from "hardhat";
import { fileURLToPath } from "url";
import { JsonRpcProvider } from "ethers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REAL_BOUNCE_USDC = process.env.BOUNCE_USDC_ADDRESS || "0xb88339CB7199b77E23DB6E890353E22632Ba630f";

async function hasCode(rpcUrl, address) {
  const provider = new JsonRpcProvider(rpcUrl);
  return (await provider.getCode(address)) !== "0x";
}

async function main() {
  const { ethers } = await network.create();
  const [deployer] = await ethers.getSigners();
  const networkArgIndex = process.argv.indexOf("--network");
  const networkName = networkArgIndex >= 0 ? process.argv[networkArgIndex + 1] : "hardhat";
  const deployMode = process.env.DEPLOY_MODE || "mock";

  console.log(`Deploying to ${networkName} with ${deployer.address} in ${deployMode} mode`);

  const Factory = await ethers.getContractFactory("AltCoinFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  let deployment;

  if (deployMode === "real") {
    const bounceLtAddress = process.env.BOUNCE_LT_ADDRESS;
    if (!bounceLtAddress) {
      throw new Error("DEPLOY_MODE=real requires BOUNCE_LT_ADDRESS");
    }
    const rpcUrl =
      networkName === "hyperevmMainnet"
        ? process.env.HYPEREVM_MAINNET_RPC_URL || "https://rpc.hyperliquid.xyz/evm"
        : process.env.HYPEREVM_RPC_URL || "https://rpc.hyperliquid-testnet.xyz/evm";

    const [ltExists, usdcExists] = await Promise.all([
      hasCode(rpcUrl, bounceLtAddress),
      hasCode(rpcUrl, REAL_BOUNCE_USDC)
    ]);

    if (!ltExists || !usdcExists) {
      throw new Error(
        `Bounce real-mode addresses are not deployed on ${networkName}. Real Bounce LT currently resolves on HyperEVM mainnet, not this target network.`
      );
    }

    deployment = {
      network: networkName,
      mode: "real",
      chainId: Number((await ethers.provider.getNetwork()).chainId),
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      factory: await factory.getAddress(),
      usdc: REAL_BOUNCE_USDC,
      leveragedTokens: [
        {
          symbol: "REAL_LT",
          name: "Configured Bounce LT",
          address: bounceLtAddress
        }
      ]
    };
  } else {
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const MockLT = await ethers.getContractFactory("MockLeveragedToken");
    const btc3L = await MockLT.deploy("Mock BTC 3x Long", "BTC3L", await usdc.getAddress(), 100 * 1e6);
    await btc3L.waitForDeployment();
    const eth3L = await MockLT.deploy("Mock ETH 3x Long", "ETH3L", await usdc.getAddress(), 80 * 1e6);
    await eth3L.waitForDeployment();

    deployment = {
      network: networkName,
      mode: "mock",
      chainId: Number((await ethers.provider.getNetwork()).chainId),
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      factory: await factory.getAddress(),
      mockUsdc: await usdc.getAddress(),
      leveragedTokens: [
        {
          symbol: "BTC3L",
          name: "Mock BTC 3x Long",
          address: await btc3L.getAddress(),
          exchangeRate: (100 * 1e6).toString()
        },
        {
          symbol: "ETH3L",
          name: "Mock ETH 3x Long",
          address: await eth3L.getAddress(),
          exchangeRate: (80 * 1e6).toString()
        }
      ]
    };
  }

  const outDir = path.resolve(__dirname, "../../deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${networkName}.json`);
  fs.writeFileSync(outFile, JSON.stringify(deployment, null, 2));

  console.log(`Deployment written to ${outFile}`);
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
