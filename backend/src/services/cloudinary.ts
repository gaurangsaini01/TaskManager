import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { Readable } from "node:stream";
import { config } from "../config.js";
import { ApiError } from "../middleware/errorHandler.js";

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
    throw new ApiError(
      503,
      "File attachments are not configured on this server (missing Cloudinary credentials)",
      "ATTACHMENTS_DISABLED",
    );
  }
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export function uploadBuffer(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
        } else {
          resolve(result);
        }
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

export async function destroyFile(publicId: string, resourceType: string): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
