import { z } from "zod";

/**
 * Centralized environment variable validation.
 * Validates at import-time so misconfiguration is caught early.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ADMIN_PASSWORD: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Environment variable validation failed:");
    result.error.issues.forEach((issue) => {
      console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    });
    throw new Error("Missing or invalid environment variables. See logs above.");
  }
  return result.data;
}

export const env = validateEnv();
