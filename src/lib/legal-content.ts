export type ChallengeLocale = "de" | "en" | "es" | "fr";

export function normalizeLocale(input: string | null | undefined): ChallengeLocale {
  const raw = String(input ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 2);

  if (raw === "en" || raw === "es" || raw === "fr") return raw;
  return "de";
}

export function getActiveChallengeLocale(): ChallengeLocale {
  if (typeof window === "undefined") return "de";

  const stored =
    window.localStorage.getItem("app_locale") ||
    window.localStorage.getItem("locale") ||
    window.localStorage.getItem("language");

  if (stored) return normalizeLocale(stored);
  return normalizeLocale(window.navigator.language);
}

export const LEGAL_COMPANY = {
  companyName: "Lohnbuchhaltung Schmidt / DarePay",
  legalName: "[VOLLSTÄNDIGE FIRMENBEZEICHNUNG EINTRAGEN]",
  ownerName: "[INHABER / GESCHÄFTSFÜHRER EINTRAGEN]",
  addressLine1: "[STRASSE HAUSNUMMER]",
  addressLine2: "[PLZ ORT]",
  email: "[E-MAIL]",
  phone: "[TELEFON]",
  registerCourt: "[REGISTERGERICHT ODER NICHT EINGETRAGEN]",
  registerNumber: "[HRB/HRA ODER -]",
  vatId: "[UST-ID ODER -]",
  responsibleForContent: "[NAME VERANTWORTLICHE PERSON]",
};

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalPageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
};

type LegalPageKey =
  | "impressum"
  | "datenschutz"
  | "widerruf"
  | "preise"
  | "auszahlungsrichtlinie"
  | "agb";

const LEGAL_CONTENT: Record<
  ChallengeLocale,
  Record<Exclude<LegalPageKey, "agb">, LegalPageContent>
