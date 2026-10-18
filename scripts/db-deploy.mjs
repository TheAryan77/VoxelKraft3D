// Applies database migrations during a Vercel build, but only once a database
// is connected (DATABASE_URL set). Before that, the build still succeeds and the
// landing page works; shop pages need the database.
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("[db-deploy] DATABASE_URL not set, skipping migrations.");
} else {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
