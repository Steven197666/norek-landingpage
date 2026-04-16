import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { normalizeProfileHandle, toPublicProfilePath } from "@/lib/profile-route";

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
  const clean = normalizeProfileHandle(username);
  if (!clean) return null;

  const href = toPublicProfilePath(clean);
  if (!href) return null;

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 font-semibold text-slate-900 hover:underline ${className}`}
      title={`Profil öffnen (@${clean})`}
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