import { Router } from "express";
import { getCurveTrades, getTokenDetail, getTokenList } from "../services/onchain.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const status = req.query.status;
    const tokens = await getTokenList();
    const filtered =
      status === "graduated"
        ? tokens.filter((token) => token.graduated)
        : status === "live"
          ? tokens.filter((token) => !token.graduated)
          : tokens;
    res.json({ data: filtered });
  } catch (error) {
    next(error);
  }
});

router.get("/:curve", async (req, res, next) => {
  try {
    const detail = await getTokenDetail(req.params.curve);
    if (!detail) {
      res.status(404).json({ error: "Token not found" });
      return;
    }
    res.json({ data: detail });
  } catch (error) {
    next(error);
  }
});

router.get("/:curve/trades", async (req, res, next) => {
  try {
    const trades = await getCurveTrades(req.params.curve);
    res.json({ data: trades });
  } catch (error) {
    next(error);
  }
});

export default router;

