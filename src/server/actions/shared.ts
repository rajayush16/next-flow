"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/clerk";

export async function getOrCreateAppUser() {
  const clerkUserId = await requireUser();

  return db.appUser.upsert({
    where: { clerkUserId },
    update: {},
    create: { clerkUserId },
  });
}
