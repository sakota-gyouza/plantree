"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-bold text-text-sub">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 bg-cream border-2 border-border rounded-xl text-text placeholder:text-text-sub/50 focus:outline-none focus:border-coral transition-colors ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
