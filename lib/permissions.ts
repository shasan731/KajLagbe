import type { UserRole } from "@prisma/client";

export function canCreateListing(role: UserRole): boolean {
  return role === "PROVIDER" || role === "ADMIN";
}

export function canModerate(role: UserRole): boolean {
  return role === "ADMIN";
}

export function isOwner(currentUserId: string, ownerId: string): boolean {
  return currentUserId === ownerId;
}