> = {
  de: {
    impressum: {
      eyebrow: "Rechtliches",
      title: "Impressum",
      intro: "Angaben zum Anbieter und zu den verantwortlichen Stellen von DarePay.",
      sections: [
        {
          title: "Angaben gemäß § 5 DDG",
          paragraphs: [
            `${LEGAL_COMPANY.legalName}`,
            `${LEGAL_COMPANY.addressLine1}`,
            `${LEGAL_COMPANY.addressLine2}`,
            `Vertreten durch: ${LEGAL_COMPANY.ownerName}`,
          ],
        },
        {
          title: "Kontakt",
          paragraphs: [
            `E-Mail: ${LEGAL_COMPANY.email}`,
            `Telefon: ${LEGAL_COMPANY.phone}`,
          ],
        },
        {
          title: "Registereintrag",
          paragraphs: [
            `Registergericht: ${LEGAL_COMPANY.registerCourt}`,
            `Registernummer: ${LEGAL_COMPANY.registerNumber}`,
          ],
        },
        {
          title: "Umsatzsteuer",
          paragraphs: [
            `Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: ${LEGAL_COMPANY.vatId}`,
          ],
        },
        {
          title: "Inhaltlich verantwortlich",
          paragraphs: [
            `Verantwortlich für redaktionelle Inhalte: ${LEGAL_COMPANY.responsibleForContent}`,
          ],
        },
        {
          title: "Hinweis",
          paragraphs: [
            "DarePay ist eine Plattform für Challenges, Community-Voting und zahlungsbezogene Plattformleistungen. Rechtlich verbindliche Erklärungen zu Verträgen, Auszahlungen, Gebühren und Nutzerpflichten ergeben sich ergänzend aus den AGB, der Datenschutzerklärung, der Widerrufsbelehrung, der Preis-/Gebührenübersicht und der Auszahlungsrichtlinie.",
          ],
        },
      ],
    },

    datenschutz: {
      eyebrow: "Rechtliches",
      title: "Datenschutzerklärung",
      intro: "Informationen darüber, wie personenbezogene Daten bei DarePay verarbeitet werden.",
      sections: [
        {
          title: "1. Verantwortlicher",
          paragraphs: [
            `${LEGAL_COMPANY.legalName}, ${LEGAL_COMPANY.addressLine1}, ${LEGAL_COMPANY.addressLine2}`,
            `E-Mail: ${LEGAL_COMPANY.email}`,
          ],
        },
        {
          title: "2. Welche Daten wir verarbeiten",
          paragraphs: [
            "Wir verarbeiten insbesondere Bestandsdaten (z. B. Benutzername, E-Mail-Adresse), Vertragsdaten, Zahlungsdaten, Kommunikationsdaten, Nutzungsdaten, Gerätedaten, Logdaten sowie von Nutzern bereitgestellte Inhalte wie Challenge-Beschreibungen, Kommentare, Profilbilder, Video- und Bildmaterial.",
          ],
        },
        {
          title: "3. Zwecke der Verarbeitung",
          paragraphs: [],
          bullets: [
            "Bereitstellung der App und Nutzerkonten",
            "Durchführung von Challenge-, Voting- und Community-Funktionen",
            "Abwicklung von Support-Zahlungen, Plattformgebühren und Auszahlungen",
            "Missbrauchs-, Betrugs- und Sicherheitsprävention",
            "Durchsetzung der AGB und Moderation von Inhalten",
            "Erfüllung gesetzlicher Aufbewahrungs-, Nachweis- und Compliance-Pflichten",
          ],
        },
        {
          title: "4. Zahlungsabwicklung",
          paragraphs: [
            "Für die Zahlungsabwicklung nutzen wir externe Zahlungsdienstleister, insbesondere Stripe. Zahlungsdaten werden im für die Zahlungsabwicklung erforderlichen Umfang an den Zahlungsdienstleister übermittelt. Die Verarbeitung erfolgt zur Vertragsdurchführung, zur Betrugsprävention sowie zur Erfüllung gesetzlicher Pflichten.",
            "Soweit Auszahlungen an Gewinner oder andere berechtigte Nutzer erfolgen, können Identitäts-, KYC-, Steuer- und Bankdaten an den Zahlungsdienstleister übermittelt und dort verarbeitet werden.",
          ],
        },
        {
          title: "5. Challenge-, Upload- und Community-Daten",
          paragraphs: [
            "Von Nutzern eingestellte Inhalte wie Challenge-Texte, Kommentare, Profilangaben, Avatare, Bilder und Videos werden verarbeitet, gespeichert und im Rahmen der Plattformfunktionen veröffentlicht, soweit dies zur Erfüllung des jeweiligen Plattformzwecks erforderlich ist.",
            "Nutzerinhalte können zur Moderation, Missbrauchserkennung, Rechtsdurchsetzung und Gefahrenabwehr geprüft werden.",
          ],
        },
        {
          title: "6. Rechtsgrundlagen",
          paragraphs: [
            "Die Verarbeitung erfolgt je nach Fall zur Vertragserfüllung, zur Erfüllung rechtlicher Verpflichtungen, auf Grundlage berechtigter Interessen oder aufgrund erteilter Einwilligungen.",
          ],
        },
        {
          title: "7. Speicherfristen",
          paragraphs: [
            "Wir speichern personenbezogene Daten nur so lange, wie dies für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen. Zahlungs-, Buchungs- und steuerrelevante Daten können deshalb länger gespeichert werden als reine Community- oder Profildaten.",
          ],
        },
        {
          title: "8. Betroffenenrechte",
          paragraphs: [],
          bullets: [
            "Auskunft",
            "Berichtigung",
            "Löschung",
            "Einschränkung der Verarbeitung",
            "Datenübertragbarkeit",
            "Widerspruch",
            "Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft",
            "Beschwerde bei einer Datenschutzaufsichtsbehörde",
          ],
        },
        {
          title: "9. Pflichtangaben / freiwillige Angaben",
          paragraphs: [
            "Bestimmte Daten sind für Registrierung, Vertragsdurchführung, Zahlungsabwicklung, Auszahlungen, Altersverifikation, Missbrauchsprävention oder gesetzliche Pflichten erforderlich. Werden diese nicht bereitgestellt, können einzelne Funktionen der Plattform nicht genutzt werden.",
          ],
        },
        {
          title: "10. Änderungen",
          paragraphs: [
            "Wir können diese Datenschutzerklärung anpassen, wenn dies aus rechtlichen, technischen oder organisatorischen Gründen erforderlich ist.",
          ],
        },
      ],
    },

    widerruf: {
      eyebrow: "Rechtliches",
      title: "Widerrufsbelehrung",
      intro: "Informationen zum gesetzlichen Widerrufsrecht bei DarePay.",
      sections: [
        {
          title: "Widerrufsbelehrung",
          paragraphs: [
            "Verbraucher haben bei außerhalb von Geschäftsräumen geschlossenen Verträgen und bei Fernabsatzverträgen grundsätzlich ein gesetzliches Widerrufsrecht.",
          ],
        },
        {
          title: "Widerrufsrecht",
          paragraphs: [
            "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.",
            "Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.",
            `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${LEGAL_COMPANY.legalName}, ${LEGAL_COMPANY.addressLine1}, ${LEGAL_COMPANY.addressLine2}, E-Mail: ${LEGAL_COMPANY.email}) mittels einer eindeutigen Erklärung über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.`,
          ],
        },
        {
          title: "Folgen des Widerrufs",
          paragraphs: [
            "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf bei uns eingegangen ist.",
            "Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart.",
          ],
        },
        {
          title: "Vorzeitiges Erlöschen des Widerrufsrechts bei Dienstleistungen",
          paragraphs: [
            "Bei digitalen oder plattformbezogenen Dienstleistungen kann das Widerrufsrecht vorzeitig erlöschen, wenn wir die Dienstleistung vollständig erbracht haben, nachdem Sie ausdrücklich zugestimmt haben, dass wir vor Ablauf der Widerrufsfrist mit der Leistung beginnen, und Sie bestätigt haben, dass Sie wissen, dass Sie bei vollständiger Vertragserfüllung Ihr Widerrufsrecht verlieren.",
          ],
        },
        {
          title: "Besonderer Hinweis für Support-Zahlungen",
          paragraphs: [
            "Soweit eine Support-Zahlung unmittelbar einer laufenden Challenge, dem Challenge-Pot, der Platzreservierung, dem Sichtbarmachen der Unterstützung oder einer sofort beginnenden Plattformleistung zugeordnet und die Leistung bereits vollständig oder unumkehrbar erbracht wurde, kann ein Widerruf rechtlich ausgeschlossen oder das Widerrufsrecht erloschen sein, sofern die gesetzlichen Voraussetzungen und die im Checkout abgegebenen Erklärungen vorliegen.",
          ],
        },
      ],
    },

    preise: {
      eyebrow: "Rechtliches",
      title: "Preis- und Gebührenübersicht",
      intro: "Übersicht über Preise, Gebühren und Grundmechanik von Zahlungen auf DarePay.",
      sections: [
        {
          title: "1. Grundmodell",
          paragraphs: [
            "Support-Zahlungen von Nutzern werden challengebezogen erfasst. Die Plattform erhebt auf erfolgreiche Challenge-Payouts eine Plattformgebühr.",
          ],
        },
        {
          title: "2. Plattformgebühr",
          paragraphs: [
            "Standardmäßig beträgt die Plattformgebühr 20 % des final zur Auszahlung freigegebenen Pots.",
            "Standardmäßig beträgt die Gewinnerauszahlung 80 % des final zur Auszahlung freigegebenen Pots.",
          ],
        },
        {
          title: "3. Drittanbietergebühren",
          paragraphs: [
            "Gebühren externer Zahlungsdienstleister, Auszahlungsanbieter, Chargeback-, Dispute-, KYC-, Währungs- oder sonstige Drittgebühren können zusätzlich anfallen. Die konkrete Behandlung wird im Checkout und/oder in der Auszahlungsrichtlinie erläutert.",
          ],
        },
        {
          title: "4. Preisangaben im Checkout",
          paragraphs: [
            "Vor Abgabe einer zahlungspflichtigen Bestellung werden dem Nutzer mindestens der eingezahlte Betrag, die Art der Leistung, die wesentlichen Bedingungen, die Rückabwicklungslogik und gegebenenfalls anfallende Gebühren klar angezeigt.",
          ],
        },
        {
          title: "5. Kein Spendenmodell",
          paragraphs: [
            "Sofern nicht ausdrücklich anders ausgewiesen, handelt es sich bei Support-Zahlungen nicht um steuerlich abzugsfähige Spenden, sondern um plattformbezogene Zahlungen im Rahmen der DarePay-Mechanik.",
          ],
        },
      ],
    },

    auszahlungsrichtlinie: {
      eyebrow: "Rechtliches",
      title: "Auszahlungsrichtlinie",
      intro: "Regeln und Voraussetzungen für Auszahlungen auf DarePay.",
      sections: [
        {
          title: "1. Auszahlungsberechtigung",
          paragraphs: [
            "Auszahlungsberechtigt ist ausschließlich der nach den Plattformregeln, dem Voting-Ergebnis und der internen Prüfung festgestellte Gewinner oder sonst ausdrücklich berechtigte Empfänger.",
          ],
        },
        {
          title: "2. Voraussetzungen",
          paragraphs: [],
          bullets: [
            "vollständige Identifikation / KYC soweit erforderlich",
            "vollständige und korrekte Auszahlungsdaten",
            "keine offenen Verdachtsmomente auf Betrug, Missbrauch oder Regelverstöße",
            "keine offenen Rückbelastungen, Disputes oder sonstigen Sperrgründe",
          ],
        },
        {
          title: "3. Prüf- und Sperrfristen",
          paragraphs: [
            "DarePay darf Auszahlungen zurückhalten, prüfen, ablehnen oder korrigieren, wenn rechtliche, regulatorische, technische, sicherheitsrelevante oder vertragliche Gründe dies erforderlich machen.",
            "Dies gilt insbesondere bei Betrugsverdacht, Regelverstößen, Chargebacks, Beschwerdefällen, Zahlungsstörungen, Sanktions- oder Compliance-Prüfungen.",
          ],
        },
        {
          title: "4. Höhe der Auszahlung",
          paragraphs: [
            "Die Auszahlung richtet sich nach dem nach den Plattformregeln freigegebenen Netto-Pot abzüglich der ausgewiesenen Plattformgebühr und etwaiger zulässiger Dritt- oder Rückabwicklungskosten.",
          ],
        },
        {
          title: "5. Steuerhinweis",
          paragraphs: [
            "Empfänger von Auszahlungen sind selbst dafür verantwortlich, erhaltene Beträge steuerlich korrekt einzuordnen und zu erklären. DarePay schuldet keine individuelle Steuerberatung.",
          ],
        },
        {
          title: "6. Rückforderung / Aufrechnung",
          paragraphs: [
            "DarePay kann fehlerhafte oder unberechtigte Auszahlungen zurückfordern, mit künftigen Auszahlungen verrechnen oder über den Zahlungsdienstleister rückabwickeln, soweit dies rechtlich zulässig ist.",
          ],
        },
      ],
    },
  },

  en: {
    impressum: {
      eyebrow: "Legal",
      title: "Legal notice",
      intro: "Provider and responsible entity information for DarePay.",
      sections: [
        {
          title: "Information according to § 5 DDG",
          paragraphs: [
            `${LEGAL_COMPANY.legalName}`,
            `${LEGAL_COMPANY.addressLine1}`,
            `${LEGAL_COMPANY.addressLine2}`,
            `Represented by: ${LEGAL_COMPANY.ownerName}`,
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            `Email: ${LEGAL_COMPANY.email}`,
            `Phone: ${LEGAL_COMPANY.phone}`,
          ],
        },
        {
          title: "Register entry",
          paragraphs: [
            `Register court: ${LEGAL_COMPANY.registerCourt}`,
            `Register number: ${LEGAL_COMPANY.registerNumber}`,
          ],
        },
        {
          title: "VAT",
          paragraphs: [`VAT identification number according to § 27a UStG: ${LEGAL_COMPANY.vatId}`],
        },
        {
          title: "Responsible for content",
          paragraphs: [`Responsible for editorial content: ${LEGAL_COMPANY.responsibleForContent}`],
        },
        {
          title: "Notice",
          paragraphs: [
            "DarePay is a platform for challenges, community voting and payment-related platform services. Legally binding statements regarding contracts, payouts, fees and user obligations are additionally governed by the Terms and Conditions, Privacy Policy, Withdrawal Policy, Pricing / Fee Overview and Payout Policy.",
          ],
        },
      ],
    },

    datenschutz: {
      eyebrow: "Legal",
      title: "Privacy policy",
      intro: "Information about how personal data is processed on DarePay.",
      sections: [
        {
          title: "1. Controller",
          paragraphs: [
            `${LEGAL_COMPANY.legalName}, ${LEGAL_COMPANY.addressLine1}, ${LEGAL_COMPANY.addressLine2}`,
            `Email: ${LEGAL_COMPANY.email}`,
          ],
        },
        {
          title: "2. What data we process",
          paragraphs: [
            "We process in particular account data (for example username and email address), contract data, payment data, communication data, usage data, device data, log data and content provided by users such as challenge descriptions, comments, profile images, videos and images.",
          ],
        },
        {
          title: "3. Purposes of processing",
          paragraphs: [],
          bullets: [
            "Provision of the app and user accounts",
            "Operation of challenge, voting and community features",
            "Processing of support payments, platform fees and payouts",
            "Abuse, fraud and security prevention",
            "Enforcement of Terms and Conditions and moderation of content",
            "Compliance with legal retention, evidence and regulatory obligations",
          ],
        },
        {
          title: "4. Payment processing",
          paragraphs: [
            "For payment processing we use external payment service providers, in particular Stripe. Payment data is transferred to the payment provider to the extent necessary for payment processing. Processing takes place for contract performance, fraud prevention and compliance with legal obligations.",
            "Where payouts are made to winners or other eligible users, identity, KYC, tax and bank data may be transmitted to and processed by the payment provider.",
          ],
        },
        {
          title: "5. Challenge, upload and community data",
          paragraphs: [
            "User content such as challenge texts, comments, profile information, avatars, images and videos is processed, stored and published within the scope of platform functions insofar as this is necessary to fulfill the respective platform purpose.",
            "User content may be reviewed for moderation, abuse detection, legal enforcement and risk prevention.",
          ],
        },
        {
          title: "6. Legal bases",
          paragraphs: [
            "Depending on the case, processing is carried out for performance of a contract, compliance with legal obligations, on the basis of legitimate interests or on the basis of granted consent.",
          ],
        },
        {
          title: "7. Retention periods",
          paragraphs: [
            "We store personal data only as long as necessary for the respective purposes or as long as legal retention obligations apply. Payment, booking and tax-relevant data may therefore be stored longer than pure community or profile data.",
          ],
        },
        {
          title: "8. Data subject rights",
          paragraphs: [],
          bullets: [
            "Access",
            "Rectification",
            "Erasure",
            "Restriction of processing",
            "Data portability",
            "Objection",
            "Withdrawal of consent with effect for the future",
            "Complaint to a data protection supervisory authority",
          ],
        },
        {
          title: "9. Mandatory / voluntary information",
          paragraphs: [
            "Certain data is required for registration, contract performance, payment processing, payouts, age verification, abuse prevention or legal obligations. If such data is not provided, certain functions of the platform may not be available.",
          ],
        },
        {
          title: "10. Changes",
          paragraphs: [
            "We may update this privacy policy where necessary for legal, technical or organizational reasons.",
          ],
        },
      ],
    },

    widerruf: {
      eyebrow: "Legal",
      title: "Withdrawal policy",
      intro: "Information on the statutory right of withdrawal for DarePay.",
      sections: [
        {
          title: "Withdrawal policy",
          paragraphs: [
            "Consumers generally have a statutory right of withdrawal for distance contracts and contracts concluded outside business premises.",
          ],
        },
        {
          title: "Right of withdrawal",
          paragraphs: [
            "You have the right to withdraw from this contract within fourteen days without giving any reason.",
            "The withdrawal period is fourteen days from the date of conclusion of the contract.",
            `To exercise your right of withdrawal, you must inform us (${LEGAL_COMPANY.legalName}, ${LEGAL_COMPANY.addressLine1}, ${LEGAL_COMPANY.addressLine2}, email: ${LEGAL_COMPANY.email}) by means of a clear statement of your decision to withdraw from this contract.`,
          ],
        },
        {
          title: "Effects of withdrawal",
          paragraphs: [
            "If you withdraw from this contract, we will reimburse all payments received from you without undue delay and at the latest within fourteen days from the day on which we received notice of your withdrawal.",
            "For this reimbursement, we will use the same means of payment that you used for the original transaction, unless expressly agreed otherwise with you.",
          ],
        },
        {
          title: "Early expiry of the right of withdrawal for services",
          paragraphs: [
            "For digital or platform-related services, the right of withdrawal may expire early if we have fully performed the service after you expressly agreed that we begin performance before the end of the withdrawal period and you confirmed that you are aware that you lose your right of withdrawal upon full performance.",
          ],
        },
        {
          title: "Special notice for support payments",
          paragraphs: [
            "Insofar as a support payment is directly assigned to an ongoing challenge, the challenge pot, reservation of a place, visibility of support or a platform service that begins immediately, and the service has already been fully or irreversibly rendered, withdrawal may be legally excluded or the right of withdrawal may have expired, provided that the statutory requirements and the declarations made during checkout are fulfilled.",
          ],
        },
      ],
    },

    preise: {
      eyebrow: "Legal",
      title: "Pricing and fee overview",
      intro: "Overview of prices, fees and the core payment mechanics on DarePay.",
      sections: [
        {
          title: "1. Basic model",
          paragraphs: [
            "Support payments made by users are assigned to a specific challenge. The platform charges a platform fee on successful challenge payouts.",
          ],
        },
        {
          title: "2. Platform fee",
          paragraphs: [
            "By default, the platform fee amounts to 20% of the final pot released for payout.",
            "By default, the winner payout amounts to 80% of the final pot released for payout.",
          ],
        },
        {
          title: "3. Third-party fees",
          paragraphs: [
            "Fees charged by external payment service providers, payout providers, chargeback, dispute, KYC, currency conversion or other third parties may apply in addition. The specific treatment is explained in checkout and/or in the payout policy.",
          ],
        },
        {
          title: "4. Price information in checkout",
          paragraphs: [
            "Before a payable order is submitted, the user is shown at least the paid amount, the type of service, the essential conditions, the refund / reversal logic and any applicable fees.",
          ],
        },
        {
          title: "5. No donation model",
          paragraphs: [
            "Unless explicitly stated otherwise, support payments are not tax-deductible donations but platform-related payments within the DarePay mechanics.",
          ],
        },
      ],
    },

    auszahlungsrichtlinie: {
      eyebrow: "Legal",
      title: "Payout policy",
      intro: "Rules and requirements for payouts on DarePay.",
      sections: [
        {
          title: "1. Eligibility for payout",
          paragraphs: [
            "Only the winner or other expressly authorized recipient determined in accordance with the platform rules, the voting result and internal review is entitled to receive a payout.",
          ],
        },
        {
          title: "2. Requirements",
          paragraphs: [],
          bullets: [
            "complete identification / KYC where required",
            "complete and correct payout data",
            "no unresolved suspicion of fraud, abuse or rule violations",
            "no unresolved chargebacks, disputes or other blocking reasons",
          ],
        },
        {
          title: "3. Review and blocking periods",
          paragraphs: [
            "DarePay may withhold, review, reject or correct payouts where this is necessary for legal, regulatory, technical, security-related or contractual reasons.",
            "This applies in particular in cases of suspected fraud, rule violations, chargebacks, complaints, payment disruptions, sanctions checks or compliance reviews.",
          ],
        },
        {
          title: "4. Amount of payout",
          paragraphs: [
            "The payout is based on the net pot released under the platform rules, less the disclosed platform fee and any permissible third-party or reversal costs.",
          ],
        },
        {
          title: "5. Tax notice",
          paragraphs: [
            "Recipients of payouts are solely responsible for classifying and declaring received amounts correctly for tax purposes. DarePay does not provide individual tax advice.",
          ],
        },
        {
          title: "6. Recovery / set-off",
          paragraphs: [
            "DarePay may reclaim incorrect or unauthorized payouts, offset them against future payouts or reverse them via the payment service provider to the extent permitted by law.",
          ],
        },
      ],
    },
  },

  es: {
    impressum: {
      eyebrow: "Legal",
      title: "Aviso legal",
      intro: "Información sobre el proveedor y las entidades responsables de DarePay.",
      sections: [
        {
          title: "Información según § 5 DDG",
          paragraphs: [
            `${LEGAL_COMPANY.legalName}`,
            `${LEGAL_COMPANY.addressLine1}`,
            `${LEGAL_COMPANY.addressLine2}`,
            `Representado por: ${LEGAL_COMPANY.ownerName}`,
          ],
        },
        {
          title: "Contacto",
          paragraphs: [
            `Correo electrónico: ${LEGAL_COMPANY.email}`,
            `Teléfono: ${LEGAL_COMPANY.phone}`,
          ],
        },
        {
          title: "Registro",
          paragraphs: [
            `Juzgado de registro: ${LEGAL_COMPANY.registerCourt}`,
            `Número de registro: ${LEGAL_COMPANY.registerNumber}`,
          ],
        },
        {
          title: "IVA",
          paragraphs: [`Número de IVA según § 27a UStG: ${LEGAL_COMPANY.vatId}`],
        },
        {
          title: "Responsable del contenido",
          paragraphs: [`Responsable de los contenidos editoriales: ${LEGAL_COMPANY.responsibleForContent}`],
        },
        {
          title: "Aviso",
          paragraphs: [
            "DarePay es una plataforma para retos, votaciones de la comunidad y servicios de plataforma relacionados con pagos. Las declaraciones legalmente vinculantes sobre contratos, pagos, comisiones y obligaciones del usuario se rigen además por los Términos y Condiciones, la Política de Privacidad, la Política de Desistimiento, el Resumen de Precios / Comisiones y la Política de Pagos.",
          ],
        },
      ],
    },

    datenschutz: {
      eyebrow: "Legal",
      title: "Política de privacidad",
      intro: "Información sobre cómo se tratan los datos personales en DarePay.",
      sections: [
        {
          title: "1. Responsable",
          paragraphs: [
            `${LEGAL_COMPANY.legalName}, ${LEGAL_COMPANY.addressLine1}, ${LEGAL_COMPANY.addressLine2}`,
            `Correo electrónico: ${LEGAL_COMPANY.email}`,
          ],
        },
        {
          title: "2. Qué datos tratamos",
          paragraphs: [
            "Tratamos en particular datos de cuenta (por ejemplo nombre de usuario y correo electrónico), datos contractuales, datos de pago, datos de comunicación, datos de uso, datos del dispositivo, datos de registro y contenidos facilitados por los usuarios como descripciones de retos, comentarios, imágenes de perfil, vídeos e imágenes.",
          ],
        },
        {
          title: "3. Finalidades del tratamiento",
          paragraphs: [],
          bullets: [
            "Prestación de la app y de las cuentas de usuario",
            "Ejecución de funciones de retos, votación y comunidad",
            "Gestión de pagos de apoyo, comisiones de plataforma y pagos",
            "Prevención de abuso, fraude y riesgos de seguridad",
            "Aplicación de los Términos y Condiciones y moderación de contenidos",
            "Cumplimiento de obligaciones legales de conservación, prueba y cumplimiento normativo",
          ],
        },
        {
          title: "4. Procesamiento de pagos",
          paragraphs: [
            "Para el procesamiento de pagos utilizamos proveedores externos de servicios de pago, en particular Stripe. Los datos de pago se transmiten al proveedor de pagos en la medida necesaria para la gestión del pago. El tratamiento se realiza para la ejecución del contrato, la prevención del fraude y el cumplimiento de obligaciones legales.",
            "Cuando se realicen pagos a ganadores u otros usuarios autorizados, los datos de identidad, KYC, fiscales y bancarios podrán transmitirse y tratarse por el proveedor de pagos.",
          ],
        },
        {
          title: "5. Datos de retos, subidas y comunidad",
          paragraphs: [
            "Los contenidos publicados por los usuarios, como textos de retos, comentarios, datos de perfil, avatares, imágenes y vídeos, se tratan, almacenan y publican dentro de las funciones de la plataforma en la medida necesaria para cumplir con la finalidad correspondiente.",
            "Los contenidos de los usuarios pueden revisarse con fines de moderación, detección de abusos, defensa jurídica y prevención de riesgos.",
          ],
        },
        {
          title: "6. Bases jurídicas",
          paragraphs: [
            "Según el caso, el tratamiento se realiza para la ejecución de un contrato, el cumplimiento de obligaciones legales, sobre la base de intereses legítimos o sobre la base del consentimiento otorgado.",
          ],
        },
        {
          title: "7. Plazos de conservación",
          paragraphs: [
            "Solo conservamos los datos personales durante el tiempo necesario para las finalidades correspondientes o mientras existan obligaciones legales de conservación. Por ello, los datos de pago, contables y fiscales pueden conservarse más tiempo que los datos puramente comunitarios o de perfil.",
          ],
        },
        {
          title: "8. Derechos de los interesados",
          paragraphs: [],
          bullets: [
            "Acceso",
            "Rectificación",
            "Supresión",
            "Limitación del tratamiento",
            "Portabilidad de los datos",
            "Oposición",
            "Retirada del consentimiento con efectos futuros",
            "Reclamación ante una autoridad de control de protección de datos",
          ],
        },
        {
          title: "9. Datos obligatorios / voluntarios",
          paragraphs: [
            "Determinados datos son necesarios para el registro, la ejecución del contrato, el procesamiento de pagos, los pagos, la verificación de edad, la prevención de abusos o el cumplimiento de obligaciones legales. Si no se facilitan, determinadas funciones de la plataforma pueden no estar disponibles.",
          ],
        },
        {
          title: "10. Cambios",
          paragraphs: [
            "Podemos adaptar esta política de privacidad cuando sea necesario por motivos legales, técnicos u organizativos.",
          ],
        },
      ],
    },

    widerruf: {
      eyebrow: "Legal",
      title: "Política de desistimiento",
      intro: "Información sobre el derecho legal de desistimiento en DarePay.",
      sections: [
        {
          title: "Política de desistimiento",
          paragraphs: [
            "Los consumidores tienen por lo general un derecho legal de desistimiento en los contratos celebrados a distancia y en los contratos celebrados fuera del establecimiento mercantil.",
          ],
        },
        {
          title: "Derecho de desistimiento",
          paragraphs: [
            "Tienes derecho a desistir de este contrato en un plazo de catorce días sin indicar el motivo.",
            "El plazo de desistimiento es de catorce días a partir del día de la celebración del contrato.",
            `Para ejercer tu derecho de desistimiento debes informarnos (${LEGAL_COMPANY.legalName}, ${LEGAL_COMPANY.addressLine1}, ${LEGAL_COMPANY.addressLine2}, correo electrónico: ${LEGAL_COMPANY.email}) mediante una declaración clara de tu decisión de desistir del contrato.`,
          ],
        },
        {
          title: "Consecuencias del desistimiento",
          paragraphs: [
            "Si desistes de este contrato, te reembolsaremos todos los pagos recibidos sin demora indebida y, como máximo, en un plazo de catorce días desde el día en que hayamos recibido la notificación de tu desistimiento.",
            "Para este reembolso utilizaremos el mismo medio de pago que empleaste en la transacción original, salvo que se acuerde expresamente otra cosa contigo.",
          ],
        },
        {
          title: "Extinción anticipada del derecho de desistimiento para servicios",
          paragraphs: [
            "En el caso de servicios digitales o relacionados con la plataforma, el derecho de desistimiento puede extinguirse anticipadamente si hemos prestado completamente el servicio después de que hayas consentido expresamente que comencemos antes de que finalice el plazo de desistimiento y hayas confirmado que sabes que pierdes tu derecho de desistimiento con la ejecución completa del servicio.",
          ],
        },
        {
          title: "Aviso especial para pagos de apoyo",
          paragraphs: [
            "En la medida en que un pago de apoyo se asigne directamente a un reto en curso, al bote del reto, a la reserva de plaza, a la visibilidad del apoyo o a un servicio de plataforma que comienza de inmediato, y el servicio ya se haya prestado de forma completa o irreversible, el desistimiento puede quedar legalmente excluido o el derecho de desistimiento puede haber expirado, siempre que se cumplan los requisitos legales y las declaraciones realizadas durante el checkout.",
          ],
        },
      ],
    },

    preise: {
      eyebrow: "Legal",
      title: "Resumen de precios y comisiones",
      intro: "Resumen de precios, comisiones y mecánica básica de pagos en DarePay.",
      sections: [
        {
          title: "1. Modelo básico",
          paragraphs: [
            "Los pagos de apoyo de los usuarios se asignan a retos concretos. La plataforma cobra una comisión de plataforma sobre los pagos exitosos de retos.",
          ],
        },
        {
          title: "2. Comisión de plataforma",
          paragraphs: [
            "Por defecto, la comisión de plataforma asciende al 20 % del bote final liberado para pago.",
            "Por defecto, el pago al ganador asciende al 80 % del bote final liberado para pago.",
          ],
        },
        {
          title: "3. Comisiones de terceros",
          paragraphs: [
            "Pueden aplicarse además comisiones de proveedores externos de pago, proveedores de pagos, chargebacks, disputas, KYC, cambio de divisa u otros terceros. El tratamiento concreto se explica en el checkout y/o en la política de pagos.",
          ],
        },
        {
          title: "4. Información de precios en el checkout",
          paragraphs: [
            "Antes de enviar un pedido con obligación de pago, al usuario se le muestran al menos el importe pagado, el tipo de servicio, las condiciones esenciales, la lógica de reembolso o reversión y las posibles comisiones aplicables.",
          ],
        },
        {
          title: "5. No es un modelo de donación",
          paragraphs: [
            "Salvo que se indique expresamente lo contrario, los pagos de apoyo no son donaciones deducibles fiscalmente, sino pagos relacionados con la plataforma dentro de la mecánica de DarePay.",
          ],
        },
      ],
    },

    auszahlungsrichtlinie: {
      eyebrow: "Legal",
      title: "Política de pagos",
      intro: "Reglas y requisitos para los pagos en DarePay.",
      sections: [
        {
          title: "1. Derecho al pago",
          paragraphs: [
            "Solo tiene derecho al pago el ganador u otro destinatario expresamente autorizado que haya sido determinado conforme a las reglas de la plataforma, el resultado de la votación y la revisión interna.",
          ],
        },
        {
          title: "2. Requisitos",
          paragraphs: [],
          bullets: [
            "identificación completa / KYC cuando sea necesario",
            "datos de pago completos y correctos",
            "ausencia de sospechas abiertas de fraude, abuso o infracciones de reglas",
            "ausencia de chargebacks, disputas u otros motivos de bloqueo pendientes",
          ],
        },
        {
          title: "3. Revisión y bloqueo",
          paragraphs: [
            "DarePay puede retener, revisar, rechazar o corregir pagos cuando ello sea necesario por motivos legales, regulatorios, técnicos, de seguridad o contractuales.",
            "Esto se aplica especialmente en casos de sospecha de fraude, infracciones de reglas, chargebacks, reclamaciones, problemas de pago, revisiones de sanciones o de cumplimiento normativo.",
          ],
        },
        {
          title: "4. Importe del pago",
          paragraphs: [
            "El pago se basa en el bote neto liberado conforme a las reglas de la plataforma, menos la comisión de plataforma indicada y cualesquiera costes permitidos de terceros o de reversión.",
          ],
        },
        {
          title: "5. Aviso fiscal",
          paragraphs: [
            "Los destinatarios de pagos son los únicos responsables de clasificar y declarar correctamente las cantidades recibidas a efectos fiscales. DarePay no proporciona asesoramiento fiscal individual.",
          ],
        },
        {
          title: "6. Recuperación / compensación",
          paragraphs: [
            "DarePay puede reclamar pagos incorrectos o no autorizados, compensarlos con pagos futuros o revertirlos a través del proveedor de pagos en la medida permitida por la ley.",
          ],
        },
      ],
    },
  },

  fr: {
    impressum: {
      eyebrow: "Mentions légales",
      title: "Mentions légales",
      intro: "Informations sur l’éditeur et les entités responsables de DarePay.",
      sections: [
        {
          title: "Informations conformément au § 5 DDG",
          paragraphs: [
            `${LEGAL_COMPANY.legalName}`,
            `${LEGAL_COMPANY.addressLine1}`,
            `${LEGAL_COMPANY.addressLine2}`,
            `Représenté par : ${LEGAL_COMPANY.ownerName}`,
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            `E-mail : ${LEGAL_COMPANY.email}`,
            `Téléphone : ${LEGAL_COMPANY.phone}`,
          ],
        },
        {
          title: "Registre",
          paragraphs: [
            `Tribunal du registre : ${LEGAL_COMPANY.registerCourt}`,
            `Numéro de registre : ${LEGAL_COMPANY.registerNumber}`,
          ],
        },
        {
          title: "TVA",
          paragraphs: [`Numéro de TVA selon § 27a UStG : ${LEGAL_COMPANY.vatId}`],
        },
        {
          title: "Responsable du contenu",
          paragraphs: [`Responsable des contenus éditoriaux : ${LEGAL_COMPANY.responsibleForContent}`],
        },
        {
          title: "Remarque",
          paragraphs: [
            "DarePay est une plateforme de défis, de vote communautaire et de services de plateforme liés aux paiements. Les déclarations juridiquement contraignantes concernant les contrats, paiements, frais et obligations des utilisateurs sont également régies par les Conditions générales, la Politique de confidentialité, la Politique de rétractation, le Récapitulatif des prix / frais et la Politique de paiement.",
          ],
        },
      ],
    },

    datenschutz: {
      eyebrow: "Mentions légales",
      title: "Politique de confidentialité",
      intro: "Informations sur la manière dont les données personnelles sont traitées sur DarePay.",
      sections: [
        {
          title: "1. Responsable du traitement",
          paragraphs: [
            `${LEGAL_COMPANY.legalName}, ${LEGAL_COMPANY.addressLine1}, ${LEGAL_COMPANY.addressLine2}`,
            `E-mail : ${LEGAL_COMPANY.email}`,
          ],
        },
        {
          title: "2. Quelles données nous traitons",
          paragraphs: [
            "Nous traitons notamment les données de compte (par exemple nom d’utilisateur et adresse e-mail), les données contractuelles, les données de paiement, les données de communication, les données d’utilisation, les données d’appareil, les données de journalisation ainsi que les contenus fournis par les utilisateurs tels que descriptions de défis, commentaires, images de profil, vidéos et images.",
          ],
        },
        {
          title: "3. Finalités du traitement",
          paragraphs: [],
          bullets: [
            "Mise à disposition de l’application et des comptes utilisateurs",
            "Exploitation des fonctions de défi, de vote et de communauté",
            "Traitement des paiements de soutien, frais de plateforme et paiements",
            "Prévention des abus, de la fraude et des risques de sécurité",
            "Application des Conditions générales et modération des contenus",
            "Respect des obligations légales de conservation, de preuve et de conformité",
          ],
        },
        {
          title: "4. Traitement des paiements",
          paragraphs: [
            "Pour le traitement des paiements, nous utilisons des prestataires externes, notamment Stripe. Les données de paiement sont transmises au prestataire de paiement dans la mesure nécessaire au traitement du paiement. Le traitement a lieu pour l’exécution du contrat, la prévention de la fraude et le respect des obligations légales.",
            "Lorsque des paiements sont effectués au profit de gagnants ou d’autres utilisateurs éligibles, des données d’identité, KYC, fiscales et bancaires peuvent être transmises et traitées par le prestataire de paiement.",
          ],
        },
        {
          title: "5. Données de défi, d’upload et de communauté",
          paragraphs: [
            "Les contenus publiés par les utilisateurs, tels que les textes de défi, commentaires, informations de profil, avatars, images et vidéos, sont traités, stockés et publiés dans le cadre des fonctions de la plateforme dans la mesure nécessaire à la finalité concernée.",
            "Les contenus utilisateurs peuvent être examinés à des fins de modération, de détection d’abus, de défense juridique et de prévention des risques.",
          ],
        },
        {
          title: "6. Bases juridiques",
          paragraphs: [
            "Selon les cas, le traitement est effectué pour l’exécution d’un contrat, le respect d’obligations légales, sur la base d’intérêts légitimes ou sur la base d’un consentement donné.",
          ],
        },
        {
          title: "7. Durées de conservation",
          paragraphs: [
            "Nous conservons les données personnelles uniquement aussi longtemps que nécessaire aux finalités concernées ou aussi longtemps que des obligations légales de conservation s’appliquent. Les données de paiement, comptables et fiscales peuvent donc être conservées plus longtemps que les simples données communautaires ou de profil.",
          ],
        },
        {
          title: "8. Droits des personnes concernées",
          paragraphs: [],
          bullets: [
            "Accès",
            "Rectification",
            "Effacement",
            "Limitation du traitement",
            "Portabilité des données",
            "Opposition",
            "Retrait du consentement avec effet pour l’avenir",
            "Réclamation auprès d’une autorité de protection des données",
          ],
        },
        {
          title: "9. Données obligatoires / facultatives",
          paragraphs: [
            "Certaines données sont nécessaires à l’inscription, à l’exécution du contrat, au traitement des paiements, aux versements, à la vérification d’âge, à la prévention des abus ou au respect d’obligations légales. Si elles ne sont pas fournies, certaines fonctions de la plateforme peuvent ne pas être disponibles.",
          ],
        },
        {
          title: "10. Modifications",
          paragraphs: [
            "Nous pouvons adapter cette politique de confidentialité lorsque cela est nécessaire pour des raisons juridiques, techniques ou organisationnelles.",
          ],
        },
      ],
    },

    widerruf: {
      eyebrow: "Mentions légales",
      title: "Politique de rétractation",
      intro: "Informations sur le droit légal de rétractation sur DarePay.",
      sections: [
        {
          title: "Politique de rétractation",
          paragraphs: [
            "Les consommateurs disposent en principe d’un droit légal de rétractation pour les contrats à distance et les contrats conclus hors établissement.",
          ],
        },
        {
          title: "Droit de rétractation",
          paragraphs: [
            "Vous avez le droit de vous rétracter du présent contrat dans un délai de quatorze jours sans donner de motif.",
            "Le délai de rétractation est de quatorze jours à compter de la date de conclusion du contrat.",
            `Pour exercer votre droit de rétractation, vous devez nous informer (${LEGAL_COMPANY.legalName}, ${LEGAL_COMPANY.addressLine1}, ${LEGAL_COMPANY.addressLine2}, e-mail : ${LEGAL_COMPANY.email}) au moyen d’une déclaration claire de votre décision de vous rétracter du contrat.`,
          ],
        },
        {
          title: "Effets de la rétractation",
          paragraphs: [
            "Si vous vous rétractez du présent contrat, nous vous rembourserons tous les paiements reçus sans retard injustifié et au plus tard dans un délai de quatorze jours à compter du jour où nous avons reçu votre notification de rétractation.",
            "Pour ce remboursement, nous utiliserons le même moyen de paiement que celui que vous avez utilisé pour la transaction initiale, sauf accord exprès contraire avec vous.",
          ],
        },
        {
          title: "Extinction anticipée du droit de rétractation pour les services",
          paragraphs: [
            "Pour les services numériques ou liés à la plateforme, le droit de rétractation peut s’éteindre de manière anticipée si nous avons entièrement exécuté le service après que vous avez expressément accepté que l’exécution commence avant l’expiration du délai de rétractation et que vous avez confirmé savoir que vous perdez votre droit de rétractation une fois l’exécution complète réalisée.",
          ],
        },
        {
          title: "Remarque particulière pour les paiements de soutien",
          paragraphs: [
            "Dans la mesure où un paiement de soutien est directement affecté à un défi en cours, à la cagnotte du défi, à la réservation d’une place, à la visibilité du soutien ou à un service de plateforme commençant immédiatement, et que ce service a déjà été entièrement ou irréversiblement exécuté, la rétractation peut être légalement exclue ou le droit de rétractation peut avoir expiré, sous réserve du respect des conditions légales et des déclarations effectuées lors du checkout.",
          ],
        },
      ],
    },

    preise: {
      eyebrow: "Mentions légales",
      title: "Aperçu des prix et frais",
      intro: "Aperçu des prix, frais et mécanismes de paiement de base sur DarePay.",
      sections: [
        {
          title: "1. Modèle de base",
          paragraphs: [
            "Les paiements de soutien des utilisateurs sont affectés à un défi donné. La plateforme perçoit des frais de plateforme sur les paiements réussis des défis.",
          ],
        },
        {
          title: "2. Frais de plateforme",
          paragraphs: [
            "Par défaut, les frais de plateforme s’élèvent à 20 % de la cagnotte finale libérée pour paiement.",
            "Par défaut, le paiement au gagnant s’élève à 80 % de la cagnotte finale libérée pour paiement.",
          ],
        },
        {
          title: "3. Frais de tiers",
          paragraphs: [
            "Des frais facturés par des prestataires externes de paiement, prestataires de versement, chargebacks, litiges, KYC, conversion de devises ou autres tiers peuvent s’ajouter. Le traitement concret est expliqué dans le checkout et/ou dans la politique de paiement.",
          ],
        },
        {
          title: "4. Informations tarifaires dans le checkout",
          paragraphs: [
            "Avant la validation d’une commande payante, l’utilisateur voit au minimum le montant payé, le type de service, les conditions essentielles, la logique de remboursement / d’annulation et les éventuels frais applicables.",
          ],
        },
        {
          title: "5. Pas un modèle de don",
          paragraphs: [
            "Sauf indication expresse contraire, les paiements de soutien ne constituent pas des dons fiscalement déductibles, mais des paiements liés à la plateforme dans le cadre du mécanisme DarePay.",
          ],
        },
      ],
    },

    auszahlungsrichtlinie: {
      eyebrow: "Mentions légales",
      title: "Politique de paiement",
      intro: "Règles et conditions pour les versements sur DarePay.",
      sections: [
        {
          title: "1. Droit au versement",
          paragraphs: [
            "Seul le gagnant ou tout autre bénéficiaire expressément autorisé, déterminé conformément aux règles de la plateforme, au résultat du vote et à la vérification interne, peut prétendre à un versement.",
          ],
        },
        {
          title: "2. Conditions",
          paragraphs: [],
          bullets: [
            "identification complète / KYC lorsque nécessaire",
            "coordonnées de versement complètes et correctes",
            "absence de suspicion ouverte de fraude, d’abus ou de violation des règles",
            "absence de chargebacks, litiges ou autres motifs de blocage non résolus",
          ],
        },
        {
          title: "3. Délais de contrôle et de blocage",
          paragraphs: [
            "DarePay peut retenir, contrôler, refuser ou corriger des versements lorsque cela est nécessaire pour des raisons juridiques, réglementaires, techniques, de sécurité ou contractuelles.",
            "Cela s’applique notamment en cas de soupçon de fraude, de violation des règles, de chargebacks, de réclamations, de dysfonctionnements de paiement, de contrôles de sanctions ou de conformité.",
          ],
        },
        {
          title: "4. Montant du versement",
          paragraphs: [
            "Le versement est calculé sur la base de la cagnotte nette libérée conformément aux règles de la plateforme, diminuée des frais de plateforme indiqués et des éventuels coûts de tiers ou de rétrofacturation autorisés.",
          ],
        },
        {
          title: "5. Remarque fiscale",
          paragraphs: [
            "Les bénéficiaires des versements sont seuls responsables de la qualification et de la déclaration correcte des montants reçus à des fins fiscales. DarePay ne fournit aucun conseil fiscal individuel.",
          ],
        },
        {
          title: "6. Récupération / compensation",
          paragraphs: [
            "DarePay peut récupérer les versements erronés ou non autorisés, les compenser avec de futurs versements ou les annuler via le prestataire de paiement dans la mesure permise par la loi.",
          ],
        },
      ],
    },
  },
};

