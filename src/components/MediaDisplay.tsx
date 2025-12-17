import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaDisplayProps {
  mediaUrl: string;
  alt?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "auto";
  /** Optional override: force treat media as image or video */
  forceType?: "image" | "video";
}

// File extension helpers
const VIDEO_EXTENSIONS = [
  "mp4",
  "webm",
  "ogg",
  "ogv",
  "mov",
  "avi",
  "m4v",
  "mkv",
  "quicktime",
  "3gp",
  "flv",
];
const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
  "avif",
];

const getMimeType = (extension: string): string => {
  const mimeMap: Record<string, string> = {
    mp4: "video/mp4",
    m4v: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
    ogv: "video/ogg",
    mov: "video/quicktime",
    quicktime: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    "3gp": "video/3gpp",
    flv: "video/x-flv",
  };

  const key = extension.toLowerCase();
  return mimeMap[key] || `video/${key}`;
};

const getVideoMimeTypes = (url: string): string[] => {
  const urlWithoutQuery = url.split("?")[0];
  const parts = urlWithoutQuery.split(".");
  const extension = parts[parts.length - 1]?.toLowerCase();
  const types: string[] = [];

  if (extension) {
    types.push(getMimeType(extension));
  }

  const fallbacks = ["video/mp4", "video/webm", "video/ogg"];
  fallbacks.forEach((t) => {
    if (!types.includes(t)) types.push(t);
  });

  return types;
};

