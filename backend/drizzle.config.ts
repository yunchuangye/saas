import type { Config } from "drizzle-kit";

export default {
  schema: "./server/lib/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "gujia",
    password: process.env.DB_PASSWORD || "gujia123456",
    database: process.env.DB_NAME || "gujia",
  },
} satisfies Config;
