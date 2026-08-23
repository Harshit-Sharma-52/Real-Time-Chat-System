import { z } from 'zod';

export const analyzeSchema = z.object({
  text: z.string().trim().min(1, 'Text is required.').max(20000, 'Text too long.'),
});

export const actionSchema = z.object({
  text: z.string().trim().min(1, 'Action text is required.').max(2000, 'Action text too long.'),
  confirm: z.boolean().optional().default(false),
  sourceMessage: z.string().optional(),
});

export const memoryCreateSchema = z.object({
  type: z.enum(['person', 'project', 'preference', 'fact', 'decision']),
  title: z.string().trim().min(1, 'Title is required.').max(200),
  content: z.string().max(4000).optional().default(''),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  sourceMessage: z.string().optional(),
});

export const memoryUpdateSchema = z.object({
  type: z.enum(['person', 'project', 'preference', 'fact', 'decision']).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().max(4000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});
