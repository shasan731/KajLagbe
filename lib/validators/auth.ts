import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/u, "Enter a valid Bangladeshi phone (e.g. 017XXXXXXXX)");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "Password is too long");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(80),
    phone,
    email: z.string().trim().email().optional().or(z.literal("").transform(() => undefined)),
    password,
    confirmPassword: z.string(),
    role: z.enum(["CUSTOMER", "PROVIDER"]),
    city: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
    area: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  phone,
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
