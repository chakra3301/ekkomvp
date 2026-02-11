"use client";

import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface LoginPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

export function LoginPromptModal({
  open,
  onOpenChange,
  message,
}: LoginPromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center">
          <Image
            src="/logo.png"
            alt="EKKO"
            width={48}
            height={48}
            className="h-12 w-12 object-contain mb-2"
          />
          <DialogTitle className="text-xl font-bold text-center">
            Join EKKO
          </DialogTitle>
          <DialogDescription className="text-center">
            {message || "Sign in or create an account to continue."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-4">
          <Link href="/login" className="block">
            <Button className="w-full" size="lg">
              Log in
            </Button>
          </Link>
          <Link href="/register" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Sign up
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
