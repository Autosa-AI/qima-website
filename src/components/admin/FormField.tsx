"use client";
import { TextareaHTMLAttributes, InputHTMLAttributes } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

type InputFieldProps = FormFieldProps &
  InputHTMLAttributes<HTMLInputElement> & { textarea?: false };

type TextareaFieldProps = FormFieldProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & { textarea: true };

type Props = InputFieldProps | TextareaFieldProps;

export default function FormField(props: Props) {
  const { label, error, required, hint, textarea, ...rest } = props as Props & {
    textarea?: boolean;
  };

  const baseClass = `w-full bg-white/[0.04] border rounded-xl px-3 py-2.5 text-white placeholder:text-white/25 text-sm focus:outline-none transition-colors ${
    error
      ? "border-red-500/50 focus:border-red-500/70"
      : "border-white/10 focus:border-[#C9A84C]/60"
  }`;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-white/60 text-xs font-medium">
        {label}
        {required && <span className="text-[#C9A84C] ml-1">*</span>}
      </label>
      {textarea ? (
        <textarea
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          className={`${baseClass} resize-none ${(rest as TextareaHTMLAttributes<HTMLTextAreaElement>).className ?? ""}`}
        />
      ) : (
        <input
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          className={`${baseClass} ${(rest as InputHTMLAttributes<HTMLInputElement>).className ?? ""}`}
        />
      )}
      {hint && !error && (
        <p className="text-white/30 text-xs">{hint}</p>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
