import type { Metadata } from "next";
import { prisma } from "@ekko/database";
import { SinglePostPage } from "@/components/feed/single-post-page";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        content: true,
        user: {
          select: {
            profile: {
              select: { displayName: true, username: true },
            },
          },
        },
      },
    });

    if (!post) {
      return { title: "Post not found" };
    }

    const authorName = post.user.profile?.displayName || "Someone";
    const description = post.content?.slice(0, 200) || `A post by ${authorName} on EKKO`;

    return {
      title: `${authorName} on EKKO`,
      description,
      openGraph: {
        title: `${authorName} on EKKO`,
        description,
      },
    };
  } catch {
    return { title: "Post" };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  return <SinglePostPage postId={id} />;
}
