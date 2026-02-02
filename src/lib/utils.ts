import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// this utility function is used to merge tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// generate a random avatar for a user
export function getAvatar(username?: string | null) {
  const seed = username ? username : "default";
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}


export function validateHandle(handle?: string | null) {
  if (!handle) return false;
  return /^[a-z0-9\\._-]{1,25}$/.test(handle);
}

export function validateUsername(username?: string | null) {
  if (!username) return false;
  return /^[a-zA-Z0-9 ]{1,50}$/.test(username);
}
