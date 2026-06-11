import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";
import { taskRouter } from "./routes/task.routes.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN }));
if (process.env.NODE_ENV !== "test") {
  // /events carries the JWT as a query parameter (EventSource limitation) — keep it out of logs
  app.use(morgan("dev", { skip: (req) => req.path.startsWith("/events") }));
}
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/tasks", taskRouter);

app.use(notFoundHandler);
app.use(errorHandler);
