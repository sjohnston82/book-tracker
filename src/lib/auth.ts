import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

// console.log("[better-auth] Loaded environment variables:");
// console.log("DATABASE_URL:", process.env.DATABASE_URL);
// console.log("BETTER_AUTH_SECRET:", process.env.BETTER_AUTH_SECRET);
// console.log("BASE_URL:", process.env.BASE_URL);

const prisma = new PrismaClient();

// Wrap the Prisma adapter to add logging for user creation
function prismaAdapterWithLogging(prisma: any, options: any) {
  const adapter = prismaAdapter(prisma, options);
  // Patch the createUser method to log input and errors
  const adapterAny = adapter as any;
  if (adapterAny.createUser) {
    const origCreateUser = adapterAny.createUser;
    adapterAny.createUser = async function (data: any) {
      console.log("[better-auth] Attempting to create user:", data);
      try {
        const user = await origCreateUser.call(this, data);
        console.log("[better-auth] User created:", user);
        return user;
      } catch (err) {
        console.error("[better-auth] Error creating user:", err);
        throw err;
      }
    };
  }
  return adapterAny;
}

const betterAuthConfig = {
  database: prismaAdapterWithLogging(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BASE_URL,
  trustedOrigins: [
    "http://localhost:3000",
    "https://95032832a354.ngrok-free.app",
  ],
};

console.log(
  "[better-auth] Loaded config:",
  JSON.stringify({
    ...betterAuthConfig,
    database: "[prismaAdapterWithLogging]", // avoid printing the whole adapter
  })
);

const better = betterAuth(betterAuthConfig);

export const handler = better.handler;
export const api = better.api;
export const auth = better; // the main auth function is the default export
