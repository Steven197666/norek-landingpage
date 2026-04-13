"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import PrimaryButton from "@/components/ui/PrimaryButton";
import type { LegalSection } from "@/lib/legal-content";

export default function LegalPageShell({
  backLabel,
  eyebrow,
  title,
  intro,
  sections,
  badges,
  warningTitle,
  warningText,
  languageNoticeTitle,
  languageNoticeText,
}: {
  backLabel?: string;
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  badges?: string[];
  warningTitle?: string;
  warningText?: string;
  languageNoticeTitle?: string;
  languageNoticeText?: string;
}) {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-950">
      <div className="mx-auto max-w-5xl p-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="mb-6 flex flex-wrap gap-2">
            <Link href="/challenges">
              <PrimaryButton variant="secondary">
                {`← ${backLabel || "Zurück"}`}
              </PrimaryButton>
            </Link>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl sm:p-8">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                {eyebrow}
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                {title}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {intro}
              </p>

              {badges?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {warningTitle || warningText ? (
            <section className="mt-6 rounded-[24px] border border-amber-300/30 bg-amber-200/10 p-5 text-amber-100">
              {warningTitle ? <h2 className="text-base font-bold">{warningTitle}</h2> : null}
              {warningText ? <p className="mt-2 text-sm leading-6">{warningText}</p> : null}
            </section>
          ) : null}

          {languageNoticeTitle || languageNoticeText ? (
            <section className="mt-4 rounded-[24px] border border-sky-300/25 bg-sky-300/10 p-5 text-sky-100">
              {languageNoticeTitle ? (
                <h2 className="text-base font-bold">{languageNoticeTitle}</h2>
              ) : null}
              {languageNoticeText ? (
                <p className="mt-2 text-sm leading-6">{languageNoticeText}</p>
              ) : null}
            </section>
          ) : null}

          <div className="mt-6 grid gap-4">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl ring-1 ring-black/5"
              >
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                  {section.title}
                </h2>

                {section.paragraphs?.map((p, idx) => (
                  <p
                    key={idx}
                    className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700"
                  >
                    {p}
                  </p>
                ))}

                {section.bullets?.length ? (
                  <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}