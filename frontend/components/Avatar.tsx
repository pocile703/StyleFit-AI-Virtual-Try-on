"use client";

import { imageUrl, User } from "@/lib/api";

const SIZES = {
  sm: "w-7 h-7 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-20 h-20 text-2xl",
} as const;

/** User avatar: uploaded photo when set, initial letter otherwise. */
export default function Avatar({
  user,
  size = "md",
  className = "",
}: {
  user: Pick<User, "name" | "avatarUrl">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (user.avatarUrl) {
    return (
      <img
        src={imageUrl(user.avatarUrl)}
        alt={`${user.name}'s profile photo`}
        loading="lazy"
        decoding="async"
        className={`${SIZES[size]} rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      // `stone`, not `ash` — the initial letter runs at 12px in the `sm` size,
      // where ash on paper measures 4.17:1 and misses AA. Same fix the wordmark
      // already took.
      className={`grid place-items-center ${SIZES[size]} rounded-full bg-stone text-paper font-semibold ${className}`}
    >
      {user.name.charAt(0).toUpperCase()}
    </span>
  );
}
