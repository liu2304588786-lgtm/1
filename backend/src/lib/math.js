const E18 = 10n ** 18n;
const E6 = 10n ** 6n;
const CURVE_SUPPLY = 750_000_000n * E18;
const GRAD_THRESHOLD = 9_000n * E6;

export function bigintToString(value) {
  return typeof value === "bigint" ? value.toString() : String(value);
}

export function computeProgress(realReserveX, realReserveY, ltPrice) {
  const sold = CURVE_SUPPLY - realReserveX;
  const ltUsdValue = (realReserveY * ltPrice) / E18;
  const supplyProgressBps = CURVE_SUPPLY === 0n ? 0n : (sold * 10_000n) / CURVE_SUPPLY;
  const usdProgressBps = GRAD_THRESHOLD === 0n ? 0n : (ltUsdValue * 10_000n) / GRAD_THRESHOLD;
  return {
    sold,
    ltUsdValue,
    progressBps: supplyProgressBps > usdProgressBps ? supplyProgressBps : usdProgressBps
  };
}

export function formatCurveDetail(launch, state) {
  const { sold, ltUsdValue, progressBps } = computeProgress(state.realReserveX, state.realReserveY, state.ltPrice);
  return {
    creator: launch.creator,
    tokenAddress: launch.token,
    curveAddress: launch.curve,
    lockerAddress: launch.locker,
    ltAddress: launch.ltToken,
    usdcAddress: state.usdc,
    poolAddress: state.pool,
    name: launch.name,
    symbol: launch.symbol,
    imageUri: launch.imageUri,
    description: launch.description,
    createdAt: Number(launch.createdAt),
    graduated: state.graduated,
    shouldGraduate: state.shouldGraduate,
    tokenPrice: bigintToString(state.tokenPrice),
    ltPrice: bigintToString(state.ltPrice),
    virtualReserveX: bigintToString(state.virtualReserveX),
    virtualReserveY: bigintToString(state.virtualReserveY),
    realReserveX: bigintToString(state.realReserveX),
    realReserveY: bigintToString(state.realReserveY),
    graduationLiquidityToken: bigintToString(state.gradTokenLiquidity),
    graduationLiquidityLt: bigintToString(state.gradLtLiquidity),
    sold: bigintToString(sold),
    ltUsdValue: bigintToString(ltUsdValue),
    progressBps: Number(progressBps)
  };
}

