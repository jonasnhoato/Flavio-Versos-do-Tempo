import { clerkClient, getAuth } from "@clerk/express";
import type { Request } from "express";

// The owner is configured on the server, never by the browser or by signup order.
export async function isAuthor(req: Request): Promise<boolean> {
  const { userId } = getAuth(req);
  const authorEmail = process.env.AUTHOR_EMAIL?.trim().toLowerCase();
  if (!userId || !authorEmail) return false;
  const user = await clerkClient.users.getUser(userId);
  return user.emailAddresses.some(
    (email) => email.verification?.status === "verified" &&
      email.emailAddress.trim().toLowerCase() === authorEmail,
  );
}