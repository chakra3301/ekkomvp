import { router, publicProcedure, protectedProcedure } from "../trpc";

export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});
