import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env file before accessing environment variables
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Use DIRECT_URL for migrations, fallback to DATABASE_URL for queries
    url: env("DIRECT_URL") || env("DATABASE_URL"),
  },
});
