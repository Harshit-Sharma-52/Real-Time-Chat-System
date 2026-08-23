import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  avatar: z.string().optional(),
  bio: z.string().max(200).optional(),
});
