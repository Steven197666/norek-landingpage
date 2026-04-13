"use client";

import { useMemo } from "react";
import LegalPageShell from "@/components/legal/LegalPageShell";
import {
  getActiveChallengeLocale,
  getLegalPageContent,
  getLegalPageMeta,
} from "@/lib/legal-content";

export default function AgbPage() {
  const locale = useMemo(() => getActiveChallengeLocale(), []);
  const content = useMemo(() => getLegalPageContent("agb", locale), [locale]);
  const meta = useMemo(() => getLegalPageMeta("agb", locale), [locale]);

  return (
    <LegalPageShell
      backLabel={meta.back}
      eyebrow={content.eyebrow}
      title={content.title}
      intro={content.intro}
      sections={content.sections}
      badges={meta.badges}
      warningTitle={meta.warningTitle}
      warningText={meta.warningText}
      languageNoticeTitle={meta.languageNoticeTitle}
      languageNoticeText={meta.languageNoticeText}
    />
  );
}