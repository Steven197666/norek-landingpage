"use client";

import React from "react";

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
  hint?: string;
  success?: string;
  disabled?: boolean;
  required?: boolean;
  as?: "input" | "textarea";
  rows?: number;
  min?: string | number;
  max?: string | number;
  step?: string | number;
};

export default function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  error,
  hint,
  success,
  disabled = false,
  required = false,
  as = "input",
  rows = 5,
  min,
  max,
  step,
}: TextFieldProps) {
  const baseClasses =
    "w-full rounded-2xl border bg-white px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

  const stateClasses = error
    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
    : "border-slate-300 focus:border-teal-700 focus:ring-teal-100";

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label}
      </label>

      {as === "textarea" ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          rows={rows}
          className={`${baseClasses} min-h-[140px] py-3 ${stateClasses}`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          className={`${baseClasses} h-12 ${stateClasses}`}
        />
      )}

      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : success ? (
        <p className="text-sm font-medium text-teal-700">{success}</p>
      ) : hint ? (
        <p className="text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}