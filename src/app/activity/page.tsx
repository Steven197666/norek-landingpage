import Link from "next/link";

export default function ActivityPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
        <h1 className="text-3xl font-black tracking-tight">Aktivitaet</h1>
        <p className="mt-3 text-sm text-slate-300">
          Diese Seite ist vorbereitet. Hier kannst du als naechstes den globalen
          Aktivitaets-Feed integrieren.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/profile"
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/15"
          >
            Zum Profil
          </Link>
          <Link
            href="/challenges"
            className="rounded-xl border border-sky-300/30 bg-sky-400/15 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/25"
          >
            Zu Challenges
          </Link>
        </div>
      </div>
    </main>
  );
}
