import { Router } from "express";
import { getTokenList } from "../services/onchain.js";

const router = Router();

router.get("/overview", async (_req, res, next) => {
  try {
    const tokens = await getTokenList();
    const graduated = tokens.filter((token) => token.graduated).length;
    const live = tokens.length - graduated;
    res.json({
      data: {
        totalTokens: tokens.length,
        liveTokens: live,
        graduatedTokens: graduated
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

