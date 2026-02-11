import type { User } from "@ekko/database";

export interface Context {
  user: User | null;
}

export function createContext(user: User | null): Context {
  return {
    user,
  };
}
