import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "@workspace/db";
import { signToken, requireAuth } from "../middlewares/auth";
import type { JwtPayload } from "../middlewares/auth";
import type { Request } from "express";
import { z } from "zod";

const router: IRouter = Router();

const RegisterBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["user", "admin"]).default("user"),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function formatUser(user: InstanceType<typeof UserModel>) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    virtualBalance: user.virtualBalance,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, role } = parsed.data;

  const existing = await UserModel.findOne({ email });
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ name, email, passwordHash, role });
  const token = signToken({ userId: user._id.toString(), role: user.role });
  res.status(201).json({ token, user: formatUser(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const user = await UserModel.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user._id.toString(), role: user.role });
  res.json({ token, user: formatUser(user) });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as Request & { user: JwtPayload }).user;
  const user = await UserModel.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

export default router;
