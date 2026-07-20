import { z } from "zod";

export const statsQuerySchema = z.object({
  period: z.enum(["7d", "30d", "90d", "365d", "all"]).default("30d"),
});
