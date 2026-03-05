import { registerPlugin } from "@capacitor/core";

interface AppleSignInResult {
  identityToken: string;
  user: string;
  email?: string;
  givenName?: string;
  familyName?: string;
}

interface AppleSignInPlugin {
  signIn(): Promise<AppleSignInResult>;
}

const AppleSignIn = registerPlugin<AppleSignInPlugin>("AppleSignIn");

export { AppleSignIn };
export type { AppleSignInResult };
