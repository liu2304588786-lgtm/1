import { ethers } from "ethers";
import { config } from "../config.js";

export const provider = new ethers.JsonRpcProvider(config.rpcUrl);

