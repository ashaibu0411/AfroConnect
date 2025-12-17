import { useState, useEffect, useRef } from 'react';
import { useGetGroupMessages, useSendGroupMessage, useGetUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Image as ImageIcon, Video, X, AlertCircle } from 'lucide-react';
import type { Group, GroupMessage } from '../backend';
import { ExternalBlob } from '../backend';
import MediaDisplay from './MediaDisplay';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function GroupMessageBubble({
  message,
  isOwn,
  senderPrincipal,
}: {
  message: GroupMessage;
  isOwn: boolean;
  senderPrincipal: string;
}) {
  const { data: senderProfile } = useGetUserProfile(senderPrincipal);

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && <p className="text-xs text-muted-foreground mb-1 px-3">{senderProfile?.name || 'User'}</p>}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
          }`}
        >
          {message.media && (
            <div className="mb-2 max-w-full overflow-hidden rounded-lg">
              <MediaDisplay 
                mediaUrl={message.media.getDirectURL()} 
                alt="Attachment" 
                aspectRatio="video"
                className="max-w-full"
              />
            </div>
          )}
          <p className="text-sm break-words">{message.content}</p>
          <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {new Date(Number(message.timestamp) / 1000000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GroupChatSection({ group }: { group: Group }) {
  const { data: messages, isLoading } = useGetGroupMessages(group.id);
  const sendGroupMessage = useSendGroupMessage();
  const { identity } = useInternetIdentity();

  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserPrincipal = identity?.getPrincipal().toString() || '';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() && !selectedFile) return;

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

    sendGroupMessage.mutate(
      {
        groupId: group.id,
        content: messageInput.trim() || '📎 Attachment',
        media,
      },
      {
        onSuccess: () => {
          setMessageInput('');
          setSelectedFile(null);
          setUploadProgress(0);
          setFileError(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        onError: (error) => {
          console.error('Error sending message:', error);
          setUploadProgress(0);
          setFileError('Failed to send message. Please try again.');
        },
      }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    
    if (file) {
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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isVideoFile = selectedFile?.type.startsWith('video/');

  return (
    <Card className="h-[calc(100vh-16rem)]">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{group.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{group.members.length} members</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[calc(100%-5rem)]">
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages && messages.length > 0 ? (
            <>
              {messages.map((message) => {
                const isOwn = message.sender.toString() === currentUserPrincipal;
                return (
                  <GroupMessageBubble
                    key={message.id.toString()}
                    message={message}
                    isOwn={isOwn}
                    senderPrincipal={message.sender.toString()}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <img
                src="/assets/generated/chat-bubble-transparent.dim_100x100.png"
                alt="No messages"
                className="w-20 h-20 mb-4 opacity-50"
              />
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-4 space-y-2">
          {selectedFile && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
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
              <Button size="sm" variant="ghost" onClick={handleRemoveFile}>
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
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime" 
              onChange={handleFileSelect} 
              className="hidden" 
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendGroupMessage.isPending}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sendGroupMessage.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={sendGroupMessage.isPending || (!messageInput.trim() && !selectedFile)}
            >
              {sendGroupMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
