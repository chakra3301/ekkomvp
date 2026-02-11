"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { LoginPromptModal } from "./login-prompt-modal";

interface LoginPromptContextType {
  /** Show the login prompt modal with an optional contextual message */
  promptLogin: (message?: string) => void;
}

const LoginPromptContext = createContext<LoginPromptContextType | null>(null);

export function LoginPromptProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const promptLogin = useCallback((msg?: string) => {
    setMessage(msg);
    setOpen(true);
  }, []);

  return (
    <LoginPromptContext.Provider value={{ promptLogin }}>
      {children}
      <LoginPromptModal open={open} onOpenChange={setOpen} message={message} />
    </LoginPromptContext.Provider>
  );
}

/**
 * Hook to trigger the login prompt modal from any component.
 * Returns a `promptLogin(message?)` function.
 */
export function useLoginPrompt(): LoginPromptContextType {
  const ctx = useContext(LoginPromptContext);
  if (!ctx) {
    // Fallback: if outside provider, no-op (avoids crashes during SSR or in layouts without the provider)
    return { promptLogin: () => {} };
  }
  return ctx;
}
