"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo } from "react";

type ChallengeLocale = "de" | "en" | "es" | "fr";

function normalizeLocale(input: string | null | undefined): ChallengeLocale {
  const raw = String(input ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 2);

  if (raw === "en" || raw === "es" || raw === "fr") return raw;
  return "de";
}

function getActiveChallengeLocale(): ChallengeLocale {
  if (typeof window === "undefined") return "de";

  const stored =
    window.localStorage.getItem("app_locale") ||
    window.localStorage.getItem("locale") ||
    window.localStorage.getItem("language");

  if (stored) return normalizeLocale(stored);
  return normalizeLocale(window.navigator.language);
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={fadeUp}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur md:p-8"
    >
      <h2 className="text-xl font-bold text-white md:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-white/80 md:text-base">
        {children}
      </div>
    </motion.section>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 font-bold text-black">
          {number}
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-white/75">{text}</p>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/75">{text}</p>
    </div>
  );
}

type HelpUi = {
  badge: string;
  heroTitle: string;
  heroText: string;
  heroChallenges: string;
  heroCreate: string;

  section1Title: string;
  section1P1: string;
  section1P2: string;
  section1P3: string;

  section2Title: string;
  step1Title: string;
  step1Text: string;
  step2Title: string;
  step2Text: string;
  step3Title: string;
  step3Text: string;
  step4Title: string;
  step4Text: string;
  step5Title: string;
  step5Text: string;
  step6Title: string;
  step6Text: string;

  section3Title: string;
  card1Title: string;
  card1Text: string;
  card2Title: string;
  card2Text: string;
  card3Title: string;
  card3Text: string;
  card4Title: string;
  card4Text: string;
  card5Title: string;
  card5Text: string;
  card6Title: string;
  card6Text: string;

  section4Title: string;
  section4P1: string;
  section4P2: string;
  section4P3: string;
  section4P4: string;

  section5Title: string;
  section5P1: string;
  section5P2: string;
  section5P3: string;
  section5P4: string;

  section6Title: string;
  section6P1: string;
  section6P2: string;
  section6P3: string;
  section6P4: string;

  section7Title: string;
  section7P1: string;
  section7P2: string;
  section7P3: string;
  section7P4: string;

  section8Title: string;
  section8P1: string;
  section8P2: string;
  section8P3: string;
  section8P4: string;

  section9Title: string;
  section9Intro: string;
  rule1: string;
  rule2: string;
  rule3: string;
  rule4: string;
  rule5: string;
  section9Outro: string;

  section10Title: string;
  faq1Q: string;
  faq1A: string;
  faq2Q: string;
  faq2A: string;
  faq3Q: string;
  faq3A: string;
  faq4Q: string;
  faq4A: string;
  faq5Q: string;
  faq5A: string;

  ctaTitle: string;
  ctaText: string;
  ctaChallenges: string;
  ctaCreate: string;
};

