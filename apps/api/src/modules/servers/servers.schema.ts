import { z } from "zod";

export const serverParamsSchema = z.object({
  id: z.string().uuid()
});

export const createServerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  templateId: z.string().min(1).max(100).optional(),
  version: z.string().max(20).optional(),
  motd: z.string().max(120).optional(),
  difficulty: z.enum(["peaceful", "easy", "normal", "hard"]).optional(),
  gameMode: z.enum(["survival", "creative", "adventure", "spectator"]).optional(),
  maxPlayers: z.coerce.number().int().min(1).max(500).optional(),
  hostnameSlug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(32)
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/)
    .optional()
});

export const updateServerSettingsSchema = z
  .object({
    motd: z.string().trim().min(1).max(120).optional(),
    difficulty: z.enum(["peaceful", "easy", "normal", "hard"]).optional(),
    gameMode: z.enum(["survival", "creative", "adventure", "spectator"]).optional(),
    maxPlayers: z.coerce.number().int().min(1).max(500).optional(),
    whitelistEnabled: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update."
  });

export type CreateServerInput = z.infer<typeof createServerSchema>;
export type UpdateServerSettingsInput = z.infer<typeof updateServerSettingsSchema>;
