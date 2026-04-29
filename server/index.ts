import cors from "cors";
import express from "express";
import { campaignsRouter } from "./routes/campaigns.js";
import { sendRouter } from "./routes/send.js";

const app = express();
const port = Number(process.env.PORT ?? 5174);

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, name: "PeachMail" });
});

app.use("/api", sendRouter);
app.use("/api/campaigns", campaignsRouter);

app.listen(port, () => {
  console.log(`PeachMail server ready on http://localhost:${port}`);
});