const HELP_UI: Record<ChallengeLocale, HelpUi> = {
  de: {
    badge: "Hilfe & Erklärung",
    heroTitle: "So funktioniert Norek",
    heroText:
      "Hier erfährst du, wie du Challenges findest, unterstützt, selbst teilnimmst und worauf du achten musst, damit dein Versuch gültig ist und im Voting eine echte Chance hat.",
    heroChallenges: "Zu den Challenges",
    heroCreate: "Challenge erstellen",

    section1Title: "1. Was ist Norek überhaupt?",
    section1P1:
      "Auf Norek kannst du Challenges entdecken, selbst antreten, Challenges unterstützen und mitverfolgen, wie andere Nutzer sich schlagen.",
    section1P2:
      "Für dich bedeutet das: Du konsumierst hier nicht einfach nur Inhalte, sondern kannst direkt Teil des Wettbewerbs werden.",
    section1P3:
      "Wenn du selbst mitmachst, zählt nicht irgendein beliebiger Clip, sondern dein echter Versuch. Wenn du zuschaust oder abstimmst, siehst du, wie sich eine Challenge entwickelt und wer am Ende wirklich überzeugt.",

    section2Title: "2. Wie läuft eine Challenge ab?",
    step1Title: "Challenge entdecken",
    step1Text:
      "Du findest eine Challenge mit Titel, Regeln, Ziel und möglichen Zusatzanforderungen wie Mindestdauer, Risikostufe oder 18+.",
    step2Title: "Pot wächst",
    step2Text:
      "Nutzer können die Challenge unterstützen und Geld in den Pot einzahlen. Dadurch wird sie für Teilnehmer attraktiver.",
    step3Title: "Teilnehmen",
    step3Text:
      "Wenn du mitmachen willst, reichst du deinen Versuch so ein, wie es die Challenge verlangt – live oder als verifizierte Aufnahme.",
    step4Title: "Voting startet",
    step4Text:
      "Sobald gültige Versuche vorliegen, beginnt die Voting-Phase. Dann kann die Community die Beiträge bewerten.",
    step5Title: "Gewinner steht fest",
    step5Text:
      "Nach Ablauf des Votings wird der stärkste Versuch ermittelt. Dieser Beitrag gewinnt die Challenge.",
    step6Title: "Challenge abgeschlossen",
    step6Text:
      "Am Ende ist das Ergebnis für alle sichtbar. Du kannst sehen, wer gewonnen hat und wie die Challenge ausgegangen ist.",

    section3Title: "3. Was kann ich auf Norek machen?",
    card1Title: "Challenges entdecken",
    card1Text:
      "Du kannst dir laufende und neue Challenges ansehen und prüfen, welche dich interessieren.",
    card2Title: "Challenges unterstützen",
    card2Text:
      "Du kannst Geld in bestehende Challenges einzahlen und damit den Pot erhöhen.",
    card3Title: "Selbst teilnehmen",
    card3Text:
      "Du kannst Challenges annehmen und deinen eigenen Versuch einreichen, um zu gewinnen.",
    card4Title: "Im Voting mitentscheiden",
    card4Text:
      "In der Voting-Phase kannst du bewerten, welcher Versuch aus deiner Sicht am meisten überzeugt.",
    card5Title: "Verfolgen, wie sich Challenges entwickeln",
    card5Text:
      "Auch ohne eigene Teilnahme kannst du sehen, wie weit eine Challenge ist und wer am Ende gewinnt.",
    card6Title: "Erfahrung sammeln",
    card6Text:
      "Wenn du aktiv teilnimmst, erfolgreich bist oder regelmäßig dabei bist, entwickelst du dich auf der Plattform weiter.",

    section4Title: "4. Wie nehme ich an einer Challenge teil?",
    section4P1:
      "Wenn du an einer Challenge teilnehmen willst, öffnest du die Detailseite und trittst der Challenge bei.",
    section4P2:
      "Danach reicht es nicht, einfach irgendein Video hochzuladen. Dein Versuch muss so eingereicht werden, wie es die jeweilige Challenge verlangt.",
    section4P3:
      "Je nach Challenge bedeutet das für dich: Du musst live teilnehmen oder eine verifizierte Aufnahme direkt in der App einreichen.",
    section4P4:
      "Wichtig ist nicht nur, dass dein Versuch spektakulär wirkt, sondern dass er die Regeln erfüllt. Wenn du die Vorgaben nicht einhältst, bringt dir selbst ein starker Clip am Ende nichts.",

    section5Title: "5. Wie funktioniert der Geldtopf?",
    section5P1:
      "Der Pot einer Challenge wächst durch Nutzer, die diese Challenge unterstützen.",
    section5P2:
      "Für dich heißt das: Ein höherer Pot kann eine Challenge interessanter machen und mehr Aufmerksamkeit oder stärkere Teilnehmer anziehen.",
    section5P3:
      "Wichtig ist aber: Unterstützen und Gewinnen sind nicht dasselbe. Nur weil du Geld in eine Challenge einzahlst, gewinnst du sie nicht automatisch.",
    section5P4:
      "Wenn du den Pot gewinnen willst, musst du selbst teilnehmen, einen gültigen Versuch einreichen und im Voting überzeugen.",

    section6Title: "6. Wie wird entschieden, wer gewinnt?",
    section6P1:
      "Gewinnen kannst du nicht durch Zufall, sondern nur mit einem starken Versuch.",
    section6P2:
      "Die Community bewertet die eingereichten Beiträge. Am Ende gewinnt der Versuch, der insgesamt am meisten überzeugt.",
    section6P3:
      "Je nach Challenge achten Nutzer dabei auf unterschiedliche Dinge: Leistung, saubere Erfüllung der Aufgabe, Kreativität, Unterhaltungswert oder Mut.",
    section6P4:
      "Für dich bedeutet das: Nicht nur mitmachen zählt, sondern wie gut du ablieferst. Wer die Regeln ignoriert, halbherzig antritt oder versucht zu tricksen, sollte im Wettbewerb keinen Vorteil haben.",

    section7Title: "7. Warum Live oder verifizierte Aufnahme?",
    section7P1: "Damit dein Versuch als echt und nachvollziehbar zählt.",
    section7P2:
      "Auf Norek soll nicht einfach irgendein altes, geschnittenes oder bearbeitetes Video als echter Versuch durchgehen. Je nach Challenge musst du deshalb live teilnehmen oder eine verifizierte Aufnahme direkt in der App einreichen.",
    section7P3:
      "Für dich bedeutet das: Dein Versuch wirkt glaubwürdiger, andere Nutzer können fairer bewerten und ehrliche Teilnehmer werden nicht durch fragwürdige Clips benachteiligt.",
    section7P4:
      "Welche Form der Einreichung gilt, siehst du direkt in der jeweiligen Challenge.",

    section8Title: "8. Was bedeuten Risiko und 18+?",
    section8P1:
      "Manche Challenges sind harmlos, andere sensibler oder nur für Erwachsene gedacht.",
    section8P2:
      "Wenn eine Challenge mit Risiko oder 18+ gekennzeichnet ist, bedeutet das für dich: Du solltest die Hinweise genau lesen und prüfen, ob du die Voraussetzungen für diese Teilnahme erfüllst.",
    section8P3:
      "Alters- und Risikokennzeichnungen helfen dir dabei, besser einzuschätzen, worauf du dich einlässt. Nicht jede Challenge ist für jeden Nutzer freigegeben.",
    section8P4:
      "Wichtig: Nur weil etwas Aufmerksamkeit bringt, ist es nicht automatisch sinnvoll oder erlaubt. Wenn eine Challenge gegen Sicherheit, Regeln oder gesunden Menschenverstand geht, solltest du daran nicht teilnehmen.",

    section9Title: "9. Faire Nutzung der Plattform",
    section9Intro:
      "Damit Norek fair bleibt, gelten für alle Nutzer klare Regeln:",
    rule1:
      "Reiche keine manipulierten oder zusammengeschnittenen Fake-Versuche ein",
    rule2:
      "Poste keine beleidigenden, menschenverachtenden oder illegalen Inhalte",
    rule3: "Umgehe keine Alters-, Risiko- oder Sicherheitsregeln",
    rule4: "Nur echte und gültige Versuche sollen im Voting landen",
    rule5:
      "Stimme fair ab und versuche nicht, das System künstlich zu verzerren",
    section9Outro:
      "Für dich heißt das: Wenn du ehrlich teilnimmst und die Regeln einhältst, bleibt der Wettbewerb glaubwürdig und nachvollziehbar – für dich und für alle anderen.",

    section10Title: "10. Häufige Fragen",
    faq1Q: "Muss ich selbst Geld einzahlen, um teilnehmen zu können?",
    faq1A:
      "Nicht automatisch. Unterstützen und teilnehmen sind zwei unterschiedliche Dinge. Entscheidend ist, was die jeweilige Challenge vorgibt.",
    faq2Q: "Kann ich einfach ein Video aus meiner Galerie hochladen?",
    faq2A:
      "Maßgeblich ist, wie die jeweilige Challenge die Einreichung verlangt. Der Fokus liegt auf echter Teilnahme direkt über die Plattform, damit der Wettbewerb fair und nachvollziehbar bleibt.",
    faq3Q: "Kann ich auch nur zuschauen?",
    faq3A:
      "Ja. Du kannst Challenges verfolgen, unterstützen und bei passenden Challenges mit abstimmen, ohne selbst teilzunehmen.",
    faq4Q: "Woran erkenne ich, ob ich teilnehmen darf?",
    faq4A:
      "Auf der Challenge-Seite siehst du die wichtigsten Anforderungen wie Risiko, 18+, Dauer und Art des Versuchs.",
    faq5Q: "Was passiert, wenn mein Versuch ungültig ist?",
    faq5A:
      "Dann sollte er nicht regulär im Wettbewerb gewertet werden. Nur gültige und regelkonforme Versuche sollen eine echte Chance auf den Sieg haben.",

    ctaTitle: "Bereit für deine erste Challenge?",
    ctaText:
      "Dann schau dir laufende Challenges an oder starte deine eigene. Wenn du gewinnst, dann nicht wegen Glück, sondern weil dein Versuch besser war.",
    ctaChallenges: "Challenges ansehen",
    ctaCreate: "Eigene Challenge starten",
  },

  en: {
    badge: "Help & explanation",
    heroTitle: "How Norek works",
    heroText:
      "Here you can learn how to find challenges, support them, participate yourself and what you need to keep in mind so your attempt is valid and has a real chance in voting.",
    heroChallenges: "Go to challenges",
    heroCreate: "Create challenge",

    section1Title: "1. What is Norek?",
    section1P1:
      "On Norek you can discover challenges, compete yourself, support challenges and follow how other users perform.",
    section1P2:
      "For you, that means you are not just consuming content here — you can directly become part of the competition.",
    section1P3:
      "If you take part yourself, not just any random clip counts, but your real attempt. If you watch or vote, you can see how a challenge develops and who really convinces in the end.",

    section2Title: "2. How does a challenge work?",
    step1Title: "Discover a challenge",
    step1Text:
      "You find a challenge with a title, rules, target and possible extra requirements such as minimum duration, risk level or 18+.",
    step2Title: "The pot grows",
    step2Text:
      "Users can support the challenge and add money to the pot. That makes it more attractive for participants.",
    step3Title: "Participate",
    step3Text:
      "If you want to join, you submit your attempt exactly the way the challenge requires — live or as a verified recording.",
    step4Title: "Voting starts",
    step4Text:
      "As soon as valid attempts exist, the voting phase begins. Then the community can rate the entries.",
    step5Title: "Winner is decided",
    step5Text:
      "After voting ends, the strongest attempt is determined. That entry wins the challenge.",
    step6Title: "Challenge completed",
    step6Text:
      "At the end, the result is visible to everyone. You can see who won and how the challenge ended.",

    section3Title: "3. What can I do on Norek?",
    card1Title: "Discover challenges",
    card1Text:
      "You can look through ongoing and new challenges and check which ones interest you.",
    card2Title: "Support challenges",
    card2Text:
      "You can add money to existing challenges and increase the pot.",
    card3Title: "Join yourself",
    card3Text:
      "You can accept challenges and submit your own attempt to win.",
    card4Title: "Help decide in voting",
    card4Text:
      "During the voting phase, you can rate which attempt convinces you the most.",
    card5Title: "Follow challenge progress",
    card5Text:
      "Even without participating yourself, you can see how far a challenge has progressed and who wins in the end.",
    card6Title: "Gain experience",
    card6Text:
      "If you participate actively, succeed or keep showing up, you develop further on the platform.",

    section4Title: "4. How do I participate in a challenge?",
    section4P1:
      "If you want to join a challenge, open the detail page and join the challenge there.",
    section4P2:
      "After that, it is not enough to just upload any video. Your attempt must be submitted exactly the way the specific challenge requires.",
    section4P3:
      "Depending on the challenge, this means: you must participate live or submit a verified recording directly in the app.",
    section4P4:
      "What matters is not only that your attempt looks spectacular, but that it follows the rules. If you do not follow the requirements, even a strong clip will not help you in the end.",

    section5Title: "5. How does the money pot work?",
    section5P1:
      "A challenge pot grows through users who support that challenge.",
    section5P2:
      "For you, that means a higher pot can make a challenge more interesting and attract more attention or stronger participants.",
    section5P3:
      "But this is important: supporting and winning are not the same thing. Just because you put money into a challenge does not mean you win it automatically.",
    section5P4:
      "If you want to win the pot, you have to participate yourself, submit a valid attempt and convince people in voting.",

    section6Title: "6. How is the winner decided?",
    section6P1:
      "You cannot win by luck, only with a strong attempt.",
    section6P2:
      "The community rates the submitted entries. In the end, the attempt that convinces the most overall wins.",
    section6P3:
      "Depending on the challenge, users may pay attention to different things: performance, clean execution of the task, creativity, entertainment value or courage.",
    section6P4:
      "For you, that means taking part alone is not enough — what matters is how well you deliver. Anyone who ignores the rules, competes half-heartedly or tries to cheat should not have an advantage.",

    section7Title: "7. Why live or verified recording?",
    section7P1: "So your attempt counts as real and traceable.",
    section7P2:
      "On Norek, not just any old, edited or manipulated video should pass as a real attempt. Depending on the challenge, you therefore have to participate live or submit a verified recording directly in the app.",
    section7P3:
      "For you, that means your attempt is more credible, other users can judge more fairly and honest participants are not disadvantaged by questionable clips.",
    section7P4:
      "You can see which submission format applies directly on the respective challenge.",

    section8Title: "8. What do risk and 18+ mean?",
    section8P1:
      "Some challenges are harmless, others are more sensitive or intended only for adults.",
    section8P2:
      "If a challenge is marked with risk or 18+, that means you should read the notices carefully and check whether you meet the requirements for participating.",
    section8P3:
      "Age and risk labels help you better judge what you are getting into. Not every challenge is available to every user.",
    section8P4:
      "Important: just because something attracts attention does not automatically make it smart or allowed. If a challenge goes against safety, rules or common sense, you should not take part.",

    section9Title: "9. Fair use of the platform",
    section9Intro:
      "To keep Norek fair, clear rules apply to all users:",
    rule1:
      "Do not submit manipulated or cut-together fake attempts",
    rule2:
      "Do not post insulting, hateful or illegal content",
    rule3:
      "Do not bypass age, risk or safety rules",
    rule4:
      "Only real and valid attempts should reach voting",
    rule5:
      "Vote fairly and do not try to distort the system artificially",
    section9Outro:
      "For you, that means: if you participate honestly and follow the rules, the competition stays credible and understandable — for you and for everyone else.",

    section10Title: "10. Frequently asked questions",
    faq1Q: "Do I have to pay money myself in order to participate?",
    faq1A:
      "Not automatically. Supporting and participating are two different things. What matters is what the specific challenge requires.",
    faq2Q: "Can I simply upload a video from my gallery?",
    faq2A:
      "What matters is how the specific challenge requires the submission. The focus is on real participation directly through the platform so the competition stays fair and understandable.",
    faq3Q: "Can I just watch?",
    faq3A:
      "Yes. You can follow challenges, support them and vote on suitable challenges without participating yourself.",
    faq4Q: "How do I know whether I am allowed to participate?",
    faq4A:
      "On the challenge page, you can see the main requirements such as risk, 18+, duration and the type of attempt.",
    faq5Q: "What happens if my attempt is invalid?",
    faq5A:
      "Then it should not be counted normally in the competition. Only valid attempts that follow the rules should have a real chance of winning.",

    ctaTitle: "Ready for your first challenge?",
    ctaText:
      "Then check out ongoing challenges or start your own. If you win, it will not be because of luck, but because your attempt was better.",
    ctaChallenges: "View challenges",
    ctaCreate: "Start your own challenge",
  },

  es: {
    badge: "Ayuda y explicación",
    heroTitle: "Así funciona Norek",
    heroText:
      "Aquí puedes ver cómo encontrar retos, apoyarlos, participar tú mismo y en qué debes fijarte para que tu intento sea válido y tenga una oportunidad real en la votación.",
    heroChallenges: "Ir a los retos",
    heroCreate: "Crear reto",

    section1Title: "1. ¿Qué es Norek?",
    section1P1:
      "En Norek puedes descubrir retos, competir tú mismo, apoyar retos y seguir cómo se desempeñan otros usuarios.",
    section1P2:
      "Para ti eso significa que aquí no solo consumes contenido, sino que puedes convertirte directamente en parte de la competición.",
    section1P3:
      "Si participas tú mismo, no cuenta cualquier clip cualquiera, sino tu intento real. Si observas o votas, puedes ver cómo evoluciona un reto y quién convence de verdad al final.",

    section2Title: "2. ¿Cómo funciona un reto?",
    step1Title: "Descubrir un reto",
    step1Text:
      "Encuentras un reto con título, reglas, objetivo y posibles requisitos extra como duración mínima, nivel de riesgo o 18+.",
    step2Title: "El bote crece",
    step2Text:
      "Los usuarios pueden apoyar el reto y añadir dinero al bote. Eso lo hace más atractivo para los participantes.",
    step3Title: "Participar",
    step3Text:
      "Si quieres participar, envías tu intento exactamente como lo exige el reto: en directo o como grabación verificada.",
    step4Title: "Empieza la votación",
    step4Text:
      "En cuanto existan intentos válidos, comienza la fase de votación. Entonces la comunidad puede valorar las aportaciones.",
    step5Title: "Se decide el ganador",
    step5Text:
      "Cuando termina la votación, se determina el intento más fuerte. Esa aportación gana el reto.",
    step6Title: "Reto completado",
    step6Text:
      "Al final, el resultado es visible para todos. Puedes ver quién ha ganado y cómo terminó el reto.",

    section3Title: "3. ¿Qué puedo hacer en Norek?",
    card1Title: "Descubrir retos",
    card1Text:
      "Puedes ver retos nuevos y en marcha y comprobar cuáles te interesan.",
    card2Title: "Apoyar retos",
    card2Text:
      "Puedes añadir dinero a retos existentes y aumentar el bote.",
    card3Title: "Participar tú mismo",
    card3Text:
      "Puedes aceptar retos y enviar tu propio intento para ganar.",
    card4Title: "Decidir en la votación",
    card4Text:
      "Durante la fase de votación puedes valorar qué intento te convence más.",
    card5Title: "Seguir la evolución de los retos",
    card5Text:
      "Incluso sin participar tú mismo, puedes ver hasta dónde ha llegado un reto y quién gana al final.",
    card6Title: "Ganar experiencia",
    card6Text:
      "Si participas activamente, tienes éxito o estás presente con frecuencia, sigues desarrollándote dentro de la plataforma.",

    section4Title: "4. ¿Cómo participo en un reto?",
    section4P1:
      "Si quieres participar en un reto, abre la página de detalle y únete al reto allí.",
    section4P2:
      "Después de eso, no basta con subir cualquier vídeo. Tu intento debe enviarse exactamente de la manera que exige ese reto concreto.",
    section4P3:
      "Según el reto, eso significa: debes participar en directo o enviar una grabación verificada directamente en la app.",
    section4P4:
      "Lo importante no es solo que tu intento parezca espectacular, sino que cumpla las reglas. Si no respetas los requisitos, incluso un clip fuerte no te servirá al final.",

    section5Title: "5. ¿Cómo funciona el bote?",
    section5P1:
      "El bote de un reto crece gracias a los usuarios que apoyan ese reto.",
    section5P2:
      "Para ti eso significa que un bote más alto puede hacer que un reto sea más interesante y atraer más atención o participantes más fuertes.",
    section5P3:
      "Pero esto es importante: apoyar y ganar no son lo mismo. Solo porque pongas dinero en un reto no significa que lo ganes automáticamente.",
    section5P4:
      "Si quieres ganar el bote, tienes que participar tú mismo, enviar un intento válido y convencer en la votación.",

    section6Title: "6. ¿Cómo se decide quién gana?",
    section6P1:
      "No puedes ganar por casualidad, solo con un intento fuerte.",
    section6P2:
      "La comunidad valora las aportaciones enviadas. Al final gana el intento que más convence en conjunto.",
    section6P3:
      "Según el reto, los usuarios pueden fijarse en cosas diferentes: rendimiento, ejecución limpia de la tarea, creatividad, valor de entretenimiento o valentía.",
    section6P4:
      "Para ti eso significa que no basta con participar: lo que importa es lo bien que rindas. Quien ignore las reglas, compita a medias o intente hacer trampas no debería tener ventaja.",

    section7Title: "7. ¿Por qué directo o grabación verificada?",
    section7P1: "Para que tu intento cuente como real y verificable.",
    section7P2:
      "En Norek no debería valer como intento real cualquier vídeo antiguo, editado o manipulado. Según el reto, por eso debes participar en directo o enviar una grabación verificada directamente en la app.",
    section7P3:
      "Para ti eso significa que tu intento resulta más creíble, otros usuarios pueden juzgar con más justicia y los participantes honestos no quedan perjudicados por clips dudosos.",
    section7P4:
      "Puedes ver directamente en cada reto qué formato de envío es el válido.",

    section8Title: "8. ¿Qué significan riesgo y 18+?",
    section8P1:
      "Algunos retos son inofensivos, otros son más sensibles o están pensados solo para adultos.",
    section8P2:
      "Si un reto está marcado con riesgo o 18+, eso significa que debes leer los avisos con atención y comprobar si cumples los requisitos para participar.",
    section8P3:
      "Las etiquetas de edad y riesgo te ayudan a valorar mejor en qué te estás metiendo. No todos los retos están disponibles para todos los usuarios.",
    section8P4:
      "Importante: solo porque algo llame la atención no significa automáticamente que sea sensato o esté permitido. Si un reto va contra la seguridad, las reglas o el sentido común, no deberías participar.",

    section9Title: "9. Uso justo de la plataforma",
    section9Intro:
      "Para que Norek siga siendo justo, se aplican reglas claras a todos los usuarios:",
    rule1:
      "No envíes intentos falsos manipulados o montados",
    rule2:
      "No publiques contenido insultante, degradante o ilegal",
    rule3:
      "No eludas las reglas de edad, riesgo o seguridad",
    rule4:
      "Solo los intentos reales y válidos deben llegar a la votación",
    rule5:
      "Vota con justicia y no intentes distorsionar el sistema artificialmente",
    section9Outro:
      "Para ti eso significa que, si participas con honestidad y respetas las reglas, la competición seguirá siendo creíble y comprensible para ti y para todos los demás.",

    section10Title: "10. Preguntas frecuentes",
    faq1Q: "¿Tengo que poner dinero yo mismo para poder participar?",
    faq1A:
      "No automáticamente. Apoyar y participar son dos cosas diferentes. Lo decisivo es lo que exija cada reto concreto.",
    faq2Q: "¿Puedo simplemente subir un vídeo de mi galería?",
    faq2A:
      "Lo que importa es cómo exija el envío cada reto concreto. El foco está en la participación real directamente a través de la plataforma para que la competición siga siendo justa y comprensible.",
    faq3Q: "¿Puedo solo mirar?",
    faq3A:
      "Sí. Puedes seguir retos, apoyarlos y votar en retos adecuados sin participar tú mismo.",
    faq4Q: "¿Cómo sé si puedo participar?",
    faq4A:
      "En la página del reto ves los requisitos principales como riesgo, 18+, duración y tipo de intento.",
    faq5Q: "¿Qué pasa si mi intento no es válido?",
    faq5A:
      "Entonces no debería contar con normalidad en la competición. Solo los intentos válidos y conformes a las reglas deberían tener una oportunidad real de ganar.",

    ctaTitle: "¿Listo para tu primer reto?",
    ctaText:
      "Entonces mira los retos en curso o empieza el tuyo. Si ganas, no será por suerte, sino porque tu intento fue mejor.",
    ctaChallenges: "Ver retos",
    ctaCreate: "Empezar tu propio reto",
  },

  fr: {
    badge: "Aide et explication",
    heroTitle: "Comment fonctionne Norek",
    heroText:
      "Ici, tu peux découvrir comment trouver des défis, les soutenir, y participer toi-même et à quoi faire attention pour que ta tentative soit valide et ait une vraie chance lors du vote.",
    heroChallenges: "Voir les défis",
    heroCreate: "Créer un défi",

    section1Title: "1. Qu’est-ce que Norek ?",
    section1P1:
      "Sur Norek, tu peux découvrir des défis, participer toi-même, soutenir des défis et suivre la performance des autres utilisateurs.",
    section1P2:
      "Pour toi, cela signifie que tu ne te contentes pas de consommer du contenu : tu peux directement faire partie de la compétition.",
    section1P3:
      "Si tu participes toi-même, ce n’est pas n’importe quel clip qui compte, mais ta vraie tentative. Si tu regardes ou votes, tu peux voir comment un défi évolue et qui convainc vraiment à la fin.",

    section2Title: "2. Comment se déroule un défi ?",
    step1Title: "Découvrir un défi",
    step1Text:
      "Tu trouves un défi avec un titre, des règles, un objectif et d’éventuelles exigences supplémentaires comme une durée minimale, un niveau de risque ou 18+.",
    step2Title: "La cagnotte grandit",
    step2Text:
      "Les utilisateurs peuvent soutenir le défi et ajouter de l’argent à la cagnotte. Cela le rend plus attractif pour les participants.",
    step3Title: "Participer",
    step3Text:
      "Si tu veux participer, tu soumets ta tentative exactement comme le défi l’exige : en direct ou sous forme d’enregistrement vérifié.",
    step4Title: "Le vote commence",
    step4Text:
      "Dès que des tentatives valides existent, la phase de vote commence. La communauté peut alors évaluer les contributions.",
    step5Title: "Le gagnant est déterminé",
    step5Text:
      "Quand le vote se termine, la tentative la plus forte est déterminée. Cette contribution gagne le défi.",
    step6Title: "Défi terminé",
    step6Text:
      "À la fin, le résultat est visible pour tous. Tu peux voir qui a gagné et comment le défi s’est terminé.",

    section3Title: "3. Que puis-je faire sur Norek ?",
    card1Title: "Découvrir des défis",
    card1Text:
      "Tu peux consulter les défis en cours et les nouveaux défis et vérifier lesquels t’intéressent.",
    card2Title: "Soutenir des défis",
    card2Text:
      "Tu peux ajouter de l’argent à des défis existants et augmenter la cagnotte.",
    card3Title: "Participer toi-même",
    card3Text:
      "Tu peux accepter des défis et soumettre ta propre tentative pour gagner.",
    card4Title: "Participer au vote",
    card4Text:
      "Pendant la phase de vote, tu peux évaluer la tentative qui te convainc le plus.",
    card5Title: "Suivre l’évolution des défis",
    card5Text:
      "Même sans participer toi-même, tu peux voir jusqu’où un défi a progressé et qui gagne à la fin.",
    card6Title: "Gagner de l’expérience",
    card6Text:
      "Si tu participes activement, réussis ou reviens régulièrement, tu progresses sur la plateforme.",

    section4Title: "4. Comment participer à un défi ?",
    section4P1:
      "Si tu veux participer à un défi, ouvre la page de détail et rejoins le défi là-bas.",
    section4P2:
      "Après cela, il ne suffit pas de téléverser n’importe quelle vidéo. Ta tentative doit être soumise exactement de la manière exigée par ce défi précis.",
    section4P3:
      "Selon le défi, cela signifie : tu dois participer en direct ou soumettre un enregistrement vérifié directement dans l’application.",
    section4P4:
      "Ce qui compte, ce n’est pas seulement que ta tentative semble spectaculaire, mais qu’elle respecte les règles. Si tu ne respectes pas les exigences, même un clip fort ne t’aidera pas au final.",

    section5Title: "5. Comment fonctionne la cagnotte ?",
    section5P1:
      "La cagnotte d’un défi grandit grâce aux utilisateurs qui soutiennent ce défi.",
    section5P2:
      "Pour toi, cela signifie qu’une cagnotte plus élevée peut rendre un défi plus intéressant et attirer davantage d’attention ou des participants plus forts.",
    section5P3:
      "Mais c’est important : soutenir et gagner ne sont pas la même chose. Ce n’est pas parce que tu mets de l’argent dans un défi que tu le gagnes automatiquement.",
    section5P4:
      "Si tu veux gagner la cagnotte, tu dois participer toi-même, soumettre une tentative valide et convaincre lors du vote.",

    section6Title: "6. Comment le gagnant est-il décidé ?",
    section6P1:
      "Tu ne peux pas gagner par hasard, seulement avec une tentative forte.",
    section6P2:
      "La communauté évalue les contributions soumises. À la fin, la tentative qui convainc le plus globalement gagne.",
    section6P3:
      "Selon le défi, les utilisateurs peuvent prêter attention à différentes choses : la performance, l’exécution propre de la tâche, la créativité, la valeur de divertissement ou le courage.",
    section6P4:
      "Pour toi, cela signifie que participer ne suffit pas : ce qui compte, c’est la qualité de ta prestation. Quelqu’un qui ignore les règles, participe à moitié ou essaie de tricher ne devrait pas avoir d’avantage.",

    section7Title: "7. Pourquoi le live ou l’enregistrement vérifié ?",
    section7P1:
      "Pour que ta tentative compte comme réelle et vérifiable.",
    section7P2:
      "Sur Norek, il ne faut pas que n’importe quelle vieille vidéo montée ou manipulée passe pour une vraie tentative. Selon le défi, tu dois donc participer en direct ou soumettre un enregistrement vérifié directement dans l’application.",
    section7P3:
      "Pour toi, cela signifie que ta tentative est plus crédible, que les autres utilisateurs peuvent juger plus équitablement et que les participants honnêtes ne sont pas désavantagés par des clips douteux.",
    section7P4:
      "Tu peux voir directement sur chaque défi quel format de soumission s’applique.",

    section8Title: "8. Que signifient risque et 18+ ?",
    section8P1:
      "Certains défis sont sans danger, d’autres sont plus sensibles ou réservés aux adultes.",
    section8P2:
      "Si un défi est marqué comme risqué ou 18+, cela signifie que tu dois lire attentivement les avertissements et vérifier si tu remplis les conditions de participation.",
    section8P3:
      "Les indications d’âge et de risque t’aident à mieux évaluer dans quoi tu t’engages. Tous les défis ne sont pas accessibles à tous les utilisateurs.",
    section8P4:
      "Important : ce n’est pas parce que quelque chose attire l’attention que c’est automatiquement intelligent ou autorisé. Si un défi va contre la sécurité, les règles ou le bon sens, tu ne devrais pas y participer.",

    section9Title: "9. Utilisation équitable de la plateforme",
    section9Intro:
      "Pour que Norek reste équitable, des règles claires s’appliquent à tous les utilisateurs :",
    rule1:
      "N’envoie pas de fausses tentatives manipulées ou montées",
    rule2:
      "Ne publie pas de contenus insultants, haineux ou illégaux",
    rule3:
      "Ne contourne pas les règles d’âge, de risque ou de sécurité",
    rule4:
      "Seules les tentatives réelles et valides doivent arriver au vote",
    rule5:
      "Vote de manière équitable et n’essaie pas de fausser artificiellement le système",
    section9Outro:
      "Pour toi, cela signifie que si tu participes honnêtement et respectes les règles, la compétition reste crédible et compréhensible — pour toi et pour tous les autres.",

    section10Title: "10. Questions fréquentes",
    faq1Q: "Dois-je payer moi-même pour pouvoir participer ?",
    faq1A:
      "Pas automatiquement. Soutenir et participer sont deux choses différentes. Ce qui compte, c’est ce que le défi concerné exige.",
    faq2Q: "Puis-je simplement téléverser une vidéo depuis ma galerie ?",
    faq2A:
      "Ce qui compte, c’est la manière dont le défi concerné exige la soumission. L’accent est mis sur une participation réelle directement via la plateforme afin que la compétition reste équitable et compréhensible.",
    faq3Q: "Puis-je simplement regarder ?",
    faq3A:
      "Oui. Tu peux suivre des défis, les soutenir et voter sur certains défis adaptés sans participer toi-même.",
    faq4Q: "Comment savoir si j’ai le droit de participer ?",
    faq4A:
      "Sur la page du défi, tu vois les principales exigences comme le risque, le 18+, la durée et le type de tentative.",
    faq5Q: "Que se passe-t-il si ma tentative est invalide ?",
    faq5A:
      "Alors elle ne devrait pas être prise en compte normalement dans la compétition. Seules les tentatives valides et conformes aux règles devraient avoir une vraie chance de gagner.",

    ctaTitle: "Prêt pour ton premier défi ?",
    ctaText:
      "Alors regarde les défis en cours ou lance le tien. Si tu gagnes, ce ne sera pas par chance, mais parce que ta tentative était meilleure.",
    ctaChallenges: "Voir les défis",
    ctaCreate: "Lancer ton propre défi",
  },
};

