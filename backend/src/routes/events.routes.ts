import { Router } from "express";
import { addSseClient } from "../services/sse.js";
import { verifyToken } from "../utils/jwt.js";

export const eventsRouter = Router();

/*
 * EventSource cannot set request headers, so the JWT travels as a query
 * parameter. morgan skips /events so the token never reaches the logs.
 */
eventsRouter.get("/", (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    res.status(401).json({ error: { message: "Invalid or expired token", code: "UNAUTHORIZED" } });
    return;
  }

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write(":connected\n\n");

  const removeClient = addSseClient(payload.sub, payload.role, res);
  req.on("close", removeClient);
});
