#!/usr/bin/env node
// Prints a random key for signing the admin cookie.
//
//   pnpm admin:secrets
//
// Run it once. Changing ADMIN_SESSION_SECRET later signs everyone out.

import { randomBytes } from "node:crypto";

const sessionSecret = randomBytes(32).toString("base64url");

console.log("Add this line to .env.local, and the value to Vercel → Settings → Environment Variables:\n");
console.log(`ADMIN_SESSION_SECRET=${sessionSecret}\n`);
