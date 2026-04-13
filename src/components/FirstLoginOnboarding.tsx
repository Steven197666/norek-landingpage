"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Viewer = {
  id: string;
  username?: string | null;
};

type FirstLoginOnboardingProps = {
  viewer: Viewer | null;
};

type Slide = {
  eyebrow: string;
  title: string;
  text: string;
};

const slides: Slide[] = [
  {
    eyebrow: "Willkommen bei DarePay",
    title: "Hier treten Nutzer in echten Challenges gegeneinander an",
    text:
      "DarePay ist keine normale Video-Plattform. Hier gibt es Challenges, Konkurrenz, Voting und einen Pot. Nutzer treten an, die Community bewertet, der stärkste Versuch gewinnt.",
  },
  {
    eyebrow: "Teilnahme",
    title: "So machst du mit",
    text:
      "Du nimmst eine Challenge an und reichst deinen Versuch direkt in der App ein – je nach Challenge live oder als verifizierte Aufnahme. Nur regelkonforme und gültige Versuche kommen in die Wertung.",
  },
  {
    eyebrow: "Gewinnen",
    title: "Nicht Support entscheidet – sondern dein Versuch",
    text:
      "Der Pot macht Challenges spannender, aber gewinnen kann ihn nur, wer einen gültigen Versuch einreicht und im Voting überzeugt. Entscheidend ist nicht Glück, sondern wie stark dein Beitrag im Vergleich zu den anderen ist.",
  },
];

export default function FirstLoginOnboarding({
  viewer,
}: FirstLoginOnboardingProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  const storageKey = useMemo(() => {
    if (!viewer?.id) return null;
    return `darepay_onboarding_seen_${viewer.id}`;
  }, [viewer?.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !viewer?.id || !storageKey) return;

    const alreadySeen = window.localStorage.getItem(storageKey);
    if (!alreadySeen) {
      setOpen(true);
    }
  }, [mounted, viewer?.id, storageKey]);

  function closeAndRemember() {
    if (storageKey) {
      window.localStorage.setItem(storageKey, "1");
    }
    setOpen(false);
  }

  function handleNext() {
    if (step < slides.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }
    closeAndRemember();
  }

  function handleBack() {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  }

  if (!viewer?.id) return null;

  const current = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeAndRemember}
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-amber-300/20 bg-[#0f172a] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          >
            <div className="bg-gradient-to-r from-amber-400/15 via-orange-300/10 to-white/[0.04] p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                    {current.eyebrow}
                  </p>
                  <h2 className="mt-3 text-2xl md:text-3xl font-black leading-tight text-white">
                    {current.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeAndRemember}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Schließen
                </button>
              </div>

              <p className="mt-5 max-w-xl text-sm md:text-base leading-7 text-white/80">
                {current.text}
              </p>

              <div className="mt-6 flex items-center gap-2">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={[
                      "h-2 rounded-full transition-all",
                      index === step
                        ? "w-8 bg-amber-300"
                        : "w-2 bg-white/20",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-3 border-t border-white/10 bg-white/[0.03] p-6 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-semibold text-white">
                  Challenge
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Nutzer erstellen Aufgaben mit Regeln, Ziel und Anforderungen.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-semibold text-white">Teilnahme</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Du trittst mit einem echten Versuch an – nicht mit irgendeinem Fake-Clip.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-semibold text-white">Voting</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Die Community bewertet die Beiträge. Der stärkste Versuch gewinnt.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 0}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Zurück
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeAndRemember}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                >
                  Später
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-2xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-amber-300"
                >
                  {isLast ? "Verstanden" : "Weiter"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}