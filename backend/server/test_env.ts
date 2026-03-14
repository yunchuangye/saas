import * as dotenv from "dotenv";
import * as path from "path";
console.log("__dirname:", __dirname);
const envPath = path.resolve(__dirname, "../../.env");
console.log("env path:", envPath);
dotenv.config({ path: envPath });
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_HOST:", process.env.DB_HOST);
process.exit(0);
