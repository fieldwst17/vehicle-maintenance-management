"use client";

import { useState, type ComponentProps, type PointerEvent } from "react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-styles";
import { Spinner } from "./spinner";

type Ripple = { id: number; x: number; y: number; size: number };

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

/** Button with a ripple on press, lift on hover, and a loading state */
export function Button({ variant = "primary", size = "md", loading, className, children, onPointerDown, disabled, ...props }: ButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function handlePointerDown(e: PointerEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = { id: Date.now() + Math.random(), x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size };
    setRipples((r) => [...r, ripple]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== ripple.id)), 650);
    onPointerDown?.(e);
  }

  return (
    <button
      className={buttonClasses(variant, size, className)}
      onPointerDown={handlePointerDown}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-current opacity-30 animate-ripple"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
