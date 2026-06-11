import { z } from "zod";

export const signupSchema = z.object({
  email: z
    .email("Invalid email address")
    .max(254, "Email is too long")
    .transform((value) => value.trim().toLowerCase()),
  // bcrypt only uses the first 72 bytes — cap so no silent truncation
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  name: z.string().trim().min(1, "Name cannot be empty").max(100).optional(),
});

export const loginSchema = z.object({
  email: z
    .email("Invalid email address")
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
