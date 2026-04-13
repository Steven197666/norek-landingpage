"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type FooterLink = {
  href: string;
  label: string;
  action: string;
};

type AuthShellProps = {
  badge: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerLink?: FooterLink;
};

export default function AuthShell({
  badge,
  title,
  subtitle,
  children,
  footerLink,
}: AuthShellProps) {
  return (
    <main className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-120px] h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-80px] h-[280px] w-[280px] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-2xl items-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full"
        >
          <div className="mb-8">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="inline-flex rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-300"
            >
              {badge}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-4 max-w-xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base"
            >
              {subtitle}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
            className="rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl ring-1 ring-black/5 sm:p-8"
          >
            {children}
          </motion.div>

          {footerLink && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.28 }}
              className="mt-5 text-sm text-slate-300"
            >
              {footerLink.label}{" "}
              <Link
                href={footerLink.href}
                className="font-semibold text-teal-400 underline-offset-4 transition hover:text-teal-300 hover:underline"
              >
                {footerLink.action}
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}