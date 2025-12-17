import { useState } from 'react';
import { useGetAllPosts, useCreatePost, useGetCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Image as ImageIcon, Loader2, Globe, Video, AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalBlob } from '../backend';
import PostCard from './PostCard';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function CommunityFeed() {
  const { data: posts, isLoading } = useGetAllPosts();
  const { data: userProfile } = useGetCallerUserProfile();
  const { actor, isFetching: actorFetching } = useActor();
  const { identity, loginStatus } = useInternetIdentity();
  const createPost = useCreatePost();

  const [viewMode, setViewMode] = useState<'local' | 'global'>('local');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  // Check if actor is ready for authenticated operations
  const isActorReady = !!(actor && !actorFetching);
  const isAuthenticatedActorReady = !!(identity && isActorReady && loginStatus !== 'logging-in');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
      
      if (!isImage && !isVideo) {
        setFileError('Please select a valid image (JPEG, PNG, GIF, WebP) or video file (MP4, WebM, OGG, MOV)');
        e.target.value = '';
        return;
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setFileError('File size must be less than 50MB');
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedFile) return;
    if (!isAuthenticatedActorReady) {
      alert('Please wait for the connection to complete before posting');
      return;
    }

    setUploadProgress(0);
    let media: ExternalBlob | null = null;

    if (selectedFile) {
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        media = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      } catch (error) {
        console.error('Error processing file:', error);
        setFileError('Failed to process file. Please try again.');
        setUploadProgress(0);
        return;
      }
    }

    createPost.mutate(
      { content: newPostContent, media },
      {
        onSuccess: () => {
          setNewPostContent('');
          setSelectedFile(null);
          setUploadProgress(0);
          setFileError(null);
        },
        onError: (error) => {
          console.error('Error creating post:', error);
          setUploadProgress(0);
          
          // Check if error is related to authentication
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg.includes('delegation') || errorMsg.includes('expired') || errorMsg.includes('unauthorized')) {
            setFileError('Authentication may have expired. Please refresh the page and log in again if the issue persists.');
          } else {
            setFileError('Failed to create post. Please try again.');
          }
        },
      }
    );
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(0);
  };

  // Filter posts based on view mode and user location
  const filteredPosts = posts?.filter((post) => {
    if (viewMode === 'global') return true;
    
    // For local view, we need to check if post author is from same country/region
    // Since we don't have author profile in post, we'll show all for now
    // In a real implementation, you'd fetch author profiles or include location in posts
    return true;
  });

  const isVideoFile = selectedFile?.type.startsWith('video/');
  const isPostButtonDisabled = createPost.isPending || (!newPostContent.trim() && !selectedFile) || !isAuthenticatedActorReady;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Connection Status Alert */}
      {actorFetching && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Connecting to backend... Please wait before posting.
          </AlertDescription>
        </Alert>
      )}

      {!isAuthenticatedActorReady && !actorFetching && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connection to backend failed. Please refresh the page or try logging in again.
          </AlertDescription>
        </Alert>
      )}

      {/* View Mode Toggle */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'local' | 'global')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local">
                Local ({userProfile?.country || 'Your Area'})
              </TabsTrigger>
              <TabsTrigger value="global">
                <Globe className="h-4 w-4 mr-2" />
                Global
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {viewMode === 'local' 
              ? `Showing posts from ${userProfile?.country || 'your area'}` 
              : 'Showing posts from all locations'}
          </p>
        </CardContent>
      </Card>

      {/* Create Post Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <h2 className="text-lg font-semibold">Share with the Community</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What's on your mind? Share your thoughts, stories, or updates..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={4}
            className="resize-none"
            disabled={!isAuthenticatedActorReady}
          />

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              {isVideoFile ? (
                <Video className="h-5 w-5 text-primary flex-shrink-0" />
              ) : (
                <ImageIcon className="h-5 w-5 text-primary flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {fileError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading {isVideoFile ? 'video' : 'image'}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
              id="post-media"
              disabled={!isAuthenticatedActorReady}
            />
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              disabled={!isAuthenticatedActorReady}
            >
              <label htmlFor="post-media" className="cursor-pointer">
                <ImageIcon className="h-4 w-4 mr-2" />
                Add Photo/Video
              </label>
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={isPostButtonDisabled}
              className="ml-auto"
            >
              {createPost.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
          
          {!isAuthenticatedActorReady && (
            <p className="text-xs text-muted-foreground text-center">
              Waiting for backend connection...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Posts Feed */}
      {filteredPosts && filteredPosts.length > 0 ? (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCard key={post.id.toString()} post={post} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <img
              src="/assets/generated/empty-feed.dim_400x300.png"
              alt="No posts yet"
              className="w-48 h-36 mx-auto mb-4 opacity-50"
            />
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground">
              {viewMode === 'local' 
                ? 'No posts from your area yet. Try switching to Global view or be the first to post!' 
                : 'Be the first to share something with the community!'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
