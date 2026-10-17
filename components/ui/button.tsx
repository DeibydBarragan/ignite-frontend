"use client";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
type Variant = "glass" | "solid" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant | "danger-soft" | "outline"; size?: Size | "icon";
  isLoading?: boolean; isDisabled?: boolean; isIconOnly?: boolean;
  onPress?: () => void;
}
const V: Record<string, string> = {
  glass: "glass-btn text-slate-700 dark:text-slate-200",
  solid: "bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-xs",
  ghost: "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10",
  danger: "bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs",
  "danger-soft": "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20",
  outline: "glass-btn text-slate-700 dark:text-slate-200",
};
const S: Record<string, string> = { sm: "h-8 px-3 text-xs rounded-xl", md: "h-10 px-4 text-sm rounded-xl", lg: "h-12 px-6 text-sm rounded-2xl", icon: "h-8 w-8 rounded-full p-0" };
export function Button({ variant = "glass", size = "sm", isLoading, isDisabled, isIconOnly, onPress, onClick, className = "", children, disabled, type, ...rest }: ButtonProps) {
  const d = disabled ?? isDisabled ?? isLoading ?? false;
  const sz = isIconOnly ? "icon" : size;
  const handleClick = onPress ?? onClick;
  return <button {...rest} type={type ?? "button"} disabled={d} onClick={handleClick} className={`inline-flex items-center justify-center gap-1.5 font-medium transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${V[variant] ?? V.glass} ${S[sz]} ${className}`}>{isLoading ? <Loader2 size={14} className="animate-spin" /> : null}{children}</button>;
}
