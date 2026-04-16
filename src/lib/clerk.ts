import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const publicRoutes = ["/", "/sign-in(.*)", "/sign-up(.*)"];
export const protectedRoutes = ["/workflow(.*)"];

export async function requireUser() {
  const session = await auth();

  if (!session.userId) {
    redirect("/sign-in");
  }

  return session.userId;
}