export type LegalPageMeta = {
  back: string;
  eyebrow: string;
  title: string;
  intro: string;
  badges: [string, string, string];
  warningTitle: string;
  warningText: string;
  languageNoticeTitle: string;
  languageNoticeText: string;
};

export const agbPageMeta: Record<ChallengeLocale, LegalPageMeta> = {
  de: {
    back: "← Zurück",
    eyebrow: "Rechtliches",
    title: "Allgemeine Geschäftsbedingungen",
    intro:
      "Diese Fassung ist als starke Plattform-AGB für DarePay aufgebaut. Ersetze vor Livegang alle Platzhalter durch deine echten Firmendaten.",
    badges: [
      "Stand: März 2026",
      "Für Website & App",
      "Platzhalter vor Livegang ersetzen",
    ],
    warningTitle: "Vor Veröffentlichung noch erledigen",
    warningText:
      "Diese AGB ersetzen kein Impressum, keine Datenschutzerklärung und keine Widerrufsbelehrung. Außerdem sollten die Texte vor Livegang noch kurz von einem deutschen IT-/Plattform-Anwalt geprüft werden.",
    languageNoticeTitle: "Hinweis zur Sprache",
    languageNoticeText:
      "Diese AGB werden aktuell in der deutschen Fassung als maßgebliche Version angezeigt. Übersetzte Fassungen sollten vor Livegang juristisch geprüft werden.",
  },
  en: {
    back: "← Back",
    eyebrow: "Legal",
    title: "Terms and Conditions",
    intro:
      "This version is structured as a strong platform terms document for DarePay. Replace all placeholders with your real company data before going live.",
    badges: [
      "Version: March 2026",
      "For website & app",
      "Replace placeholders before launch",
    ],
    warningTitle: "Still required before publishing",
    warningText:
      "These terms do not replace the legal notice, privacy policy or withdrawal policy. In addition, the texts should be reviewed by a German IT / platform lawyer before launch.",
    languageNoticeTitle: "Language notice",
    languageNoticeText:
      "These terms are currently shown in the authoritative German version. Translated versions should be legally reviewed before launch.",
  },
  es: {
    back: "← Volver",
    eyebrow: "Legal",
    title: "Términos y condiciones",
    intro:
      "Esta versión está estructurada como unos términos sólidos de plataforma para DarePay. Sustituye todos los marcadores por los datos reales de tu empresa antes del lanzamiento.",
    badges: [
      "Versión: marzo de 2026",
      "Para web y app",
      "Sustituir marcadores antes del lanzamiento",
    ],
    warningTitle: "Pendiente antes de publicar",
    warningText:
      "Estos términos no sustituyen el aviso legal, la política de privacidad ni la política de desistimiento. Además, los textos deberían ser revisados por un abogado alemán especializado en IT / plataformas antes del lanzamiento.",
    languageNoticeTitle: "Aviso de idioma",
    languageNoticeText:
      "Estos términos se muestran actualmente en su versión alemana como versión vinculante. Las versiones traducidas deberían revisarse legalmente antes del lanzamiento.",
  },
  fr: {
    back: "← Retour",
    eyebrow: "Mentions légales",
    title: "Conditions générales",
    intro:
      "Cette version est structurée comme des conditions générales solides pour la plateforme DarePay. Remplace tous les champs réservés par les vraies données de ton entreprise avant la mise en ligne.",
    badges: [
      "Version : mars 2026",
      "Pour site web et application",
      "Remplacer les champs réservés avant lancement",
    ],
    warningTitle: "À finaliser avant publication",
    warningText:
      "Ces conditions ne remplacent pas les mentions légales, la politique de confidentialité ni la politique de rétractation. En plus, les textes devraient être relus par un avocat allemand spécialisé IT / plateformes avant la mise en ligne.",
    languageNoticeTitle: "Remarque linguistique",
    languageNoticeText:
      "Ces conditions sont actuellement affichées dans leur version allemande faisant foi. Les versions traduites devraient être vérifiées juridiquement avant la mise en ligne.",
  },
};

