import { config, loadDeployment } from "../config.js";
import { USDC_ADDRESS } from "@bouncetech/contracts";

export async function getLeveragedTokens() {
  const deployment = loadDeployment();
  if (deployment?.mode === "mock") {
    const defaultUsdc = deployment?.mockUsdc || "";
    return (deployment?.leveragedTokens ?? []).map((item) => ({
      ...item,
      usdcAddress: item.usdcAddress || defaultUsdc
    }));
  }

  try {
    const response = await fetch(`${config.bounceBaseUrl}/leveraged-tokens`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    return (payload.data ?? []).map((item) => ({
      ...item,
      usdcAddress: USDC_ADDRESS
    }));
  } catch {
    const defaultUsdc = deployment?.usdc || deployment?.mockUsdc || "";
    return (deployment?.leveragedTokens ?? []).map((item) => ({
      ...item,
      usdcAddress: item.usdcAddress || defaultUsdc
    }));
  }
}
