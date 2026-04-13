export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#03060d] text-white">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10),transparent_30%),radial-gradient(circle_at_bottom,rgba(29,78,216,0.08),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(255,255,255,0))]" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
          <section className="w-full max-w-3xl rounded-[32px] border border-white/8 bg-white/[0.03] p-8 shadow-[0_0_60px_rgba(15,23,42,0.45)] backdrop-blur-md md:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-8">
                <img
                  src="/Logo-mit-Slogan.jpg"
                  alt="NOREK Logo"
                  className="h-auto w-full max-w-[340px] md:max-w-[400px]"
                />
              </div>

              <div className="mb-5 inline-flex items-center rounded-full border border-blue-400/15 bg-blue-500/8 px-4 py-2 text-sm font-medium text-blue-200/90">
                Coming Soon
              </div>

              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Unsere Website befindet sich aktuell noch im Aufbau.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-white/68 md:text-lg">
                NOREK geht bald online. Wir arbeiten aktuell an der finalen
                Plattform und einer starken Community rund um Challenges,
                Leistung und echte Umsetzung.
              </p>

              <p className="mt-4 max-w-xl text-sm leading-7 text-white/42 md:text-base">
                Danke für deine Geduld – schon bald findest du hier mehr.
              </p>

              <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/70">
                norek.app
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}