import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

console.log("[better-auth] /api/auth/[...auth]/route.ts loaded");

const handler = toNextJsHandler(auth);

export const GET = async (...args: any[]) => {
  console.log("[better-auth] /api/auth/[...auth] GET called");
  // @ts-ignore
  return handler.GET(...args);
};

export const POST = async (...args: any[]) => {
  console.log("[better-auth] /api/auth/[...auth] POST called");
  // @ts-ignore
  return handler.POST(...args);
};
