import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your EKKO account",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
