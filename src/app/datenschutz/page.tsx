"use client";

import { useMemo } from "react";
import LegalPageShell from "@/components/legal/LegalPageShell";
import {
  getActiveChallengeLocale,
  getLegalPageContent,
} from "@/lib/legal-content";

export default function DatenschutzPage() {
  const locale = useMemo(() => getActiveChallengeLocale(), []);
  const content = useMemo(
    () => getLegalPageContent("datenschutz", locale),
    [locale]
  );

  return (
    <LegalPageShell
      eyebrow={content.eyebrow}
      title={content.title}
      intro={content.intro}
      sections={content.sections}
    />
  );
}