import { ethers } from "ethers";
import { loadDeployment } from "../config.js";
import { CURVE_ABI, ERC20_ABI, FACTORY_ABI, LT_ABI } from "../lib/abis.js";
import { formatCurveDetail } from "../lib/math.js";
import { provider } from "../lib/provider.js";

export function getFactoryAddress() {
  const deployment = loadDeployment();
  if (!deployment?.factory) {
    throw new Error("Factory address missing. Deploy contracts first.");
  }
  return deployment.factory;
}

export async function getLaunches() {
  const factory = new ethers.Contract(getFactoryAddress(), FACTORY_ABI, provider);
  const count = Number(await factory.getLaunchCount());
  const launches = [];
  for (let index = 0; index < count; index += 1) {
    launches.push(await factory.getLaunchInfo(index));
  }
  return launches;
}

export async function getCurveSnapshot(launch) {
  const curve = new ethers.Contract(launch.curve, CURVE_ABI, provider);
  const lt = new ethers.Contract(launch.ltToken, LT_ABI, provider);
  const token = new ethers.Contract(launch.token, ERC20_ABI, provider);

  const [
    virtualReserveX,
    virtualReserveY,
    realReserveX,
    realReserveY,
    tokenPrice,
    graduated,
    shouldGraduate,
    usdc,
    pool,
    ltPrice,
    [gradTokenLiquidity, gradLtLiquidity],
    totalSupply
  ] = await Promise.all([
    curve.virtualReserveX(),
    curve.virtualReserveY(),
    curve.realReserveX(),
    curve.realReserveY(),
    curve.currentPrice(),
    curve.graduated(),
    curve.checkGraduation(),
    curve.usdc(),
    curve.pool(),
    lt.exchangeRate(),
    curve.previewGraduationLiquidity(),
    token.totalSupply()
  ]);

  return {
    virtualReserveX,
    virtualReserveY,
    realReserveX,
    realReserveY,
    tokenPrice,
    graduated,
    shouldGraduate,
    usdc,
    pool,
    ltPrice,
    gradTokenLiquidity,
    gradLtLiquidity,
    totalSupply
  };
}

export async function getTokenList() {
  const launches = await getLaunches();
  const details = await Promise.all(
    launches.map(async (launch) => formatCurveDetail(launch, await getCurveSnapshot(launch)))
  );
  return details.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getTokenDetail(curveAddress) {
  const launches = await getLaunches();
  const launch = launches.find((item) => item.curve.toLowerCase() === curveAddress.toLowerCase());
  if (!launch) {
    return null;
  }
  return formatCurveDetail(launch, await getCurveSnapshot(launch));
}

export async function getCurveTrades(curveAddress) {
  const iface = new ethers.Interface(CURVE_ABI);
  const filter = {
    address: curveAddress,
    fromBlock: 0,
    toBlock: "latest"
  };
  const logs = await provider.getLogs(filter);

  return logs
    .map((log) => {
      try {
        const parsed = iface.parseLog(log);
        if (!parsed || (parsed.name !== "Bought" && parsed.name !== "Sold")) {
          return null;
        }
        const args = parsed.args;
        return {
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          type: parsed.name === "Bought" ? "buy" : "sell",
          account: parsed.name === "Bought" ? args.buyer : args.seller,
          usdcIn: parsed.name === "Bought" ? args.usdcIn.toString() : "0",
          usdcOut: parsed.name === "Sold" ? args.usdcOut.toString() : "0",
          ltAmount: parsed.name === "Bought" ? args.ltIn.toString() : args.ltOut.toString(),
          tokenAmount: parsed.name === "Bought" ? args.tokenOut.toString() : args.tokenIn.toString(),
          tokenPrice: args.tokenPrice.toString()
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
}

