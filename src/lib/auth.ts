import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


const prodURL =
  process.env.BASE_URL ??
  "https://book-tracker-g4o8y8oc9-sjohnston82s-projects.vercel.app";

const localhost = "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: prodURL,
  trustedOrigins: [prodURL, localhost],
  plugins: [nextCookies()],
});
