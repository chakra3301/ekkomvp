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
import { useProfile } from "@/hooks";
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
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { ReportDialog } from "@/components/connect/report-dialog";

export default function ChatPage({
  params,
}: {
  params: { matchId: string };
}) {
  const router = useRouter();
  const { user } = useProfile();
  const [message, setMessage] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
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
        refetchInterval: 5000,
      }
    );

  const sendMessage = trpc.connectChat.sendMessage.useMutation();
  const markAsRead = trpc.connectChat.markAsRead.useMutation();
  const unmatch = trpc.connectMatch.unmatch.useMutation();
  const blockUser = trpc.block.block.useMutation();
  const utils = trpc.useUtils();

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
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Link href="/matches" className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.profile?.avatarUrl || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{displayName}</p>
        </div>
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
          <div className="text-center text-muted-foreground text-sm py-8">
            Say hello to your match!
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
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "glass-card rounded-bl-md"
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
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
    </div>
  );
}
