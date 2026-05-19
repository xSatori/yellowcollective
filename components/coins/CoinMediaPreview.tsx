/* eslint-disable @next/next/no-img-element */
import getNormalizedURI from "@/utils/getNormalizedURI";
import { IPFS_GATEWAY } from "constants/urls";
import { useEffect, useMemo, useState } from "react";

type CoinMediaPreviewProps = {
  mediaUrl: string;
  imageUrl?: string;
  title: string;
  symbol: string;
  className?: string;
  fallbackClassName?: string;
  controls?: boolean;
  hoverScale?: boolean;
};

const getMediaKind = (url: string) => {
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
  if (/\.(mp4|webm|mov|m4v)$/.test(cleanUrl)) return "video";
  if (/\.(mp3|ogg|wav|m4a)$/.test(cleanUrl)) return "audio";
  return "image";
};

export default function CoinMediaPreview({
  mediaUrl,
  imageUrl = "",
  title,
  symbol,
  className = "h-full w-full object-cover",
  fallbackClassName = "flex h-full w-full items-center justify-center bg-[#fff7bf] p-4 text-center font-heading text-2xl",
  controls = false,
  hoverScale = false,
}: CoinMediaPreviewProps) {
  const [hasError, setHasError] = useState(false);
  const sourceUrl = mediaUrl || imageUrl;
  const normalizedUrl = useMemo(
    () =>
      sourceUrl
        ? getNormalizedURI(sourceUrl, {
            preferredIPFSGateway: IPFS_GATEWAY.replace(/\/$/, ""),
          })
        : "",
    [sourceUrl]
  );
  const mediaKind = getMediaKind(normalizedUrl);
  const mediaClassName = `${className}${
    hoverScale ? " transition duration-200 group-hover:scale-[1.03]" : ""
  }`;

  useEffect(() => {
    setHasError(false);
  }, [normalizedUrl]);

  if (!normalizedUrl || hasError) {
    return <div className={fallbackClassName}>{symbol}</div>;
  }

  if (mediaKind === "video") {
    return (
      <video
        src={normalizedUrl}
        aria-label={title}
        className={mediaClassName}
        controls={controls}
        muted={!controls}
        playsInline
        loop={!controls}
        preload="metadata"
        onError={() => setHasError(true)}
      />
    );
  }

  if (mediaKind === "audio") {
    return (
      <div className={fallbackClassName}>
        <span>{symbol}</span>
        {controls && (
          <audio
            src={normalizedUrl}
            controls
            className="mt-4 w-full max-w-[320px]"
            onError={() => setHasError(true)}
          />
        )}
      </div>
    );
  }

  return (
    <img
      src={normalizedUrl}
      alt={title}
      className={mediaClassName}
      onError={() => setHasError(true)}
    />
  );
}
