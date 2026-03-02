"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Loader2,
  MoreHorizontal,
  UserX,
  ShieldAlert,
  Flag,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useProfile, useRealtimeChat } from "@/hooks";
import { trpc } from "@/lib/trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { ReportDialog } from "@/components/connect/report-dialog";
import { ConnectProfileCard } from "@/components/connect/connect-profile-card";

export default function ChatPage({
  params,
}: {
  params: { matchId: string };
}) {
  const router = useRouter();
  const { user } = useProfile();
  const [message, setMessage] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: match, isLoading: matchLoading } =
    trpc.connectMatch.getMatch.useQuery(params.matchId, {
      enabled: !!user,
    });

  const { data: messagesData, isLoading: messagesLoading } =
    trpc.connectChat.getMessages.useQuery(
      { matchId: params.matchId, limit: 50 },
      {
        enabled: !!user,
      }
    );

  const sendMessage = trpc.connectChat.sendMessage.useMutation();
  const markAsRead = trpc.connectChat.markAsRead.useMutation();
  const unmatch = trpc.connectMatch.unmatch.useMutation();
  const blockUser = trpc.block.block.useMutation();
  const utils = trpc.useUtils();

  // Real-time messages + typing indicators
  const { isOtherTyping, newMessageSignal, sendTyping } = useRealtimeChat(
    params.matchId,
    user?.id
  );

  // Refetch messages when realtime signals a new message
  useEffect(() => {
    if (newMessageSignal > 0) {
      utils.connectChat.getMessages.invalidate({ matchId: params.matchId });
    }
  }, [newMessageSignal, params.matchId, utils]);

  // Mark messages as read
  useEffect(() => {
    if (messagesData?.messages?.length) {
      markAsRead.mutate({ matchId: params.matchId });
    }
  }, [messagesData?.messages?.length, params.matchId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  if (matchLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Match not found</p>
      </div>
    );
  }

  const otherUser =
    match.user1Id === user?.id ? match.user2 : match.user1;
  const displayName = otherUser.profile?.displayName || "User";
  const messages = [...(messagesData?.messages || [])].reverse();

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      await sendMessage.mutateAsync({
        matchId: params.matchId,
        content: message.trim(),
      });
      setMessage("");
      await utils.connectChat.getMessages.invalidate({
        matchId: params.matchId,
      });
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleUnmatch = async () => {
    if (!confirm("Are you sure you want to unmatch?")) return;
    try {
      await unmatch.mutateAsync(params.matchId);
      toast.success("Unmatched");
      router.push("/matches");
    } catch {
      toast.error("Failed to unmatch");
    }
  };

  const handleBlock = async () => {
    if (!confirm("Block this user? This will also unmatch you.")) return;
    try {
      const otherUserId =
        match.user1Id === user?.id ? match.user2Id : match.user1Id;
      await blockUser.mutateAsync(otherUserId);
      await unmatch.mutateAsync(params.matchId);
      toast.success("User blocked");
      router.push("/matches");
    } catch {
      toast.error("Failed to block user");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 glass-bar">
        <Link href="/matches" className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <button
          onClick={() => setProfileSheetOpen(true)}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.profile?.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-left">
            <p className="font-semibold truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">Tap to view profile</p>
          </div>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleUnmatch}
              className="text-destructive"
            >
              <UserX className="h-4 w-4 mr-2" />
              Unmatch
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleBlock}
              className="text-destructive"
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              Block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setReportOpen(true)}>
              <Flag className="h-4 w-4 mr-2" />
              Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <p className="font-semibold mb-1">You matched with {displayName}!</p>
            <p className="text-sm text-muted-foreground">
              Break the ice — say something about their profile.
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === user?.id;
          return (
            <div
              key={msg.id}
              className={cn(
                "flex",
                isMine ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] px-4 py-2 rounded-2xl text-sm",
                  isMine
                    ? "chat-bubble-sent text-primary-foreground rounded-br-md"
                    : "btn-liquid-glass rounded-bl-md"
                )}
              >
                <p>{msg.content}</p>
                <p
                  className={cn(
                    "text-[10px] mt-1",
                    isMine
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground"
                  )}
                >
                  {formatRelativeTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="flex justify-start">
            <div className="btn-liquid-glass rounded-2xl rounded-bl-md px-4 py-2">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 glass-bar">
        <Input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            sendTyping();
          }}
          placeholder="Type a message..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || sendMessage.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <ReportDialog
        targetType="USER"
        targetId={match.user1Id === user?.id ? match.user2Id : match.user1Id}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />

      {/* Profile Sheet */}
      <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0 overflow-y-auto rounded-t-3xl">
          <SheetTitle className="sr-only">{displayName}&apos;s Profile</SheetTitle>
          {otherUser.connectProfile && (
            <ConnectProfileCard
              displayName={displayName}
              avatarUrl={otherUser.profile?.avatarUrl}
              headline={otherUser.connectProfile.headline}
              location={otherUser.connectProfile.location}
              lookingFor={otherUser.connectProfile.lookingFor}
              bio={otherUser.connectProfile.bio}
              mediaSlots={(otherUser.connectProfile.mediaSlots as any[]) || []}
              prompts={(otherUser.connectProfile.prompts as any[]) || []}
              instagramHandle={otherUser.connectProfile.instagramHandle}
              twitterHandle={otherUser.connectProfile.twitterHandle}
              websiteUrl={otherUser.connectProfile.websiteUrl}
              connectTier={otherUser.connectProfile.connectTier}
              className="rounded-none"
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
