#!/usr/bin/env node
// Prints a random secret admin address and a cookie-signing secret.
//
//   pnpm admin:secrets
//
// Run it once. Keep ADMIN_PATH private: anyone who knows it can see the sign-in page
// (they still need the password). Changing ADMIN_SESSION_SECRET signs everyone out.

import { randomBytes } from "node:crypto";

const adminPath = randomBytes(24).toString("base64url");
const sessionSecret = randomBytes(32).toString("base64url");

console.log("Add these lines to .env.local, and the values to Vercel → Settings → Environment Variables:\n");
console.log(`ADMIN_PATH=${adminPath}`);
console.log(`ADMIN_SESSION_SECRET=${sessionSecret}\n`);
console.log(`Your admin page will be at https://<your site>/${adminPath}`);
