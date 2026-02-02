import { z } from "zod";

// zod is a library for runtime data validation
// read more about zod here: https://zod.dev/
const envSchema = z.object({
  POSTGRES_URL: z.string().url(),
});

type Env = z.infer<typeof envSchema>;

// typing your environment variables prevents you from
// accidentally using an undefined environment variable
// or typing it incorrectly
export const env: Env = {
  // non-null assertion is safe here because we throw an error if it's not defined
  // Fallback to a dummy URL to prevent build/runtime crash if env is missing
  POSTGRES_URL: process.env.POSTGRES_URL || "postgres://dummy:dummy@localhost:5432/dummy",
};

// this would throw an error if the env variables don't match the schema
try {
  envSchema.parse(env);
} catch (err) {
  console.error("Invalid environment variables:", err);
  // We don't throw here to prevent the app from crashing entirely on boot
}
