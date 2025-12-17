import { useState, useEffect } from "react";
import {
  useLikePost,
  useCommentOnPost,
  useGetUserProfile,
  useDeletePost,
  useIsCurrentUserAdmin,
} from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ⚙️ UI components – relative paths, no "@/..."
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import MediaDisplay from "./MediaDisplay";
import type { Post } from "../backend";

interface PostCardProps {
  post: Post;
  isPublicView?: boolean;
}

export default function PostCard({ post, isPublicView = false }: PostCardProps) {
  const { identity } = useInternetIdentity();
  const likePost = useLikePost();
  const commentOnPost = useCommentOnPost();
  const deletePost = useDeletePost();
  const { data: authorProfile } = useGetUserProfile(post.author.toString());
  const { data: isAdmin } = useIsCurrentUserAdmin();

  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Is current user author or admin?
  const isPostAuthor =
    identity && post.author.toString() === identity.getPrincipal().toString();
  const canDelete = !isPublicView && (isPostAuthor || isAdmin);

  // Load media if present
  useEffect(() => {
    if (post.media) {
      setMediaUrl(post.media.getDirectURL());
    } else {
      setMediaUrl(null);
    }
  }, [post.media]);

  const handleLike = () => {
    if (isPublicView) return;
    likePost.mutate(post.id);
  };

  const handleComment = () => {
    if (isPublicView || !newComment.trim()) return;

    commentOnPost.mutate(
      { postId: post.id, content: newComment },
      {
        onSuccess: () => {
          setNewComment("");
        },
      },
    );
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
      },
    });
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          {/* Header: avatar + name + date + delete button */}
          <div className="mb-4 flex items-start gap-3">
            <Avatar>
              <AvatarImage src="/assets/generated/default-avatar.dim_100x100.png" />
              <AvatarFallback>
                {authorProfile ? getInitials(authorProfile.name) : "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">
                  {authorProfile?.name || "Anonymous"}
                </p>
                <span className="text-sm text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">
                  {formatTimestamp(post.timestamp)}
                </span>
              </div>

              {authorProfile && (
                <p className="text-sm text-muted-foreground">
                  {authorProfile.region}, {authorProfile.country}
                </p>
              )}
            </div>

            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteClick}
                disabled={deletePost.isPending}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Post content */}
          <p className="mb-4 whitespace-pre-wrap text-sm">{post.content}</p>

          {/* Media (image or video) */}
          {mediaUrl && (
            <div className="mb-4 w-full">
              <MediaDisplay
                mediaUrl={mediaUrl}
                alt="Post media"
                aspectRatio="video"
                className="w-full"
              />
            </div>
          )}

          {/* Likes + comments summary */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button
              onClick={handleLike}
              disabled={isPublicView || likePost.isPending}
              className={`flex items-center gap-1 transition-colors hover:text-red-500 ${
                isPublicView ? "cursor-not-allowed" : ""
              }`}
            >
              <Heart
                className={`h-4 w-4 ${
                  Number(post.likes) > 0 ? "fill-red-500 text-red-500" : ""
                }`}
              />
              <span>{Number(post.likes)}</span>
            </button>

            <button
              onClick={() => setShowComments((prev) => !prev)}
              className="flex items-center gap-1 transition-colors hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments.length}</span>
            </button>
          </div>
        </CardContent>

        {/* Comments section */}
        {showComments && (
          <CardFooter className="flex flex-col items-stretch gap-4 border-t pt-4">
            {post.comments.length > 0 && (
              <div className="space-y-3">
                {post.comments.map((comment, index) => (
                  <CommentItem key={index} comment={comment} />
                ))}
              </div>
            )}

            {!isPublicView && (
              <div className="flex gap-2">
                <Input
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                />
                <Button
                  onClick={handleComment}
                  disabled={commentOnPost.isPending || !newComment.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            {isPublicView && (
              <p className="text-center text-sm text-muted-foreground">
                Login to like and comment on posts
              </p>
            )}
          </CardFooter>
        )}
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this post?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              post and all its comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePost.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletePost.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePost.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CommentItem({
  comment,
}: {
  comment: { author: any; content: string; timestamp: bigint };
}) {
  const { data: commentAuthor } = useGetUserProfile(comment.author.toString());

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="flex gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src="/assets/generated/default-avatar.dim_100x100.png" />
        <AvatarFallback className="text-xs">
          {commentAuthor ? getInitials(commentAuthor.name) : "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 rounded-lg bg-muted p-3">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-sm font-semibold">
            {commentAuthor?.name || "Anonymous"}
          </p>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(comment.timestamp)}
          </span>
        </div>
        <p className="text-sm">{comment.content}</p>
      </div>
    </div>
  );
}

