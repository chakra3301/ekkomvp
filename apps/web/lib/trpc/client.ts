import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@ekko/api";
import type { CreateTRPCReact } from "@trpc/react-query";

export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>();
