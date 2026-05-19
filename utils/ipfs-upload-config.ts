export type UploadType = "image" | "media" | "json";

export const COIN_DEPLOYMENT_DISCLAIMER =
  'I understand that this feature allows me to deploy tokens and liquidity pools using smart contracts. The software is provided "as is," and the platform does not create, control, or manage any coins deployed through it. I am responsible for how I configure and use this feature, and for complying with applicable laws. I acknowledge that token markets and smart contracts involve inherent risks, and I assume responsibility for using this feature.';

export const pinataOptions = {
  image: {
    max_file_size: 1 * 1024 * 1024,
    allow_mime_types: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
  },
  media: {
    max_file_size: 50 * 1024 * 1024,
    allow_mime_types: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "audio/mpeg",
      "audio/ogg",
      "audio/wav",
    ],
  },
  json: {
    max_file_size: 1 * 1024 * 1024,
    allow_mime_types: ["application/json"],
  },
} as const satisfies Record<
  UploadType,
  { max_file_size: number; allow_mime_types: readonly string[] }
>;

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