export default function HelpPage() {
  const locale = useMemo(() => getActiveChallengeLocale(), []);
  const ui = useMemo(() => HELP_UI[locale] ?? HELP_UI.de, [locale]);

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          className="space-y-8"
        >
          <motion.section
            variants={fadeUp}
            className="overflow-hidden rounded-[2rem] border border-amber-300/20 bg-gradient-to-br from-amber-400/15 via-orange-300/10 to-white/5 p-6 md:p-10"
          >
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                {ui.badge}
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">
                {ui.heroTitle}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
                {ui.heroText}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/challenges"
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-amber-300"
                >
                  {ui.heroChallenges}
                </Link>
                <Link
                  href="/challenges/create"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {ui.heroCreate}
                </Link>
              </div>
            </div>
          </motion.section>

          <Section title={ui.section1Title}>
            <p>{ui.section1P1}</p>
            <p>{ui.section1P2}</p>
            <p>{ui.section1P3}</p>
          </Section>

          <Section title={ui.section2Title}>
            <div className="grid gap-4 md:grid-cols-2">
              <Step number="1" title={ui.step1Title} text={ui.step1Text} />
              <Step number="2" title={ui.step2Title} text={ui.step2Text} />
              <Step number="3" title={ui.step3Title} text={ui.step3Text} />
              <Step number="4" title={ui.step4Title} text={ui.step4Text} />
              <Step number="5" title={ui.step5Title} text={ui.step5Text} />
              <Step number="6" title={ui.step6Title} text={ui.step6Text} />
            </div>
          </Section>

          <Section title={ui.section3Title}>
            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard title={ui.card1Title} text={ui.card1Text} />
              <InfoCard title={ui.card2Title} text={ui.card2Text} />
              <InfoCard title={ui.card3Title} text={ui.card3Text} />
              <InfoCard title={ui.card4Title} text={ui.card4Text} />
              <InfoCard title={ui.card5Title} text={ui.card5Text} />
              <InfoCard title={ui.card6Title} text={ui.card6Text} />
            </div>
          </Section>

          <Section title={ui.section4Title}>
            <div className="space-y-4">
              <p>{ui.section4P1}</p>
              <p>{ui.section4P2}</p>
              <p>{ui.section4P3}</p>
              <p>{ui.section4P4}</p>
            </div>
          </Section>

          <Section title={ui.section5Title}>
            <p>{ui.section5P1}</p>
            <p>{ui.section5P2}</p>
            <p>{ui.section5P3}</p>
            <p>{ui.section5P4}</p>
          </Section>

          <Section title={ui.section6Title}>
            <p>{ui.section6P1}</p>
            <p>{ui.section6P2}</p>
            <p>{ui.section6P3}</p>
            <p>{ui.section6P4}</p>
          </Section>

          <Section title={ui.section7Title}>
            <p>{ui.section7P1}</p>
            <p>{ui.section7P2}</p>
            <p>{ui.section7P3}</p>
            <p>{ui.section7P4}</p>
          </Section>

          <Section title={ui.section8Title}>
            <p>{ui.section8P1}</p>
            <p>{ui.section8P2}</p>
            <p>{ui.section8P3}</p>
            <p>{ui.section8P4}</p>
          </Section>

          <Section title={ui.section9Title}>
            <div className="space-y-3">
              <p>{ui.section9Intro}</p>
              <ul className="list-disc space-y-2 pl-5 text-white/80">
                <li>{ui.rule1}</li>
                <li>{ui.rule2}</li>
                <li>{ui.rule3}</li>
                <li>{ui.rule4}</li>
                <li>{ui.rule5}</li>
              </ul>
              <p>{ui.section9Outro}</p>
            </div>
          </Section>

          <Section title={ui.section10Title}>
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-white">{ui.faq1Q}</h3>
                <p className="mt-1 text-white/75">{ui.faq1A}</p>
              </div>

              <div>
                <h3 className="font-semibold text-white">{ui.faq2Q}</h3>
                <p className="mt-1 text-white/75">{ui.faq2A}</p>
              </div>

              <div>
                <h3 className="font-semibold text-white">{ui.faq3Q}</h3>
                <p className="mt-1 text-white/75">{ui.faq3A}</p>
              </div>

              <div>
                <h3 className="font-semibold text-white">{ui.faq4Q}</h3>
                <p className="mt-1 text-white/75">{ui.faq4A}</p>
              </div>

              <div>
                <h3 className="font-semibold text-white">{ui.faq5Q}</h3>
                <p className="mt-1 text-white/75">{ui.faq5A}</p>
              </div>
            </div>
          </Section>

          <motion.section
            variants={fadeUp}
            className="rounded-[2rem] border border-amber-300/20 bg-gradient-to-r from-amber-400/10 via-white/[0.04] to-orange-300/10 p-6 md:p-8"
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-black text-white">
                  {ui.ctaTitle}
                </h2>
                <p className="mt-2 text-sm leading-7 text-white/80">
                  {ui.ctaText}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/challenges"
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-amber-300"
                >
                  {ui.ctaChallenges}
                </Link>
                <Link
                  href="/challenges/create"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {ui.ctaCreate}
                </Link>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </main>
  );
}