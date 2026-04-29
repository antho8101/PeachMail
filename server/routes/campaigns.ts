import { Router } from "express";
import { getRecentLogs } from "../db.js";

export const campaignsRouter = Router();

campaignsRouter.get("/recent", (_request, response) => {
  response.json({ logs: getRecentLogs(25) });
});