export const agbSections: Record<ChallengeLocale, LegalSection[]> = {
  de: [
    {
      title: "1. Geltungsbereich",
      paragraphs: [
        "1.1 Diese Allgemeinen Geschäftsbedingungen regeln die Nutzung der von [UNTERNEHMENSNAME] betriebenen Plattform „DarePay“ über Website und/oder App.",
        "1.2 DarePay ist eine digitale Plattform, auf der Nutzer Challenges erstellen, Challenges unterstützen, an Challenges teilnehmen, Inhalte einreichen, Inhalte bewerten und – vorbehaltlich der jeweils geltenden Regeln – Auszahlungen erhalten können.",
        "1.3 Diese AGB gelten für alle Verträge zwischen DarePay und den Nutzern in ihrer jeweils zum Zeitpunkt des Vertragsschlusses gültigen Fassung.",
        "1.4 Nutzer im Sinne dieser AGB können Verbraucher oder Unternehmer sein.",
        "1.5 Abweichende Geschäftsbedingungen von Nutzern werden nicht Vertragsbestandteil, es sei denn, DarePay stimmt ihrer Geltung ausdrücklich schriftlich zu.",
      ],
    },
    {
      title: "2. Anbieter",
      paragraphs: [
        "Anbieter der Plattform ist:",
        "[UNTERNEHMENSNAME]",
        "[RECHTSFORM]",
        "[ANSCHRIFT]",
        "[E-MAIL]",
        "[TELEFON]",
        "[HANDELSREGISTER / REGISTERGERICHT, falls vorhanden]",
        "[UST-IDNR., falls vorhanden]",
      ],
    },
    {
      title: "3. Leistungen von DarePay",
      paragraphs: [
        "3.1 DarePay stellt eine technische Plattform zur Verfügung, auf der Nutzer Challenges erstellen, Challenges unterstützen, an Challenges teilnehmen, Beiträge hochladen oder live einreichen und Community-Funktionen nutzen können.",
        "3.2 DarePay schuldet keinen bestimmten wirtschaftlichen Erfolg, keine Mindestanzahl von Teilnehmern, keine Mindesthöhe von Unterstützungsbeträgen und keine Auszahlung, sofern die Voraussetzungen der jeweiligen Challenge-Regeln nicht vollständig erfüllt sind.",
        "3.3 DarePay ist berechtigt, die Plattform technisch, optisch und funktional weiterzuentwickeln, sofern dadurch wesentliche vertragliche Hauptpflichten nicht unzumutbar beeinträchtigt werden.",
        "3.4 DarePay stellt die technische und organisatorische Plattforminfrastruktur bereit.",
      ],
    },
    {
      title: "4. Registrierung und Nutzerkonto",
      paragraphs: [
        "4.1 Die Nutzung bestimmter Funktionen setzt die Erstellung eines Nutzerkontos voraus.",
        "4.2 Nutzer sind verpflichtet, bei der Registrierung vollständige und zutreffende Angaben zu machen und diese aktuell zu halten.",
        "4.3 Pro Person ist nur ein Nutzerkonto zulässig, sofern DarePay nicht ausdrücklich mehrere Konten erlaubt.",
        "4.4 Zugangsdaten sind geheim zu halten und vor dem Zugriff Dritter zu schützen.",
        "4.5 DarePay ist berechtigt, Nutzerkonten vorübergehend zu sperren oder endgültig zu schließen, wenn falsche Angaben gemacht wurden, ein Verstoß gegen diese AGB vorliegt, der Verdacht missbräuchlicher Nutzung besteht oder gesetzliche bzw. regulatorische Pflichten dies erfordern.",
      ],
    },
    {
      title: "5. Altersgrenzen, Verifikation und Teilnahmevoraussetzungen",
      paragraphs: [
        "5.1 Die Nutzung von DarePay ist nur volljährigen Personen gestattet, soweit nicht einzelne Funktionen ausdrücklich auch Minderjährigen erlaubt werden.",
        "5.2 DarePay ist berechtigt, für einzelne Challenges, Kategorien oder Auszahlungsfunktionen zusätzliche Alters-, Identitäts- oder Verifikationsnachweise zu verlangen.",
        "5.3 Inhalte oder Challenges, die nur für volljährige Nutzer bestimmt sind, dürfen ausschließlich von entsprechend verifizierten Nutzern aufgerufen oder genutzt werden.",
        "5.4 DarePay ist berechtigt, Teilnahme- oder Auszahlungsrechte bis zum vollständigen Abschluss einer erforderlichen Verifikation auszusetzen.",
      ],
    },
    {
      title: "6. Erstellung von Challenges",
      paragraphs: [
        "6.1 Nutzer können nach Maßgabe der Plattformfunktionen eigene Challenges erstellen.",
        "6.2 Der Ersteller einer Challenge ist verpflichtet, die Challenge so zu formulieren, dass Regeln, Teilnahmevoraussetzungen, Bewertungsmaßstäbe, Zeitabläufe, Risiken und die Voraussetzungen für einen Gewinn klar, wahrheitsgemäß und verständlich beschrieben sind.",
        "6.3 Challenges dürfen insbesondere nicht gegen geltendes Recht verstoßen, irreführend oder betrügerisch sein, zu Selbst- oder Fremdgefährdung aufrufen, Rechte Dritter verletzen oder sonst gegen die Community-Regeln von DarePay verstoßen.",
        "6.4 DarePay ist berechtigt, Challenges vor oder nach Veröffentlichung ganz oder teilweise abzulehnen, zu sperren, zu entfernen oder zu bearbeiten, soweit dies zur Einhaltung gesetzlicher Vorgaben, zum Schutz der Plattform oder zur Durchsetzung der Plattformregeln erforderlich ist.",
      ],
    },
    {
      title: "7. Teilnahme an Challenges",
      paragraphs: [
        "7.1 Nutzer können an Challenges nur teilnehmen, wenn sie die jeweiligen Teilnahmevoraussetzungen erfüllen.",
        "7.2 Ein Anspruch auf Teilnahme an jeder beliebigen Challenge besteht nicht.",
        "7.3 DarePay ist berechtigt, Teilnahmeversuche abzulehnen, zu sperren, als ungültig zu kennzeichnen oder zu disqualifizieren, wenn die Challenge-Regeln nicht eingehalten wurden, Inhalte manipuliert oder technisch unzulässig sind, Sicherheits-, Alters- oder Verifikationsanforderungen nicht erfüllt wurden oder ein sonstiger Verstoß gegen diese AGB vorliegt.",
        "7.4 Soweit eine Challenge eine Live-Teilnahme oder eine verifizierte In-App-Aufnahme verlangt, ist ausschließlich die von DarePay vorgegebene technische Einreichungsform maßgeblich.",
      ],
    },
    {
      title: "8. Unterstützungszahlungen und challengebezogene Zuordnung",
      paragraphs: [
        "8.1 Nutzer können Challenges durch Zahlungen unterstützen, sofern dies auf der jeweiligen Challenge-Seite vorgesehen ist.",
        "8.2 Unterstützungszahlungen werden unmittelbar einer konkreten Challenge zugeordnet und plattformseitig verarbeitet.",
        "8.3 Mit erfolgreichem Abschluss des Zahlungsvorgangs beginnt DarePay – vorbehaltlich technischer oder rechtlicher Hindernisse – unverzüglich mit der challengebezogenen Ausführung der geschuldeten Plattformleistung, insbesondere mit der Entgegennahme, Verbuchung, challengebezogenen Zuordnung, Verwaltung und weiteren Abwicklungsverarbeitung der Unterstützungszahlung.",
        "8.4 Soweit gesetzlich zulässig und soweit kein zwingendes Widerrufs- oder sonstiges Rückabwicklungsrecht besteht, sind Unterstützungszahlungen nach erfolgreicher challengebezogener Zuordnung grundsätzlich nicht frei stornierbar oder einseitig rückforderbar.",
        "8.5 Eine Rückzahlung erfolgt nur, wenn DarePay hierzu gesetzlich verpflichtet ist, wenn die Zahlung technisch oder rechtlich nicht wirksam verarbeitet werden konnte, wenn DarePay sich aus Kulanz ausdrücklich mit einer Rückzahlung einverstanden erklärt oder wenn eine Rückabwicklung im Zusammenhang mit Chargebacks, Disputes, Zahlungsstörungen, Missbrauchsverdacht, Regelverstößen oder behördlichen Anforderungen erforderlich ist.",
        "8.6 Unterstützungszahlungen begründen keinen Anspruch auf einen bestimmten Challenge-Ausgang, auf eine Teilnahmeberechtigung, auf einen Gewinn oder auf eine Rückzahlung allein deshalb, weil die unterstützte Challenge später scheitert, beendet wird, keinen Gewinner hervorbringt oder anders verläuft als vom Nutzer erwartet.",
        "8.7 DarePay bleibt berechtigt, challengebezogene Beträge ganz oder teilweise zurückzuhalten, neu zuzuordnen, zu sperren oder rückabzuwickeln, wenn dies im Zusammenhang mit Missbrauch, Rechtsverstößen, Regelverstößen, Zahlungsstörungen, Disputes oder zwingenden gesetzlichen Vorgaben erforderlich ist.",
      ],
    },
    {
      title: "9. Plattformgebühren und Zahlungsabwicklung",
      paragraphs: [
        "9.1 DarePay ist berechtigt, für die Nutzung der Plattform, die Bereitstellung technischer Infrastruktur, die Challenge-Abwicklung, Zahlungsabwicklung und Auszahlungsorganisation Plattformgebühren zu erheben.",
        "9.2 DarePay kann sich zur Zahlungsabwicklung externer Zahlungsdienstleister bedienen.",
        "9.3 Es gelten ergänzend die Bedingungen des jeweils eingebundenen Zahlungsdienstleisters.",
        "9.4 DarePay ist berechtigt, Gebührenmodelle anzupassen, soweit dies für Nutzer zumutbar ist und die Änderungen vor ihrer Anwendung transparent kommuniziert werden.",
        "9.5 Soweit Gebühren als prozentuale Beteiligung, feste Gebühr oder Mischmodell berechnet werden, richtet sich die Berechnung nach der jeweils bei Zahlung oder in der Preisübersicht ausgewiesenen Struktur.",
      ],
    },
    {
      title: "10. Auszahlungen an Gewinner und andere berechtigte Nutzer",
      paragraphs: [
        "10.1 Ein Anspruch auf Auszahlung entsteht nur, wenn die jeweilige Challenge wirksam abgeschlossen wurde, ein Gewinner nach den Challenge-Regeln wirksam festgestellt wurde, kein Sperr-, Disqualifikations-, Missbrauchs- oder Prüfungsgrund entgegensteht und der Nutzer sämtliche von DarePay oder dem Zahlungsdienstleister geforderten Verifikations-, Identitäts- und Auszahlungsanforderungen erfüllt.",
        "10.2 DarePay ist berechtigt, Auszahlungen ganz oder teilweise zurückzuhalten, zu verzögern oder abzulehnen, wenn gesetzliche oder regulatorische Vorgaben dies verlangen, Unklarheiten über die Berechtigung bestehen, Rückerstattungen, Disputes, Chargebacks oder Betrugsverdacht vorliegen oder der Nutzer gegen diese AGB oder Challenge-Regeln verstoßen hat.",
        "10.3 DarePay kann Auszahlungen über verbundene Zahlungs- oder Connected-Account-Strukturen abwickeln.",
        "10.4 Soweit steuerliche oder regulatorische Pflichten bestehen, ist der Nutzer verpflichtet, die hierfür erforderlichen Informationen und Nachweise bereitzustellen.",
      ],
    },
    {
      title: "11. Rückerstattungen, Chargebacks, Disputes und Korrekturen",
      paragraphs: [
        "11.1 DarePay ist berechtigt, challengebezogene Beträge ganz oder teilweise zurückzuhalten, neu zuzuordnen, mit späteren Ansprüchen zu verrechnen oder rückabzuwickeln, soweit dies im Zusammenhang mit Rückerstattungen, Zahlungsstörungen, Chargebacks, Disputes, Missbrauch, Regelverstößen oder rechtlichen Verpflichtungen erforderlich ist.",
        "11.2 Soweit bereits Auszahlungen erfolgt sind und sich nachträglich herausstellt, dass die Voraussetzungen für die Auszahlung nicht vorlagen oder Beträge ganz oder teilweise zurückabzuwickeln sind, kann DarePay Rückforderungsansprüche geltend machen oder entsprechende Beträge mit zukünftigen Ansprüchen verrechnen.",
        "11.3 Nutzer sind verpflichtet, DarePay bei der Aufklärung von Zahlungsstörungen und Disputes in zumutbarem Umfang zu unterstützen.",
      ],
    },
    {
      title: "12. Steuern, Abgaben und Eigenverantwortung der Nutzer",
      paragraphs: [
        "12.1 Nutzer sind selbst dafür verantwortlich, die für sie geltenden steuerlichen und sonstigen gesetzlichen Pflichten im Zusammenhang mit Unterstützungszahlungen, Gewinnen, Preisgeldern, Auszahlungen oder sonstigen Einnahmen eigenständig zu prüfen und zu erfüllen.",
        "12.2 DarePay schuldet keine individuelle Steuer-, Rechts- oder Finanzberatung.",
        "12.3 Soweit DarePay gesetzlich verpflichtet ist, bestimmte Informationen einzuholen, zu speichern, zu melden oder an Behörden oder Zahlungsdienstleister weiterzugeben, ist der Nutzer verpflichtet, die hierfür erforderlichen Angaben wahrheitsgemäß und vollständig zu machen.",
        "12.4 DarePay ist berechtigt, Auszahlungen von der vorherigen Erfüllung solcher Pflichten abhängig zu machen.",
      ],
    },
    {
      title: "13. Widerruf bei Unterstützungszahlungen und sofortiger Leistungsbeginn",
      paragraphs: [
        "13.1 Soweit für Unterstützungszahlungen gesetzlich ein Widerrufsrecht besteht, wird der Nutzer vor Abgabe seiner zahlungspflichtigen Erklärung gesondert über dieses Recht belehrt.",
        "13.2 Der Nutzer kann im Bestellprozess ausdrücklich verlangen, dass DarePay vor Ablauf der Widerrufsfrist mit der Ausführung der Plattformleistung beginnt.",
        "13.3 Soweit die gesetzlichen Voraussetzungen vorliegen, kann das Widerrufsrecht vorzeitig erlöschen, insbesondere wenn DarePay die geschuldete Leistung vollständig erbracht hat und der Nutzer ausdrücklich zugestimmt hat, dass DarePay vor Ablauf der Widerrufsfrist mit der Leistungsausführung beginnt, und seine Kenntnis davon bestätigt hat, dass er bei vollständiger Vertragserfüllung sein Widerrufsrecht verliert.",
        "13.4 Das gesetzliche Widerrufsrecht und dessen zwingende Voraussetzungen bleiben im Übrigen unberührt.",
        "13.5 Die bloße Behauptung, eine Challenge habe sich aus Sicht des Nutzers wirtschaftlich oder inhaltlich nicht wie erwartet entwickelt, begründet für sich genommen kein eigenständiges Rückzahlungsrecht außerhalb zwingender gesetzlicher Vorschriften.",
      ],
    },
    {
      title: "14. Nutzerinhalte und Rechte",
      paragraphs: [
        "14.1 Nutzer können im Rahmen der Plattform Inhalte hochladen, streamen, veröffentlichen oder sonst verfügbar machen.",
        "14.2 Der Nutzer versichert, dass er an allen von ihm hochgeladenen oder genutzten Inhalten die erforderlichen Rechte besitzt und deren Nutzung auf DarePay rechtlich zulässig ist.",
        "14.3 Der Nutzer räumt DarePay an den eingestellten Inhalten die für Betrieb, Darstellung, Speicherung, Moderation, technische Verarbeitung, Promotion der Plattform und Durchführung der Challenge erforderlichen einfachen, räumlich unbeschränkten, übertragbaren Nutzungsrechte ein, soweit dies für die jeweiligen Zwecke erforderlich ist.",
        "14.4 DarePay ist berechtigt, Inhalte zu kürzen, technisch anzupassen, in Vorschaubilder umzuwandeln, zu speichern, zu sichern und im Rahmen der Plattformfunktionen öffentlich zugänglich zu machen.",
        "14.5 Inhalte können gelöscht oder gesperrt werden, wenn sie gegen diese AGB, gesetzliche Vorschriften oder Community-Regeln verstoßen.",
      ],
    },
    {
      title: "15. Verbotene Nutzung",
      paragraphs: [
        "Es ist insbesondere untersagt, technische Schutzmaßnahmen zu umgehen, Mehrfachkonten missbräuchlich zu verwenden, Abstimmungen, Rankings oder Auszahlungen zu manipulieren, Inhalte automatisiert oder skriptgesteuert einzureichen, Schadsoftware einzuschleusen, Dritte zu täuschen, Identitäten vorzutäuschen oder die Plattform in sonstiger Weise missbräuchlich zu nutzen.",
      ],
    },
    {
      title: "16. Moderation, Prüfungen und Maßnahmen von DarePay",
      paragraphs: [
        "16.1 DarePay ist berechtigt, Inhalte, Zahlungen, Challenges, Teilnehmerbeiträge und Nutzerkonten risikobasiert zu prüfen.",
        "16.2 DarePay kann insbesondere folgende Maßnahmen ergreifen: Hinweis, Einschränkung einzelner Funktionen, temporäre Sperrung, Entfernung einzelner Inhalte, Aberkennung von Bewertungen oder Rangfolgen, Disqualifikation, Aussetzung oder Ablehnung von Auszahlungen, endgültige Kontosperrung.",
        "16.3 DarePay trifft diese Maßnahmen nach pflichtgemäßem Ermessen unter Berücksichtigung der berechtigten Interessen aller Beteiligten.",
      ],
    },
    {
      title: "17. Verfügbarkeit",
      paragraphs: [
        "17.1 DarePay bemüht sich um eine möglichst hohe Verfügbarkeit der Plattform.",
        "17.2 Eine ununterbrochene Verfügbarkeit wird nicht geschuldet.",
        "17.3 DarePay ist berechtigt, die Plattform ganz oder teilweise wegen Wartung, Sicherheit, technischer Erfordernisse oder aus sonstigen sachlichen Gründen vorübergehend einzuschränken.",
      ],
    },
    {
      title: "18. Haftung",
      paragraphs: [
        "18.1 DarePay haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit.",
        "18.2 Bei einfacher Fahrlässigkeit haftet DarePay nur bei Verletzung einer wesentlichen Vertragspflicht; in diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.",
        "18.3 Die vorstehenden Haftungsbeschränkungen gelten nicht bei Verletzung von Leben, Körper oder Gesundheit sowie bei zwingender gesetzlicher Haftung.",
        "18.4 DarePay haftet nicht für von Nutzern eingestellte Inhalte, Angaben, Challenge-Beschreibungen oder tatsächliche Handlungen der Nutzer, soweit nicht eine eigene Verantwortlichkeit von DarePay vorliegt.",
        "18.5 DarePay haftet insbesondere nicht dafür, dass eine Challenge wirtschaftlich erfolgreich ist, genügend Unterstützer findet oder ein bestimmtes Preisgeldniveau erreicht.",
      ],
    },
    {
      title: "19. Freistellung",
      paragraphs: [
        "Der Nutzer stellt DarePay von sämtlichen Ansprüchen Dritter frei, die aus einer rechtswidrigen Nutzung der Plattform, einem Verstoß gegen diese AGB, gegen Challenge-Regeln oder aus der Verletzung von Rechten Dritter durch den Nutzer resultieren, einschließlich der angemessenen Kosten der Rechtsverteidigung, es sei denn, der Nutzer hat die Pflichtverletzung nicht zu vertreten.",
      ],
    },
    {
      title: "20. Vertragslaufzeit und Kündigung",
      paragraphs: [
        "20.1 Der Nutzungsvertrag läuft auf unbestimmte Zeit.",
        "20.2 Nutzer können ihr Nutzerkonto jederzeit ordentlich kündigen, soweit keine offenen Abwicklungs-, Zahlungs-, Prüfungs- oder Auszahlungsprozesse entgegenstehen.",
        "20.3 DarePay kann den Nutzungsvertrag ordentlich mit angemessener Frist kündigen.",
        "20.4 Das Recht zur fristlosen Kündigung aus wichtigem Grund bleibt unberührt.",
        "20.5 Nach Vertragsbeendigung können bestimmte Daten im Rahmen gesetzlicher Aufbewahrungspflichten gespeichert bleiben.",
      ],
    },
    {
      title: "21. Änderungen der AGB",
      paragraphs: [
        "21.1 DarePay ist berechtigt, diese AGB mit Wirkung für die Zukunft zu ändern, soweit hierfür ein sachlicher Grund besteht, insbesondere bei Änderungen der Rechtslage, Änderungen der Plattformfunktionen, Änderungen der Zahlungs- oder Auszahlungsstruktur sowie Sicherheits- oder Missbrauchsanforderungen.",
        "21.2 Änderungen werden dem Nutzer rechtzeitig in geeigneter Form mitgeteilt.",
        "21.3 Widerspricht der Nutzer den Änderungen nicht innerhalb der von DarePay gesetzten angemessenen Frist, gelten die Änderungen als angenommen, sofern DarePay auf diese Folge zuvor ausdrücklich hingewiesen hat.",
      ],
    },
    {
      title: "22. Verbraucherschutz, Widerruf und elektronische Vertragsabschlüsse",
      paragraphs: [
        "22.1 Soweit gesetzlich ein Widerrufsrecht besteht, erhalten Verbraucher hierüber eine gesonderte Widerrufsbelehrung.",
        "22.2 Für kostenpflichtige Verträge im elektronischen Geschäftsverkehr gelten die gesetzlichen Informations- und Bestellpflichten.",
        "22.3 DarePay ist berechtigt, die Nutzerführung, Bestellstrecken und Widerrufsprozesse an geänderte gesetzliche Anforderungen anzupassen.",
      ],
    },
    {
      title: "23. Schlussbestimmungen",
      paragraphs: [
        "23.1 Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts, soweit dem keine zwingenden Verbraucherschutzvorschriften entgegenstehen.",
        "23.2 Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen AGB der Sitz von DarePay.",
        "23.3 Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.",
      ],
    },
  ],

  en: [
    {
      title: "1. Scope",
      paragraphs: [
        "1.1 These Terms and Conditions govern the use of the “DarePay” platform operated by [COMPANY NAME] via website and/or app.",
        "1.2 DarePay is a digital platform on which users can create challenges, support challenges, participate in challenges, submit content, rate content and — subject to the applicable rules — receive payouts.",
        "1.3 These Terms and Conditions apply to all contracts between DarePay and the users in the version valid at the time the contract is concluded.",
        "1.4 Users within the meaning of these Terms and Conditions may be consumers or businesses.",
        "1.5 Deviating terms and conditions of users shall not become part of the contract unless DarePay expressly agrees to their validity in writing.",
      ],
    },
    {
      title: "2. Provider",
      paragraphs: [
        "The provider of the platform is:",
        "[COMPANY NAME]",
        "[LEGAL FORM]",
        "[ADDRESS]",
        "[EMAIL]",
        "[PHONE]",
        "[COMMERCIAL REGISTER / REGISTER COURT, if applicable]",
        "[VAT ID, if applicable]",
      ],
    },
    {
      title: "3. Services of DarePay",
      paragraphs: [
        "3.1 DarePay provides a technical platform on which users can create challenges, support challenges, participate in challenges, upload contributions or submit them live and use community features.",
        "3.2 DarePay does not owe any specific economic success, any minimum number of participants, any minimum level of support payments or any payout, unless the requirements of the respective challenge rules have been fulfilled in full.",
        "3.3 DarePay is entitled to further develop the platform technically, visually and functionally, provided that essential contractual obligations are not unreasonably impaired as a result.",
        "3.4 DarePay provides the technical and organizational platform infrastructure.",
      ],
    },
    {
      title: "4. Registration and user account",
      paragraphs: [
        "4.1 The use of certain functions requires the creation of a user account.",
        "4.2 Users are obliged to provide complete and accurate information during registration and to keep such information up to date.",
        "4.3 Only one user account is permitted per person unless DarePay expressly allows multiple accounts.",
        "4.4 Access credentials must be kept secret and protected from access by third parties.",
        "4.5 DarePay is entitled to temporarily block or permanently close user accounts if false information has been provided, these Terms and Conditions have been violated, there is suspicion of abusive use, or legal or regulatory obligations require such action.",
      ],
    },
    {
      title: "5. Age limits, verification and participation requirements",
      paragraphs: [
        "5.1 The use of DarePay is permitted only for adults unless individual functions are expressly also permitted for minors.",
        "5.2 DarePay is entitled to require additional age, identity or verification proof for individual challenges, categories or payout functions.",
        "5.3 Content or challenges intended only for adult users may be accessed or used exclusively by appropriately verified users.",
        "5.4 DarePay is entitled to suspend participation rights or payout rights until a required verification has been fully completed.",
      ],
    },
    {
      title: "6. Creation of challenges",
      paragraphs: [
        "6.1 Users may create their own challenges in accordance with the platform functions.",
        "6.2 The creator of a challenge is obliged to formulate the challenge in such a way that the rules, participation requirements, evaluation standards, timing, risks and the requirements for winning are described clearly, truthfully and understandably.",
        "6.3 In particular, challenges must not violate applicable law, be misleading or fraudulent, encourage self-endangerment or endangerment of others, infringe third-party rights or otherwise violate DarePay’s community rules.",
        "6.4 DarePay is entitled to reject, block, remove or edit challenges in whole or in part before or after publication insofar as this is necessary for compliance with legal requirements, protection of the platform or enforcement of the platform rules.",
      ],
    },
    {
      title: "7. Participation in challenges",
      paragraphs: [
        "7.1 Users may participate in challenges only if they meet the respective participation requirements.",
        "7.2 There is no entitlement to participate in any particular challenge.",
        "7.3 DarePay is entitled to reject, block, mark as invalid or disqualify participation attempts if the challenge rules have not been observed, content has been manipulated or is technically impermissible, security, age or verification requirements have not been met or any other violation of these Terms and Conditions exists.",
        "7.4 Where a challenge requires live participation or a verified in-app recording, only the technical submission format specified by DarePay shall be decisive.",
      ],
    },
    {
      title: "8. Support payments and challenge-related allocation",
      paragraphs: [
        "8.1 Users may support challenges through payments insofar as this is provided for on the respective challenge page.",
        "8.2 Support payments are directly allocated to a specific challenge and processed on the platform.",
        "8.3 Upon successful completion of the payment process, DarePay shall — subject to technical or legal impediments — immediately begin the challenge-related execution of the owed platform service, in particular the receipt, booking, challenge-related allocation, management and further processing of the support payment.",
        "8.4 To the extent legally permissible and unless a mandatory right of withdrawal or other mandatory reversal right exists, support payments are generally not freely cancellable or unilaterally reclaimable after successful challenge-related allocation.",
        "8.5 A refund shall only be made if DarePay is legally obliged to do so, if the payment could not be processed effectively for technical or legal reasons, if DarePay expressly agrees to a refund as a gesture of goodwill, or if a reversal is required in connection with chargebacks, disputes, payment disruptions, suspected abuse, rule violations or official requirements.",
        "8.6 Support payments do not create any claim to a specific challenge outcome, participation entitlement, winnings or refund merely because the supported challenge later fails, is terminated, produces no winner or develops differently than the user expected.",
        "8.7 DarePay remains entitled to withhold, reallocate, block or reverse challenge-related amounts in whole or in part if this is necessary in connection with abuse, legal violations, rule violations, payment disruptions, disputes or mandatory statutory requirements.",
      ],
    },
    {
      title: "9. Platform fees and payment processing",
      paragraphs: [
        "9.1 DarePay is entitled to charge platform fees for the use of the platform, the provision of technical infrastructure, challenge handling, payment processing and payout organization.",
        "9.2 DarePay may use external payment service providers for payment processing.",
        "9.3 The terms of the respectively integrated payment service provider shall apply additionally.",
        "9.4 DarePay is entitled to adjust fee models insofar as this is reasonable for users and the changes are communicated transparently before their application.",
        "9.5 Insofar as fees are calculated as a percentage share, fixed fee or mixed model, the calculation shall be based on the structure shown at the time of payment or in the price overview.",
      ],
    },
    {
      title: "10. Payouts to winners and other eligible users",
      paragraphs: [
        "10.1 A claim to payout arises only if the respective challenge has been effectively completed, a winner has been effectively determined according to the challenge rules, no blocking, disqualification, abuse or review reason exists and the user has fulfilled all verification, identification and payout requirements requested by DarePay or the payment service provider.",
        "10.2 DarePay is entitled to withhold, delay or reject payouts in whole or in part if legal or regulatory requirements demand this, if there are uncertainties about entitlement, if refunds, disputes, chargebacks or suspicion of fraud exist, or if the user has violated these Terms and Conditions or challenge rules.",
        "10.3 DarePay may process payouts via connected payment or connected account structures.",
        "10.4 Where tax or regulatory obligations exist, the user is obliged to provide the necessary information and evidence for this purpose.",
      ],
    },
    {
      title: "11. Refunds, chargebacks, disputes and corrections",
      paragraphs: [
        "11.1 DarePay is entitled to withhold, reallocate, set off against later claims or reverse challenge-related amounts in whole or in part insofar as this is necessary in connection with refunds, payment disruptions, chargebacks, disputes, abuse, rule violations or legal obligations.",
        "11.2 Where payouts have already been made and it later turns out that the requirements for payout were not met or amounts must be reversed in whole or in part, DarePay may assert repayment claims or offset the respective amounts against future claims.",
        "11.3 Users are obliged to support DarePay to a reasonable extent in clarifying payment disruptions and disputes.",
      ],
    },
    {
      title: "12. Taxes, duties and users’ own responsibility",
      paragraphs: [
        "12.1 Users are themselves responsible for independently checking and fulfilling the tax and other legal obligations applicable to them in connection with support payments, winnings, prize money, payouts or other income.",
        "12.2 DarePay does not owe individual tax, legal or financial advice.",
        "12.3 Where DarePay is legally obliged to collect, store, report or pass on certain information to authorities or payment service providers, the user is obliged to provide the necessary information truthfully and completely.",
        "12.4 DarePay is entitled to make payouts dependent on the prior fulfillment of such obligations.",
      ],
    },
    {
      title: "13. Withdrawal for support payments and immediate start of performance",
      paragraphs: [
        "13.1 Insofar as a statutory right of withdrawal exists for support payments, the user shall be separately informed of this right before submitting the declaration obligating payment.",
        "13.2 In the order process, the user may expressly request that DarePay begin performance of the platform service before expiry of the withdrawal period.",
        "13.3 Insofar as the statutory requirements are met, the right of withdrawal may expire early, in particular if DarePay has fully performed the owed service and the user has expressly agreed that DarePay begins performing the service before expiry of the withdrawal period and has confirmed awareness that they lose their right of withdrawal upon full contract performance.",
        "13.4 The statutory right of withdrawal and its mandatory requirements shall otherwise remain unaffected.",
        "13.5 The mere allegation that, from the user’s point of view, a challenge did not develop economically or in substance as expected does not in itself establish any independent refund right outside mandatory statutory provisions.",
      ],
    },
    {
      title: "14. User content and rights",
      paragraphs: [
        "14.1 Users may upload, stream, publish or otherwise make content available within the scope of the platform.",
        "14.2 The user warrants that they possess all necessary rights to the content uploaded or used by them and that its use on DarePay is legally permissible.",
        "14.3 The user grants DarePay the simple, territorially unlimited, transferable rights of use to the uploaded content necessary for the operation, display, storage, moderation, technical processing, promotion of the platform and execution of the challenge, insofar as this is necessary for the respective purposes.",
        "14.4 DarePay is entitled to shorten content, technically adapt it, convert it into preview images, store it, secure it and make it publicly accessible within the scope of the platform functions.",
        "14.5 Content may be deleted or blocked if it violates these Terms and Conditions, statutory provisions or community rules.",
      ],
    },
    {
      title: "15. Prohibited use",
      paragraphs: [
        "In particular, it is prohibited to circumvent technical protection measures, abusively use multiple accounts, manipulate votes, rankings or payouts, submit content in an automated or script-controlled manner, introduce malware, deceive third parties, impersonate identities or otherwise misuse the platform.",
      ],
    },
    {
      title: "16. Moderation, reviews and measures by DarePay",
      paragraphs: [
        "16.1 DarePay is entitled to review content, payments, challenges, participant contributions and user accounts on a risk-based basis.",
        "16.2 DarePay may in particular take the following measures: warning, restriction of individual functions, temporary suspension, removal of individual content, revocation of ratings or rankings, disqualification, suspension or rejection of payouts, permanent account suspension.",
        "16.3 DarePay shall take these measures at its duly exercised discretion taking into account the legitimate interests of all parties involved.",
      ],
    },
    {
      title: "17. Availability",
      paragraphs: [
        "17.1 DarePay endeavors to ensure the highest possible availability of the platform.",
        "17.2 Continuous availability is not owed.",
        "17.3 DarePay is entitled to restrict the platform in whole or in part temporarily for maintenance, security, technical requirements or other objective reasons.",
      ],
    },
    {
      title: "18. Liability",
      paragraphs: [
        "18.1 DarePay shall be liable without limitation in cases of intent and gross negligence.",
        "18.2 In cases of slight negligence, DarePay shall be liable only in the event of breach of an essential contractual obligation; in this case liability is limited to the typical foreseeable damage.",
        "18.3 The foregoing limitations of liability shall not apply in cases of injury to life, body or health or in cases of mandatory statutory liability.",
        "18.4 DarePay shall not be liable for content, information, challenge descriptions or actual acts posted by users unless DarePay itself is responsible for them.",
        "18.5 In particular, DarePay shall not be liable for a challenge being economically successful, finding enough supporters or reaching a certain prize level.",
      ],
    },
    {
      title: "19. Indemnification",
      paragraphs: [
        "The user shall indemnify DarePay against all third-party claims arising from unlawful use of the platform, a breach of these Terms and Conditions, breach of challenge rules or infringement of third-party rights by the user, including reasonable legal defense costs, unless the user is not responsible for the breach of duty.",
      ],
    },
    {
      title: "20. Contract term and termination",
      paragraphs: [
        "20.1 The user agreement is concluded for an indefinite period.",
        "20.2 Users may terminate their user account at any time by ordinary notice insofar as no pending processing, payment, review or payout procedures prevent this.",
        "20.3 DarePay may terminate the user agreement by ordinary notice with a reasonable period of notice.",
        "20.4 The right to terminate without notice for good cause remains unaffected.",
        "20.5 After termination of the contract, certain data may remain stored within the scope of statutory retention obligations.",
      ],
    },
    {
      title: "21. Amendments to the Terms and Conditions",
      paragraphs: [
        "21.1 DarePay is entitled to amend these Terms and Conditions with effect for the future insofar as there is an objective reason for doing so, in particular in the event of changes in the legal situation, changes to platform functions, changes to the payment or payout structure or security or abuse-prevention requirements.",
        "21.2 Amendments shall be communicated to the user in an appropriate form in due time.",
        "21.3 If the user does not object to the amendments within the reasonable period specified by DarePay, the amendments shall be deemed accepted, provided that DarePay has expressly informed the user of this consequence beforehand.",
      ],
    },
    {
      title: "22. Consumer protection, withdrawal and electronic contract conclusion",
      paragraphs: [
        "22.1 Insofar as a statutory right of withdrawal exists, consumers shall receive a separate withdrawal policy regarding this.",
        "22.2 The statutory information and ordering obligations apply to paid contracts in electronic commerce.",
        "22.3 DarePay is entitled to adapt the user guidance, order flows and withdrawal processes to changed legal requirements.",
      ],
    },
    {
      title: "23. Final provisions",
      paragraphs: [
        "23.1 The law of the Federal Republic of Germany shall apply to the exclusion of the UN Convention on Contracts for the International Sale of Goods, insofar as no mandatory consumer protection provisions conflict with this.",
        "23.2 If the user is a merchant, a legal entity under public law or a special fund under public law, the place of jurisdiction for all disputes arising from or in connection with these Terms and Conditions shall be the registered office of DarePay.",
        "23.3 Should individual provisions of these Terms and Conditions be or become wholly or partially invalid, the validity of the remaining provisions shall remain unaffected.",
      ],
    },
  ],

  es: [
    {
      title: "1. Ámbito de aplicación",
      paragraphs: [
        "1.1 Estas Condiciones Generales regulan el uso de la plataforma “DarePay” operada por [NOMBRE DE LA EMPRESA] a través del sitio web y/o la app.",
        "1.2 DarePay es una plataforma digital en la que los usuarios pueden crear retos, apoyar retos, participar en retos, enviar contenidos, valorar contenidos y — con sujeción a las reglas aplicables — recibir pagos.",
        "1.3 Estas Condiciones Generales se aplican a todos los contratos entre DarePay y los usuarios en la versión vigente en el momento de la celebración del contrato.",
        "1.4 Los usuarios en el sentido de estas Condiciones Generales pueden ser consumidores o empresas.",
        "1.5 Las condiciones divergentes de los usuarios no pasarán a formar parte del contrato, salvo que DarePay acepte expresamente su validez por escrito.",
      ],
    },
    {
      title: "2. Proveedor",
      paragraphs: [
        "El proveedor de la plataforma es:",
        "[NOMBRE DE LA EMPRESA]",
        "[FORMA JURIDICA]",
        "[DIRECCION]",
        "[CORREO ELECTRONICO]",
        "[TELEFONO]",
        "[REGISTRO MERCANTIL / JUZGADO DE REGISTRO, si procede]",
        "[NUMERO DE IVA, si procede]",
      ],
    },
    {
      title: "3. Servicios de DarePay",
      paragraphs: [
        "3.1 DarePay pone a disposición una plataforma técnica en la que los usuarios pueden crear retos, apoyar retos, participar en retos, subir contribuciones o enviarlas en directo y utilizar funciones de comunidad.",
        "3.2 DarePay no debe ningún éxito económico concreto, ningún número mínimo de participantes, ningún nivel mínimo de pagos de apoyo ni ningún pago, salvo que se hayan cumplido íntegramente los requisitos de las reglas del reto correspondiente.",
        "3.3 DarePay está autorizada a seguir desarrollando la plataforma a nivel técnico, visual y funcional, siempre que ello no perjudique de forma irrazonable las obligaciones contractuales esenciales.",
        "3.4 DarePay proporciona la infraestructura técnica y organizativa de la plataforma.",
      ],
    },
    {
      title: "4. Registro y cuenta de usuario",
      paragraphs: [
        "4.1 El uso de determinadas funciones requiere la creación de una cuenta de usuario.",
        "4.2 Los usuarios están obligados a facilitar información completa y correcta durante el registro y a mantenerla actualizada.",
        "4.3 Solo se permite una cuenta de usuario por persona, salvo que DarePay autorice expresamente varias cuentas.",
        "4.4 Las credenciales de acceso deben mantenerse en secreto y protegerse frente al acceso de terceros.",
        "4.5 DarePay está autorizada a bloquear temporalmente o cerrar definitivamente cuentas de usuario si se han facilitado datos falsos, si existe una infracción de estas Condiciones Generales, si existe sospecha de uso abusivo o si obligaciones legales o regulatorias lo exigen.",
      ],
    },
    {
      title: "5. Límites de edad, verificación y requisitos de participación",
      paragraphs: [
        "5.1 El uso de DarePay solo está permitido a personas mayores de edad, salvo que determinadas funciones se permitan expresamente también a menores.",
        "5.2 DarePay está autorizada a exigir pruebas adicionales de edad, identidad o verificación para determinados retos, categorías o funciones de pago.",
        "5.3 Los contenidos o retos destinados únicamente a usuarios mayores de edad solo podrán ser consultados o utilizados por usuarios debidamente verificados.",
        "5.4 DarePay está autorizada a suspender derechos de participación o de cobro hasta que una verificación requerida haya concluido por completo.",
      ],
    },
    {
      title: "6. Creación de retos",
      paragraphs: [
        "6.1 Los usuarios pueden crear sus propios retos de acuerdo con las funciones de la plataforma.",
        "6.2 El creador de un reto está obligado a formularlo de forma que las reglas, los requisitos de participación, los criterios de evaluación, los plazos, los riesgos y las condiciones para ganar se describan de forma clara, veraz y comprensible.",
        "6.3 En particular, los retos no deben infringir la legislación aplicable, ser engañosos o fraudulentos, incitar a ponerse en peligro a uno mismo o a terceros, vulnerar derechos de terceros ni infringir de cualquier otro modo las normas de la comunidad de DarePay.",
        "6.4 DarePay está autorizada a rechazar, bloquear, eliminar o modificar retos, total o parcialmente, antes o después de su publicación, en la medida en que ello sea necesario para cumplir requisitos legales, proteger la plataforma o aplicar las normas de la plataforma.",
      ],
    },
    {
      title: "7. Participación en retos",
      paragraphs: [
        "7.1 Los usuarios solo podrán participar en retos si cumplen los requisitos de participación correspondientes.",
        "7.2 No existe ningún derecho a participar en cualquier reto.",
        "7.3 DarePay está autorizada a rechazar, bloquear, marcar como inválidos o descalificar intentos de participación si no se han respetado las reglas del reto, si los contenidos han sido manipulados o son técnicamente inadmisibles, si no se han cumplido requisitos de seguridad, edad o verificación, o si existe cualquier otra infracción de estas Condiciones Generales.",
        "7.4 En la medida en que un reto exija participación en directo o una grabación verificada dentro de la app, será determinante exclusivamente el formato técnico de envío especificado por DarePay.",
      ],
    },
    {
      title: "8. Pagos de apoyo y asignación al reto",
      paragraphs: [
        "8.1 Los usuarios pueden apoyar retos mediante pagos, siempre que esto esté previsto en la página del reto correspondiente.",
        "8.2 Los pagos de apoyo se asignan directamente a un reto concreto y se procesan en la plataforma.",
        "8.3 Una vez completado con éxito el proceso de pago, DarePay comenzará de inmediato — salvo impedimentos técnicos o legales — la ejecución de la prestación de plataforma vinculada al reto, en particular la recepción, contabilización, asignación al reto, gestión y posterior tratamiento del pago de apoyo.",
        "8.4 En la medida legalmente permitida y salvo que exista un derecho imperativo de desistimiento u otro derecho imperativo de reversión, los pagos de apoyo, una vez asignados con éxito al reto, no podrán cancelarse libremente ni reclamarse unilateralmente.",
        "8.5 Solo se efectuará un reembolso si DarePay está legalmente obligada a ello, si el pago no pudo procesarse de manera válida por razones técnicas o legales, si DarePay acepta expresamente un reembolso por cortesía o si una reversión es necesaria en relación con chargebacks, disputas, incidencias de pago, sospecha de abuso, infracciones de reglas o requerimientos de autoridades.",
        "8.6 Los pagos de apoyo no otorgan ningún derecho a un resultado concreto del reto, a participar, a ganar o a obtener un reembolso por el mero hecho de que el reto apoyado fracase posteriormente, se finalice, no produzca ganador o se desarrolle de forma distinta a la esperada por el usuario.",
        "8.7 DarePay seguirá estando autorizada a retener, reasignar, bloquear o revertir, total o parcialmente, importes vinculados a un reto cuando ello sea necesario en relación con abuso, infracciones legales, infracciones de reglas, incidencias de pago, disputas o requisitos legales imperativos.",
      ],
    },
    {
      title: "9. Comisiones de plataforma y procesamiento de pagos",
      paragraphs: [
        "9.1 DarePay está autorizada a cobrar comisiones de plataforma por el uso de la plataforma, la puesta a disposición de infraestructura técnica, la gestión de retos, el procesamiento de pagos y la organización de pagos.",
        "9.2 DarePay puede utilizar proveedores externos de servicios de pago para el procesamiento de pagos.",
        "9.3 Se aplicarán adicionalmente las condiciones del proveedor de pagos integrado en cada caso.",
        "9.4 DarePay está autorizada a adaptar los modelos de comisiones siempre que ello resulte razonable para los usuarios y los cambios se comuniquen de forma transparente antes de su aplicación.",
        "9.5 En la medida en que las comisiones se calculen como porcentaje, importe fijo o modelo mixto, el cálculo se regirá por la estructura indicada en el momento del pago o en el resumen de precios.",
      ],
    },
    {
      title: "10. Pagos a ganadores y otros usuarios autorizados",
      paragraphs: [
        "10.1 El derecho al cobro solo surge si el reto correspondiente ha concluido válidamente, se ha determinado válidamente un ganador conforme a las reglas del reto, no existe motivo de bloqueo, descalificación, abuso o revisión y el usuario ha cumplido todos los requisitos de verificación, identificación y cobro exigidos por DarePay o por el proveedor de pagos.",
        "10.2 DarePay está autorizada a retener, retrasar o rechazar pagos, total o parcialmente, si así lo exigen requisitos legales o regulatorios, si existen dudas sobre la legitimación, si existen reembolsos, disputas, chargebacks o sospecha de fraude, o si el usuario ha infringido estas Condiciones Generales o las reglas del reto.",
        "10.3 DarePay puede procesar pagos mediante estructuras de pago conectadas o connected accounts.",
        "10.4 En la medida en que existan obligaciones fiscales o regulatorias, el usuario está obligado a facilitar la información y documentación necesarias para ello.",
      ],
    },
    {
      title: "11. Reembolsos, chargebacks, disputas y correcciones",
      paragraphs: [
        "11.1 DarePay está autorizada a retener, reasignar, compensar con créditos futuros o revertir, total o parcialmente, importes vinculados a retos cuando ello sea necesario en relación con reembolsos, incidencias de pago, chargebacks, disputas, abuso, infracciones de reglas u obligaciones legales.",
        "11.2 Si ya se hubieran efectuado pagos y posteriormente resultara que no se cumplían los requisitos para el cobro o que los importes deben revertirse total o parcialmente, DarePay podrá reclamar su devolución o compensar los importes correspondientes con derechos futuros.",
        "11.3 Los usuarios están obligados a colaborar con DarePay de manera razonable en la aclaración de incidencias de pago y disputas.",
      ],
    },
    {
      title: "12. Impuestos, cargas y responsabilidad propia del usuario",
      paragraphs: [
        "12.1 Los usuarios son responsables de comprobar y cumplir por sí mismos las obligaciones fiscales y demás obligaciones legales que les sean aplicables en relación con pagos de apoyo, ganancias, premios, cobros u otros ingresos.",
        "12.2 DarePay no presta asesoramiento fiscal, jurídico ni financiero individual.",
        "12.3 En la medida en que DarePay esté legalmente obligada a recabar, almacenar, comunicar o transmitir determinada información a autoridades o proveedores de pago, el usuario está obligado a facilitar la información necesaria de forma veraz y completa.",
        "12.4 DarePay está autorizada a supeditar los pagos al cumplimiento previo de tales obligaciones.",
      ],
    },
    {
      title: "13. Desistimiento en pagos de apoyo e inicio inmediato de la prestación",
      paragraphs: [
        "13.1 En la medida en que exista un derecho legal de desistimiento para pagos de apoyo, se informará separadamente al usuario sobre dicho derecho antes de enviar su declaración de pago.",
        "13.2 En el proceso de pedido, el usuario puede solicitar expresamente que DarePay comience a ejecutar la prestación de la plataforma antes de que finalice el plazo de desistimiento.",
        "13.3 Siempre que se cumplan los requisitos legales, el derecho de desistimiento puede extinguirse anticipadamente, en particular si DarePay ha prestado íntegramente el servicio debido y el usuario ha aceptado expresamente que DarePay comience la ejecución antes de que finalice el plazo de desistimiento y ha confirmado conocer que pierde su derecho de desistimiento con el cumplimiento íntegro del contrato.",
        "13.4 El derecho legal de desistimiento y sus requisitos imperativos seguirán siendo aplicables en todo lo demás.",
        "13.5 La mera alegación de que, desde el punto de vista del usuario, un reto no se ha desarrollado económica o materialmente como se esperaba no constituye por sí misma un derecho autónomo de reembolso fuera de las disposiciones legales imperativas.",
      ],
    },
    {
      title: "14. Contenidos del usuario y derechos",
      paragraphs: [
        "14.1 Los usuarios pueden subir, retransmitir, publicar o poner a disposición de cualquier otro modo contenidos dentro del ámbito de la plataforma.",
        "14.2 El usuario garantiza que posee todos los derechos necesarios sobre los contenidos subidos o utilizados por él y que su uso en DarePay es legalmente admisible.",
        "14.3 El usuario concede a DarePay los derechos de uso simples, transferibles y sin limitación territorial necesarios sobre los contenidos publicados para el funcionamiento, la visualización, el almacenamiento, la moderación, el tratamiento técnico, la promoción de la plataforma y la ejecución del reto, en la medida necesaria para las finalidades correspondientes.",
        "14.4 DarePay está autorizada a acortar contenidos, adaptarlos técnicamente, convertirlos en imágenes de vista previa, almacenarlos, asegurarlos y hacerlos públicamente accesibles dentro del marco de las funciones de la plataforma.",
        "14.5 Los contenidos podrán eliminarse o bloquearse si infringen estas Condiciones Generales, disposiciones legales o normas de la comunidad.",
      ],
    },
    {
      title: "15. Uso prohibido",
      paragraphs: [
        "Queda especialmente prohibido eludir medidas técnicas de protección, utilizar de forma abusiva varias cuentas, manipular votaciones, clasificaciones o pagos, presentar contenidos de forma automatizada o controlada por scripts, introducir software malicioso, engañar a terceros, suplantar identidades o utilizar la plataforma de cualquier otra forma abusiva.",
      ],
    },
    {
      title: "16. Moderación, revisiones y medidas de DarePay",
      paragraphs: [
        "16.1 DarePay está autorizada a revisar, en función del riesgo, contenidos, pagos, retos, contribuciones de participantes y cuentas de usuario.",
        "16.2 DarePay podrá adoptar, en particular, las siguientes medidas: advertencia, limitación de funciones concretas, bloqueo temporal, eliminación de contenidos concretos, retirada de valoraciones o clasificaciones, descalificación, suspensión o rechazo de pagos, bloqueo definitivo de la cuenta.",
        "16.3 DarePay adoptará estas medidas a su discreción debidamente ejercida, teniendo en cuenta los intereses legítimos de todas las partes implicadas.",
      ],
    },
    {
      title: "17. Disponibilidad",
      paragraphs: [
        "17.1 DarePay se esfuerza por garantizar la máxima disponibilidad posible de la plataforma.",
        "17.2 No se debe una disponibilidad ininterrumpida.",
        "17.3 DarePay está autorizada a restringir temporalmente total o parcialmente la plataforma por motivos de mantenimiento, seguridad, requisitos técnicos u otras razones objetivas.",
      ],
    },
    {
      title: "18. Responsabilidad",
      paragraphs: [
        "18.1 DarePay responderá sin limitación en caso de dolo y negligencia grave.",
        "18.2 En caso de negligencia leve, DarePay solo responderá por el incumplimiento de una obligación contractual esencial; en este caso la responsabilidad se limita al daño previsible y típico del contrato.",
        "18.3 Las anteriores limitaciones de responsabilidad no se aplican en caso de lesión de la vida, la integridad física o la salud ni en caso de responsabilidad legal imperativa.",
        "18.4 DarePay no responderá por contenidos, datos, descripciones de retos o actos efectivos publicados por usuarios, salvo que exista una responsabilidad propia de DarePay.",
        "18.5 En particular, DarePay no responderá de que un reto tenga éxito económico, encuentre suficientes apoyos o alcance un determinado nivel de premio.",
      ],
    },
    {
      title: "19. Indemnización",
      paragraphs: [
        "El usuario indemnizará a DarePay frente a cualesquiera reclamaciones de terceros derivadas de un uso ilícito de la plataforma, de una infracción de estas Condiciones Generales, de las reglas de los retos o de la vulneración de derechos de terceros por parte del usuario, incluidos los costes razonables de defensa jurídica, salvo que el usuario no sea responsable de la infracción.",
      ],
    },
    {
      title: "20. Duración del contrato y resolución",
      paragraphs: [
        "20.1 El contrato de uso se celebra por tiempo indefinido.",
        "20.2 Los usuarios podrán cancelar su cuenta de usuario en cualquier momento de forma ordinaria, siempre que no existan procesos pendientes de gestión, pago, revisión o cobro que lo impidan.",
        "20.3 DarePay podrá resolver ordinariamente el contrato de uso con un preaviso razonable.",
        "20.4 El derecho de resolución sin preaviso por causa justificada no se verá afectado.",
        "20.5 Tras la finalización del contrato, determinados datos podrán seguir almacenados en el marco de las obligaciones legales de conservación.",
      ],
    },
    {
      title: "21. Modificaciones de las Condiciones Generales",
      paragraphs: [
        "21.1 DarePay está autorizada a modificar estas Condiciones Generales con efectos para el futuro siempre que exista un motivo objetivo para ello, en particular cambios en la situación legal, cambios en las funciones de la plataforma, cambios en la estructura de pagos o cobros o exigencias de seguridad o prevención de abusos.",
        "21.2 Las modificaciones se comunicarán al usuario de forma adecuada y con antelación suficiente.",
        "21.3 Si el usuario no se opone a las modificaciones dentro del plazo razonable fijado por DarePay, las modificaciones se considerarán aceptadas, siempre que DarePay haya informado expresamente de esta consecuencia con anterioridad.",
      ],
    },
    {
      title: "22. Protección del consumidor, desistimiento y contratación electrónica",
      paragraphs: [
        "22.1 En la medida en que exista un derecho legal de desistimiento, los consumidores recibirán una información separada sobre dicho derecho.",
        "22.2 Para los contratos onerosos celebrados por vía electrónica se aplican las obligaciones legales de información y pedido.",
        "22.3 DarePay está autorizada a adaptar la guía de usuario, los flujos de pedido y los procesos de desistimiento a cambios en los requisitos legales.",
      ],
    },
    {
      title: "23. Disposiciones finales",
      paragraphs: [
        "23.1 Será aplicable el derecho de la República Federal de Alemania, con exclusión de la Convención de las Naciones Unidas sobre los Contratos de Compraventa Internacional de Mercaderías, en la medida en que no se opongan disposiciones imperativas de protección de consumidores.",
        "23.2 Si el usuario es comerciante, persona jurídica de derecho público o patrimonio especial de derecho público, el fuero para todas las controversias derivadas de estas Condiciones Generales o relacionadas con ellas será el domicilio social de DarePay.",
        "23.3 Si alguna disposición de estas Condiciones Generales fuera o llegara a ser total o parcialmente inválida, la validez de las restantes disposiciones no se verá afectada.",
      ],
    },
  ],

  fr: [
    {
      title: "1. Champ d’application",
      paragraphs: [
        "1.1 Les présentes Conditions Générales régissent l’utilisation de la plateforme « DarePay » exploitée par [NOM DE L’ENTREPRISE] via le site web et/ou l’application.",
        "1.2 DarePay est une plateforme numérique sur laquelle les utilisateurs peuvent créer des défis, soutenir des défis, participer à des défis, soumettre du contenu, évaluer du contenu et — sous réserve des règles applicables — recevoir des paiements.",
        "1.3 Les présentes Conditions Générales s’appliquent à tous les contrats conclus entre DarePay et les utilisateurs dans leur version en vigueur au moment de la conclusion du contrat.",
        "1.4 Les utilisateurs au sens des présentes Conditions Générales peuvent être des consommateurs ou des entreprises.",
        "1.5 Les conditions divergentes des utilisateurs ne deviennent pas partie intégrante du contrat, sauf si DarePay accepte expressément leur validité par écrit.",
      ],
    },
    {
      title: "2. Fournisseur",
      paragraphs: [
        "Le fournisseur de la plateforme est :",
        "[NOM DE L’ENTREPRISE]",
        "[FORME JURIDIQUE]",
        "[ADRESSE]",
        "[E-MAIL]",
        "[TÉLÉPHONE]",
        "[REGISTRE DU COMMERCE / TRIBUNAL DU REGISTRE, le cas échéant]",
        "[NUMÉRO DE TVA, le cas échéant]",
      ],
    },
    {
      title: "3. Services de DarePay",
      paragraphs: [
        "3.1 DarePay met à disposition une plateforme technique sur laquelle les utilisateurs peuvent créer des défis, soutenir des défis, participer à des défis, téléverser des contributions ou les soumettre en direct et utiliser des fonctions communautaires.",
        "3.2 DarePay ne garantit aucun succès économique déterminé, aucun nombre minimal de participants, aucun niveau minimal de paiements de soutien ni aucun versement, sauf si les conditions des règles du défi concerné sont intégralement remplies.",
        "3.3 DarePay est autorisée à développer davantage la plateforme sur les plans technique, visuel et fonctionnel, à condition que les obligations contractuelles essentielles ne soient pas affectées de manière déraisonnable.",
        "3.4 DarePay fournit l’infrastructure technique et organisationnelle de la plateforme.",
      ],
    },
    {
      title: "4. Inscription et compte utilisateur",
      paragraphs: [
        "4.1 L’utilisation de certaines fonctions nécessite la création d’un compte utilisateur.",
        "4.2 Les utilisateurs sont tenus de fournir des informations complètes et exactes lors de l’inscription et de les maintenir à jour.",
        "4.3 Un seul compte utilisateur est autorisé par personne, sauf si DarePay autorise expressément plusieurs comptes.",
        "4.4 Les identifiants d’accès doivent rester secrets et être protégés contre l’accès de tiers.",
        "4.5 DarePay est autorisée à bloquer temporairement ou à fermer définitivement des comptes utilisateurs si de fausses informations ont été fournies, s’il existe une violation des présentes Conditions Générales, un soupçon d’utilisation abusive ou si des obligations légales ou réglementaires l’exigent.",
      ],
    },
    {
      title: "5. Limites d’âge, vérification et conditions de participation",
      paragraphs: [
        "5.1 L’utilisation de DarePay est réservée aux personnes majeures, sauf si certaines fonctions sont expressément également autorisées aux mineurs.",
        "5.2 DarePay est autorisée à exiger des justificatifs supplémentaires d’âge, d’identité ou de vérification pour certains défis, catégories ou fonctions de versement.",
        "5.3 Les contenus ou défis destinés uniquement aux utilisateurs majeurs ne peuvent être consultés ou utilisés que par des utilisateurs dûment vérifiés.",
        "5.4 DarePay est autorisée à suspendre les droits de participation ou de versement jusqu’à l’achèvement complet d’une vérification requise.",
      ],
    },
    {
      title: "6. Création de défis",
      paragraphs: [
        "6.1 Les utilisateurs peuvent créer leurs propres défis conformément aux fonctionnalités de la plateforme.",
        "6.2 Le créateur d’un défi est tenu de le formuler de manière à ce que les règles, conditions de participation, critères d’évaluation, délais, risques et conditions de gain soient décrits de manière claire, véridique et compréhensible.",
        "6.3 Les défis ne doivent notamment pas enfreindre le droit applicable, être trompeurs ou frauduleux, inciter à une mise en danger de soi-même ou d’autrui, porter atteinte aux droits de tiers ou enfreindre d’une autre manière les règles de la communauté de DarePay.",
        "6.4 DarePay est autorisée à refuser, bloquer, supprimer ou modifier des défis en tout ou en partie avant ou après leur publication dans la mesure où cela est nécessaire pour respecter les exigences légales, protéger la plateforme ou faire appliquer les règles de la plateforme.",
      ],
    },
    {
      title: "7. Participation aux défis",
      paragraphs: [
        "7.1 Les utilisateurs ne peuvent participer à des défis que s’ils remplissent les conditions de participation correspondantes.",
        "7.2 Il n’existe aucun droit à participer à n’importe quel défi.",
        "7.3 DarePay est autorisée à refuser, bloquer, marquer comme invalides ou disqualifier des tentatives de participation si les règles du défi n’ont pas été respectées, si des contenus ont été manipulés ou sont techniquement inadmissibles, si les exigences de sécurité, d’âge ou de vérification ne sont pas remplies ou si toute autre violation des présentes Conditions Générales existe.",
        "7.4 Lorsqu’un défi exige une participation en direct ou un enregistrement vérifié dans l’application, seul le format technique de soumission imposé par DarePay fait foi.",
      ],
    },
    {
      title: "8. Paiements de soutien et affectation au défi",
      paragraphs: [
        "8.1 Les utilisateurs peuvent soutenir des défis par des paiements dans la mesure où cela est prévu sur la page du défi concerné.",
        "8.2 Les paiements de soutien sont directement affectés à un défi concret et traités sur la plateforme.",
        "8.3 Après la réussite du processus de paiement, DarePay commence immédiatement — sous réserve d’obstacles techniques ou juridiques — l’exécution de la prestation de plateforme due en lien avec le défi, notamment la réception, l’enregistrement comptable, l’affectation au défi, la gestion et le traitement ultérieur du paiement de soutien.",
        "8.4 Dans la mesure permise par la loi et sauf droit impératif de rétractation ou autre droit impératif de réversion, les paiements de soutien ne sont en principe plus librement annulables ni récupérables unilatéralement après leur affectation réussie au défi.",
        "8.5 Un remboursement n’intervient que si DarePay y est légalement tenue, si le paiement n’a pas pu être traité valablement pour des raisons techniques ou juridiques, si DarePay accepte expressément un remboursement à titre commercial ou si une rétrofacturation est nécessaire en lien avec des chargebacks, litiges, perturbations de paiement, soupçons d’abus, violations des règles ou exigences des autorités.",
        "8.6 Les paiements de soutien n’ouvrent aucun droit à un résultat déterminé du défi, à un droit de participation, à un gain ou à un remboursement du seul fait que le défi soutenu échoue ultérieurement, soit interrompu, ne produise aucun gagnant ou évolue autrement que ce que l’utilisateur attendait.",
        "8.7 DarePay demeure autorisée à retenir, réaffecter, bloquer ou annuler en tout ou en partie des montants liés à un défi si cela est nécessaire en lien avec des abus, violations du droit, violations des règles, perturbations de paiement, litiges ou exigences légales impératives.",
      ],
    },
    {
      title: "9. Frais de plateforme et traitement des paiements",
      paragraphs: [
        "9.1 DarePay est autorisée à percevoir des frais de plateforme pour l’utilisation de la plateforme, la mise à disposition de l’infrastructure technique, la gestion des défis, le traitement des paiements et l’organisation des versements.",
        "9.2 DarePay peut recourir à des prestataires externes de services de paiement pour le traitement des paiements.",
        "9.3 Les conditions du prestataire de paiement intégré dans chaque cas s’appliquent en complément.",
        "9.4 DarePay est autorisée à adapter les modèles de frais dans la mesure où cela est raisonnable pour les utilisateurs et où les modifications sont communiquées de manière transparente avant leur application.",
        "9.5 Dans la mesure où les frais sont calculés sous la forme d’un pourcentage, d’un montant fixe ou d’un modèle mixte, le calcul est régi par la structure affichée au moment du paiement ou dans l’aperçu des prix.",
      ],
    },
    {
      title: "10. Versements aux gagnants et autres utilisateurs éligibles",
      paragraphs: [
        "10.1 Un droit au versement ne naît que si le défi concerné a été valablement achevé, si un gagnant a été valablement déterminé selon les règles du défi, s’il n’existe aucun motif de blocage, de disqualification, d’abus ou de vérification et si l’utilisateur a rempli toutes les exigences de vérification, d’identification et de versement demandées par DarePay ou le prestataire de paiement.",
        "10.2 DarePay est autorisée à retenir, retarder ou refuser des versements en tout ou en partie si des exigences légales ou réglementaires l’imposent, si des incertitudes existent quant au droit au versement, si des remboursements, litiges, chargebacks ou soupçons de fraude existent, ou si l’utilisateur a violé les présentes Conditions Générales ou les règles du défi.",
        "10.3 DarePay peut traiter les versements via des structures de paiement connectées ou connected accounts.",
        "10.4 Lorsqu’il existe des obligations fiscales ou réglementaires, l’utilisateur est tenu de fournir les informations et justificatifs nécessaires à cet effet.",
      ],
    },
    {
      title: "11. Remboursements, chargebacks, litiges et corrections",
      paragraphs: [
        "11.1 DarePay est autorisée à retenir, réaffecter, compenser avec des créances ultérieures ou annuler en tout ou en partie des montants liés à des défis si cela est nécessaire en lien avec des remboursements, perturbations de paiement, chargebacks, litiges, abus, violations des règles ou obligations légales.",
        "11.2 Si des versements ont déjà été effectués et qu’il s’avère ultérieurement que les conditions du versement n’étaient pas remplies ou que des montants doivent être annulés en tout ou en partie, DarePay peut faire valoir des droits au remboursement ou compenser les montants concernés avec des créances futures.",
        "11.3 Les utilisateurs sont tenus d’aider DarePay dans une mesure raisonnable à clarifier les perturbations de paiement et les litiges.",
      ],
    },
    {
      title: "12. Impôts, taxes et responsabilité propre des utilisateurs",
      paragraphs: [
        "12.1 Les utilisateurs sont eux-mêmes responsables de vérifier et de respecter de manière autonome les obligations fiscales et autres obligations légales qui leur sont applicables en lien avec les paiements de soutien, gains, prix, versements ou autres revenus.",
        "12.2 DarePay ne fournit aucun conseil fiscal, juridique ou financier individuel.",
        "12.3 Dans la mesure où DarePay est légalement tenue de recueillir, conserver, déclarer ou transmettre certaines informations aux autorités ou aux prestataires de paiement, l’utilisateur est tenu de fournir les informations nécessaires de manière véridique et complète.",
        "12.4 DarePay est autorisée à subordonner les versements au respect préalable de telles obligations.",
      ],
    },
    {
      title: "13. Rétractation pour les paiements de soutien et début immédiat de l’exécution",
      paragraphs: [
        "13.1 Dans la mesure où un droit légal de rétractation existe pour les paiements de soutien, l’utilisateur en est informé séparément avant de soumettre sa déclaration de paiement.",
        "13.2 Lors du processus de commande, l’utilisateur peut expressément demander que DarePay commence l’exécution de la prestation de plateforme avant l’expiration du délai de rétractation.",
        "13.3 Dans la mesure où les conditions légales sont remplies, le droit de rétractation peut s’éteindre de manière anticipée, notamment si DarePay a entièrement exécuté la prestation due et que l’utilisateur a expressément accepté que DarePay commence l’exécution avant l’expiration du délai de rétractation et a confirmé avoir connaissance du fait qu’il perd son droit de rétractation en cas d’exécution complète du contrat.",
        "13.4 Le droit légal de rétractation et ses conditions impératives demeurent par ailleurs inchangés.",
        "13.5 La simple affirmation selon laquelle, du point de vue de l’utilisateur, un défi ne s’est pas développé économiquement ou matériellement comme attendu ne fonde à elle seule aucun droit autonome au remboursement en dehors des dispositions légales impératives.",
      ],
    },
    {
      title: "14. Contenus des utilisateurs et droits",
      paragraphs: [
        "14.1 Les utilisateurs peuvent téléverser, diffuser, publier ou rendre autrement disponibles des contenus dans le cadre de la plateforme.",
        "14.2 L’utilisateur garantit qu’il détient tous les droits nécessaires sur les contenus qu’il téléverse ou utilise et que leur utilisation sur DarePay est juridiquement autorisée.",
        "14.3 L’utilisateur accorde à DarePay les droits d’utilisation simples, transférables et sans limitation territoriale nécessaires sur les contenus publiés pour l’exploitation, l’affichage, le stockage, la modération, le traitement technique, la promotion de la plateforme et l’exécution du défi, dans la mesure nécessaire aux finalités concernées.",
        "14.4 DarePay est autorisée à raccourcir des contenus, les adapter techniquement, les convertir en images d’aperçu, les stocker, les sécuriser et les rendre publiquement accessibles dans le cadre des fonctions de la plateforme.",
        "14.5 Les contenus peuvent être supprimés ou bloqués s’ils violent les présentes Conditions Générales, des dispositions légales ou les règles de la communauté.",
      ],
    },
    {
      title: "15. Utilisation interdite",
      paragraphs: [
        "Il est notamment interdit de contourner les mesures techniques de protection, d’utiliser abusivement plusieurs comptes, de manipuler les votes, classements ou versements, de soumettre des contenus de manière automatisée ou pilotée par script, d’introduire des logiciels malveillants, de tromper des tiers, d’usurper des identités ou d’utiliser la plateforme de toute autre manière abusive.",
      ],
    },
    {
      title: "16. Modération, contrôles et mesures de DarePay",
      paragraphs: [
        "16.1 DarePay est autorisée à contrôler, sur une base fondée sur le risque, les contenus, paiements, défis, contributions des participants et comptes utilisateurs.",
        "16.2 DarePay peut notamment prendre les mesures suivantes : avertissement, restriction de certaines fonctions, suspension temporaire, suppression de contenus spécifiques, retrait d’évaluations ou de classements, disqualification, suspension ou refus de versements, blocage définitif du compte.",
        "16.3 DarePay prend ces mesures selon son pouvoir d’appréciation dûment exercé en tenant compte des intérêts légitimes de toutes les parties concernées.",
      ],
    },
    {
      title: "17. Disponibilité",
      paragraphs: [
        "17.1 DarePay s’efforce d’assurer la plus grande disponibilité possible de la plateforme.",
        "17.2 Une disponibilité ininterrompue n’est pas due.",
        "17.3 DarePay est autorisée à restreindre temporairement tout ou partie de la plateforme pour des raisons de maintenance, de sécurité, d’exigences techniques ou d’autres raisons objectives.",
      ],
    },
    {
      title: "18. Responsabilité",
      paragraphs: [
        "18.1 DarePay est responsable sans limitation en cas d’intention et de faute lourde.",
        "18.2 En cas de faute légère, DarePay n’est responsable qu’en cas de violation d’une obligation contractuelle essentielle ; dans ce cas, la responsabilité est limitée au dommage typique et prévisible.",
        "18.3 Les limitations de responsabilité qui précèdent ne s’appliquent pas en cas d’atteinte à la vie, à l’intégrité physique ou à la santé ainsi qu’en cas de responsabilité légale impérative.",
        "18.4 DarePay n’est pas responsable des contenus, informations, descriptions de défis ou actes effectifs publiés par les utilisateurs, sauf si DarePay en est elle-même responsable.",
        "18.5 DarePay n’est notamment pas responsable du fait qu’un défi connaisse un succès économique, trouve suffisamment de soutiens ou atteigne un certain niveau de prix.",
      ],
    },
    {
      title: "19. Garantie / indemnisation",
      paragraphs: [
        "L’utilisateur garantit et indemnise DarePay contre toutes les réclamations de tiers résultant d’une utilisation illicite de la plateforme, d’une violation des présentes Conditions Générales, des règles des défis ou d’une atteinte aux droits de tiers par l’utilisateur, y compris les frais raisonnables de défense juridique, sauf si l’utilisateur n’est pas responsable de la violation.",
      ],
    },
    {
      title: "20. Durée du contrat et résiliation",
      paragraphs: [
        "20.1 Le contrat d’utilisation est conclu pour une durée indéterminée.",
        "20.2 Les utilisateurs peuvent résilier leur compte utilisateur à tout moment par résiliation ordinaire, dans la mesure où aucun processus en cours de traitement, de paiement, de vérification ou de versement ne s’y oppose.",
        "20.3 DarePay peut résilier le contrat d’utilisation par voie ordinaire avec un préavis raisonnable.",
        "20.4 Le droit de résiliation sans préavis pour motif grave demeure inchangé.",
        "20.5 Après la fin du contrat, certaines données peuvent rester stockées dans le cadre des obligations légales de conservation.",
      ],
    },
    {
      title: "21. Modifications des Conditions Générales",
      paragraphs: [
        "21.1 DarePay est autorisée à modifier les présentes Conditions Générales pour l’avenir s’il existe un motif objectif à cela, notamment en cas d’évolution de la situation juridique, de modification des fonctions de la plateforme, de modification de la structure de paiement ou de versement ou d’exigences en matière de sécurité ou de prévention des abus.",
        "21.2 Les modifications sont communiquées à l’utilisateur en temps utile et sous une forme appropriée.",
        "21.3 Si l’utilisateur ne s’oppose pas aux modifications dans le délai raisonnable fixé par DarePay, les modifications sont réputées acceptées, à condition que DarePay ait expressément attiré l’attention sur cette conséquence au préalable.",
      ],
    },
    {
      title: "22. Protection des consommateurs, rétractation et conclusion électronique des contrats",
      paragraphs: [
        "22.1 Dans la mesure où un droit légal de rétractation existe, les consommateurs reçoivent une information séparée à ce sujet.",
        "22.2 Les obligations légales d’information et de commande s’appliquent aux contrats payants conclus par voie électronique.",
        "22.3 DarePay est autorisée à adapter la navigation utilisateur, les parcours de commande et les processus de rétractation aux évolutions des exigences légales.",
      ],
    },
    {
      title: "23. Dispositions finales",
      paragraphs: [
        "23.1 Le droit de la République fédérale d’Allemagne s’applique à l’exclusion de la Convention des Nations Unies sur les contrats de vente internationale de marchandises, dans la mesure où aucune disposition impérative de protection des consommateurs ne s’y oppose.",
        "23.2 Si l’utilisateur est commerçant, personne morale de droit public ou fonds spécial de droit public, le tribunal compétent pour tous les litiges nés de ou en lien avec les présentes Conditions Générales est le siège de DarePay.",
        "23.3 Si certaines dispositions des présentes Conditions Générales étaient ou devenaient totalement ou partiellement nulles, la validité des autres dispositions resterait inchangée.",
      ],
    },
  ],
};

