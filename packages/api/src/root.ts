import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { profileRouter } from "./routers/profile";
import { portfolioRouter } from "./routers/portfolio";
import { postRouter } from "./routers/post";
import { feedRouter } from "./routers/feed";
import { searchRouter } from "./routers/search";
import { followRouter } from "./routers/follow";
import { messageRouter } from "./routers/message";
import { notificationRouter } from "./routers/notification";
import { projectRouter } from "./routers/project";
import { applicationRouter } from "./routers/application";
import { workorderRouter } from "./routers/workorder";
import { collectiveRouter } from "./routers/collective";
import { bookmarkRouter } from "./routers/bookmark";
import { trendingRouter } from "./routers/trending";
import { reportRouter } from "./routers/report";
import { blockRouter } from "./routers/block";
import { adminRouter } from "./routers/admin";
import { subscriptionRouter } from "./routers/subscription";
import { analyticsRouter } from "./routers/analytics";
import { connectProfileRouter } from "./routers/connect-profile";
import { connectDiscoverRouter } from "./routers/connect-discover";
import { connectMatchRouter } from "./routers/connect-match";
import { connectChatRouter } from "./routers/connect-chat";

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  portfolio: portfolioRouter,
  post: postRouter,
  feed: feedRouter,
  search: searchRouter,
  follow: followRouter,
  message: messageRouter,
  notification: notificationRouter,
  project: projectRouter,
  application: applicationRouter,
  workorder: workorderRouter,
  collective: collectiveRouter,
  bookmark: bookmarkRouter,
  trending: trendingRouter,
  report: reportRouter,
  block: blockRouter,
  admin: adminRouter,
  subscription: subscriptionRouter,
  analytics: analyticsRouter,
  connectProfile: connectProfileRouter,
  connectDiscover: connectDiscoverRouter,
  connectMatch: connectMatchRouter,
  connectChat: connectChatRouter,
});

export type AppRouter = typeof appRouter;
