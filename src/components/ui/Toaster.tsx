"use client";

import { Toaster as ReactHotToaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ToasterProps {
  className?: string;
}

/**
 * Toaster global do sistema com suporte nativo a Light/Dark e safe-area móvel.
 */
export function Toaster({ className }: ToasterProps) {
  return (
    <ReactHotToaster
      position="top-right"
      containerStyle={{
        zIndex: 500,
        top: "max(1rem, env(safe-area-inset-top))",
      }}
      toastOptions={{
        className: cn(
          "font-sans text-sm font-medium bg-card text-card-foreground border border-border shadow-lg rounded-xl px-4 py-3 max-w-[min(92vw,380px)]",
          className
        ),
        success: {
          iconTheme: {
            primary: "#16794C",
            secondary: "#FAF8F5",
          },
        },
        error: {
          iconTheme: {
            primary: "#C42B22",
            secondary: "#FAF8F5",
          },
        },
        loading: {
          iconTheme: {
            primary: "#D97706",
            secondary: "#FAF8F5",
          },
        },
      }}
    />
  );
}

export default Toaster;
