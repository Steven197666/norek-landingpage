import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";

type Props = {
  username?: string | null;
  avatarUrl?: string | null;
  className?: string;
  avatarSize?: number;
  showAt?: boolean;
};

export default function UserLink({
  username,
  avatarUrl,
  className = "",
  avatarSize = 32,
  showAt = true,
}: Props) {
  if (!username) return null;

  const clean = String(username).replace(/^@/, "").trim();
  if (!clean) return null;

  const href = `/users/${clean}`;

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 font-semibold text-slate-900 hover:underline ${className}`}
      title={`Profil von @${clean} öffnen`}
    >
      <UserAvatar
        username={clean}
        avatarUrl={avatarUrl}
        size={avatarSize}
        href={null}
      />
      <span>{showAt ? `@${clean}` : clean}</span>
    </Link>
  );
}