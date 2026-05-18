import {
  formatFileSize,
  pinataOptions,
  type UploadType,
} from "@/utils/ipfs-upload-config";

type UploadResult = {
  cid: string;
  uri: string;
};

type UploadFileOptions = {
  type?: UploadType;
  onProgress?: (progress: number) => void;
};

type PinataUploadResponse = {
  data?: {
    cid?: string;
  };
  IpfsHash?: string;
  error?: string;
  message?: string;
};

export const validateUploadFile = (file: File, type: UploadType = "media") => {
  const options = pinataOptions[type];

  if (file.size > options.max_file_size) {
    throw new Error(
      `File must be ${formatFileSize(options.max_file_size)} or smaller.`
    );
  }

  if (!options.allow_mime_types.some((mimeType) => mimeType === file.type)) {
    throw new Error("Unsupported file type.");
  }
};

export const uploadFile = async (
  file: File,
  { type = "media", onProgress }: UploadFileOptions = {}
): Promise<UploadResult> => {
  validateUploadFile(file, type);

  const formData = new FormData();
  formData.append("network", "public");
  formData.append("file", file);
  formData.append("name", file.name);

  onProgress?.(10);

  const params = new URLSearchParams({
    type,
    fileName: file.name,
  });
  const response = await fetch(`/api/pinata/upload?${params.toString()}`, {
    method: "POST",
    body: formData,
  });
  const body = (await response
    .json()
    .catch(() => ({}))) as PinataUploadResponse;
  const cid = body.data?.cid || body.IpfsHash;

  if (!response.ok || !cid) {
    throw new Error(
      body.error ||
        body.message ||
        "IPFS upload failed. Check your connection and try again."
    );
  }

  onProgress?.(100);
  return { cid, uri: `ipfs://${cid}` };
};
