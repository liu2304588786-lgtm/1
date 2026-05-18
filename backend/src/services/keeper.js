import { ethers } from "ethers";
import { config } from "../config.js";
import { CURVE_ABI } from "../lib/abis.js";
import { provider } from "../lib/provider.js";
import { getLaunches } from "./onchain.js";

export async function startKeeper() {
  if (!config.keeperPrivateKey) {
    console.log("Keeper disabled: missing KEEPER_PRIVATE_KEY");
    return;
  }

  const signer = new ethers.Wallet(config.keeperPrivateKey, provider);

  setInterval(async () => {
    try {
      const launches = await getLaunches();
      for (const launch of launches) {
        const curve = new ethers.Contract(launch.curve, CURVE_ABI, signer);
        const [graduated, shouldGraduate] = await Promise.all([curve.graduated(), curve.checkGraduation()]);
        if (!graduated && shouldGraduate) {
          const tx = await curve.graduate();
          await tx.wait();
          console.log(`Graduated ${launch.symbol}: ${tx.hash}`);
        }
      }
    } catch (error) {
      console.error("Keeper error:", error.message);
    }
  }, config.keeperPollMs);
}

