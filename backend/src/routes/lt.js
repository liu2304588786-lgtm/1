import { Router } from "express";
import { getLeveragedTokens } from "../services/bouncetech.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const data = await getLeveragedTokens();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;