const RESOLVED_AGB_SECTIONS: Record<ChallengeLocale, LegalSection[]> = {
  de: agbSections.de,
  en: agbSections.en.length > 1 ? agbSections.en : agbSections.de,
  es: agbSections.es.length > 1 ? agbSections.es : agbSections.de,
  fr: agbSections.fr.length > 1 ? agbSections.fr : agbSections.de,
};

export function getLegalPageContent(
  key: LegalPageKey,
  locale: ChallengeLocale = "de"
): LegalPageContent {
  if (key === "agb") {
    return {
      eyebrow: agbPageMeta[locale]?.eyebrow ?? agbPageMeta.de.eyebrow,
      title: agbPageMeta[locale]?.title ?? agbPageMeta.de.title,
      intro: agbPageMeta[locale]?.intro ?? agbPageMeta.de.intro,
      sections: RESOLVED_AGB_SECTIONS[locale] ?? RESOLVED_AGB_SECTIONS.de,
    };
  }

  return LEGAL_CONTENT[locale]?.[key] ?? LEGAL_CONTENT.de[key];
}

export function getLegalSections(
  key: LegalPageKey,
  locale: ChallengeLocale = "de"
): LegalSection[] {
  if (key === "agb") {
    return RESOLVED_AGB_SECTIONS[locale] ?? RESOLVED_AGB_SECTIONS.de;
  }

  return (
    LEGAL_CONTENT[locale]?.[key]?.sections ??
    LEGAL_CONTENT.de[key].sections
  );
}

export const impressumSections = LEGAL_CONTENT.de.impressum.sections;
export const datenschutzSections = LEGAL_CONTENT.de.datenschutz.sections;
export const widerrufSections = LEGAL_CONTENT.de.widerruf.sections;
export const pricingSections = LEGAL_CONTENT.de.preise.sections;
export const payoutSections = LEGAL_CONTENT.de.auszahlungsrichtlinie.sections;

export function getLegalPageMeta(
  key: LegalPageKey,
  locale: ChallengeLocale = "de"
): LegalPageMeta {
  if (key === "agb") {
    return agbPageMeta[locale] ?? agbPageMeta.de;
  }

  const content = LEGAL_CONTENT[locale]?.[key] ?? LEGAL_CONTENT.de[key];

  return {
    back: locale === "de" ? "Zurück" : "Back",
    eyebrow: content.eyebrow,
    title: content.title,
    intro: content.intro,
    badges: ["", "", ""],
    warningTitle: "",
    warningText: "",
    languageNoticeTitle: "",
    languageNoticeText: "",
  };
}