export default function MediaDisplay({
  mediaUrl,
  alt = "Media content",
  className = "",
  aspectRatio = "auto",
  forceType,
}: MediaDisplayProps) {
  const [mediaType, setMediaType] = useState<"image" | "video" | "error">(
    "image"
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [detectedMimeTypes, setDetectedMimeTypes] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const maxRetries = 3;

  // Detect media type
  useEffect(() => {
    const detectMediaType = async () => {
      if (!mediaUrl) {
        setMediaType("error");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");

      // If caller forces a type, honor that and skip detection
      if (forceType) {
        if (forceType === "video") {
          setMediaType("video");
          setDetectedMimeTypes(getVideoMimeTypes(mediaUrl));
        } else {
          setMediaType("image");
          setDetectedMimeTypes([]);
        }
        setIsLoading(false);
        return;
      }

      try {
        const urlWithoutQuery = mediaUrl.split("?")[0];
        const parts = urlWithoutQuery.split(".");
        const ext = parts[parts.length - 1]?.toLowerCase();

        if (ext && VIDEO_EXTENSIONS.includes(ext)) {
          setMediaType("video");
          setDetectedMimeTypes(getVideoMimeTypes(mediaUrl));
          setIsLoading(false);
          return;
        }

        if (ext && IMAGE_EXTENSIONS.includes(ext)) {
          setMediaType("image");
          setDetectedMimeTypes([]);
          setIsLoading(false);
          return;
        }

        // Fallback: quick HEAD request for content-type
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const res = await fetch(mediaUrl, {
            method: "HEAD",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const contentType = res.headers.get("content-type") || "";

          if (contentType.startsWith("video/")) {
            setMediaType("video");
            setDetectedMimeTypes([
              contentType,
              ...getVideoMimeTypes(mediaUrl),
            ]);
          } else if (contentType.startsWith("image/")) {
            setMediaType("image");
            setDetectedMimeTypes([]);
          } else {
            setMediaType("image");
            setDetectedMimeTypes([]);
          }
        } catch (headErr) {
          console.warn(
            "HEAD request failed, defaulting to image:",
            headErr
          );
          setMediaType("image");
          setDetectedMimeTypes([]);
        }
      } catch (err) {
        console.error("Error detecting media type:", err);
        setMediaType("image");
        setDetectedMimeTypes([]);
      } finally {
        setIsLoading(false);
      }
    };

    detectMediaType();
  }, [mediaUrl, retryCount, forceType]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Error playing video:", err);
          setErrorMessage(
            "Unable to play video. The format may not be supported by your browser."
          );
          setHasError(true);
        });
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
      // legacy vendor APIs are optional; we can skip them in TSX
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen();
    } else if ((video as any).webkitEnterFullscreen) {
      (video as any).webkitEnterFullscreen();
    } else if ((video as any).mozRequestFullScreen) {
      (video as any).mozRequestFullScreen();
    } else if ((video as any).msRequestFullscreen) {
      (video as any).msRequestFullscreen();
    }
  };

  const handleImageError = () => {
    setHasError(true);
    setMediaType("error");
    setIsLoading(false);
    setErrorMessage("Failed to load image");
  };

  const handleVideoError = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    const video = e.currentTarget;
    const error = video.error;

    let msg = "Failed to load video";

    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          msg = "Video loading was aborted";
          break;
        case error.MEDIA_ERR_NETWORK:
          msg = "Network error while loading video";
          break;
        case error.MEDIA_ERR_DECODE:
          msg = "Video format not supported or file is corrupted";
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          msg =
            "Video format not supported by your browser. Try MP4, WebM, or OGG format.";
          break;
      }
    }

    console.error("Video error:", msg, error);
    setErrorMessage(msg);
    setHasError(true);
    setIsLoading(false);
  };

  const handleVideoLoadedMetadata = () => {
    setIsLoading(false);
    setHasError(false);
    setErrorMessage("");
  };

  const handleVideoCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
    setErrorMessage("");
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setErrorMessage("");
  };

  const handleRetry = () => {
    if (retryCount >= maxRetries) return;
    setRetryCount((prev) => prev + 1);
    setHasError(false);
    setIsLoading(true);
    setErrorMessage("");

    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const getAspectRatioClass = () => {
    if (aspectRatio === "video") return "aspect-video";
    if (aspectRatio === "square") return "aspect-square";
    return "";
  };

  // Error UI
  if (hasError || mediaType === "error") {
    return (
      <div
        className={`relative w-full ${
          getAspectRatioClass() || "aspect-video"
        } ${className}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-lg p-4">
          <img
            src="/assets/generated/media-error-thumbnail.dim_100x100.png"
            alt="Failed to load media"
            className="w-20 h-20 mb-3 opacity-50"
          />
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              Failed to load media
            </span>
          </div>
          {errorMessage && (
            <p className="text-xs text-muted-foreground text-center mb-3 max-w-xs">
              {errorMessage}
            </p>
          )}
          {retryCount < maxRetries && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry ({retryCount + 1}/{maxRetries})
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={`relative w-full ${
          getAspectRatioClass() || "aspect-video"
        } ${className}`}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg animate-pulse">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-2"></div>
            <div className="text-muted-foreground text-sm">
              Loading media...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Video rendering
  if (mediaType === "video") {
    return (
      <div
        className={`relative w-full ${
          getAspectRatioClass() || "aspect-video"
        } group ${className}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onTouchStart={() => setShowControls(true)}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover rounded-lg bg-black"
          playsInline
          muted={isMuted}
          preload="metadata"
          onError={handleVideoError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={handleVideoLoadedMetadata}
          onCanPlay={handleVideoCanPlay}
          onClick={handlePlayPause}
          crossOrigin="anonymous"
          controlsList="nodownload"
          disablePictureInPicture={false}
        >
          {detectedMimeTypes.map((mimeType, index) => (
            <source key={index} src={mediaUrl} type={mimeType} />
          ))}
          <source src={mediaUrl} />
          Your browser does not support the video tag. Please try a
          different browser or download the video.
        </video>

        {/* Center play/pause button */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none ${
            showControls || !isPlaying ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button
            variant="secondary"
            size="icon"
            className="h-16 w-16 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm pointer-events-auto shadow-lg"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 text-white" />
            ) : (
              <Play className="h-8 w-8 text-white ml-1" />
            )}
          </Button>
        </div>

        {/* Bottom controls bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent rounded-b-lg transition-opacity duration-200 ${
            showControls || !isPlaying ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleMuteToggle}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={handleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/10 rounded-lg pointer-events-none" />
        )}
      </div>
    );
  }

  // Image rendering
  return (
    <div className={`relative w-full overflow-hidden rounded-lg ${className}`}>
      <div className={`relative w-full ${getAspectRatioClass()}`}>
        <img
          src={mediaUrl}
          alt={alt}
          className={`w-full h-full ${
            aspectRatio === "auto" ? "object-contain" : "object-cover"
          }`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}
