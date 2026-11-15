#!/usr/bin/env node
// Asks for the admin password (it isn't shown while you type) and prints
// ADMIN_PASSWORD_HASH for .env.local or Vercel. The password itself is never saved.
//
//   pnpm admin:hash
//
// Must stay in step with src/lib/admin/password.ts (a unit test checks this).

import { randomBytes, scrypt } from "node:crypto";
import { pathToFileURL } from "node:url";

const N = 32768;
const R = 8;
const P = 1;
const KEY_LEN = 32;
const MIN_LENGTH = 12;

export function hashPassword(password) {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 }, (err, key) => {
      if (err) reject(err);
      else resolve(["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join(":"));
    });
  });
}

function askHidden(prompt) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      reject(new Error("Run this in a terminal, so the password can be typed without showing."));
      return;
    }
    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    let value = "";
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      process.stdout.write("\n");
    };
    function onData(chunk) {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          cleanup();
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    }
    stdin.on("data", onData);
  });
}

async function main() {
  const first = await askHidden("Admin password: ");
  if (first.length < MIN_LENGTH) {
    console.error(`Use at least ${MIN_LENGTH} characters. A short phrase of a few words works well.`);
    process.exit(1);
  }
  const second = await askHidden("Type it again: ");
  if (first !== second) {
    console.error("The two passwords don't match. Nothing was printed.");
    process.exit(1);
  }
  const hash = await hashPassword(first);
  console.log("\nAdd this line to .env.local, and the value to Vercel → Settings → Environment Variables:\n");
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
