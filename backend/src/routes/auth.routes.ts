import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, authUser } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { signToken } from "../utils/jwt.js";
import { signupSchema, loginSchema, type SignupInput, type LoginInput } from "../schemas/auth.schema.js";

export const authRouter = Router();

/** Fields safe to expose — passwordHash never leaves the API. */
const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
} as const;

authRouter.post("/signup", validateBody(signupSchema), async (req, res) => {
  const { email, password, name } = req.body as SignupInput;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists", "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: publicUserSelect,
  });

  const token = signToken({ sub: user.id, role: user.role });
  res.status(201).json({ user, token });
});

authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordValid = user !== null && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !passwordValid) {
    // Deliberately generic — do not reveal whether the email exists
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const token = signToken({ sub: user.id, role: user.role });
  const { passwordHash: _ignored, ...publicUser } = user;
  res.json({ user: publicUser, token });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const { id } = authUser(req);

  const user = await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
  if (!user) {
    throw new ApiError(401, "Account no longer exists", "UNAUTHORIZED");
  }

  res.json({ user });
});
