import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const [owner, alice] = await ethers.getSigners();

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();

  const MockLT = await ethers.getContractFactory("MockLeveragedToken");
  const lt = await MockLT.deploy("Mock BTC 3x Long", "BTC3L", await usdc.getAddress(), 100 * 1e6);
  await lt.waitForDeployment();

  const Factory = await ethers.getContractFactory("AltCoinFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const launchTx = await factory.launch(
    "Alpha",
    "ALPHA",
    await lt.getAddress(),
    await usdc.getAddress(),
    "ipfs://alpha",
    "alpha desc"
  );
  await launchTx.wait();

  const info = await factory.getLaunchInfo(0);
  const curve = await ethers.getContractAt("BondingCurve", info.curve);
  const token = await ethers.getContractAt("AltCoin", info.token);

  await usdc.faucet(alice.address, 20_000n * 10n ** 6n);
  await usdc.connect(alice).approve(await curve.getAddress(), 20_000n * 10n ** 6n);
  await curve.connect(alice).buy(500n * 10n ** 6n, 0);

  const tokenBalance = await token.balanceOf(alice.address);
  if (tokenBalance <= 0n) {
    throw new Error("Buy failed: zero token balance");
  }

  await token.connect(alice).approve(await curve.getAddress(), tokenBalance / 2n);
  await curve.connect(alice).sell(tokenBalance / 2n, 0);

  const usdcBalanceAfterSell = await usdc.balanceOf(alice.address);
  if (usdcBalanceAfterSell <= 0n) {
    throw new Error("Sell failed: zero USDC balance after sell");
  }

  await curve.connect(alice).buy(1_500n * 10n ** 6n, 0);
  await lt.setExchangeRate(4_000n * 10n ** 6n);

  const ready = await curve.checkGraduation();
  if (!ready) {
    throw new Error("Graduation threshold was not reached");
  }

  await curve.graduate();
  const pool = await curve.pool();
  if (pool === ethers.ZeroAddress) {
    throw new Error("Graduation failed: pool address missing");
  }

  console.log("Smoke test passed");
  console.log({
    owner: owner.address,
    alice: alice.address,
    factory: await factory.getAddress(),
    curve: await curve.getAddress(),
    token: await token.getAddress(),
    pool
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
