import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import r2Client, { R2_BUCKET } from '../config/r2Client.js';

// Builds a per-user, collision-resistant object key. Keeping the user id in
// the path costs nothing and makes the bucket easy to reason about/browse.
export const buildDocumentKey = (userId, originalName) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `documents/${userId}/${uniqueSuffix}-${safeName}`;
};

// Uploads a buffer (from multer's memoryStorage) directly to R2 — the file
// never touches this server's disk.
export const uploadBufferToR2 = async (buffer, key, contentType) => {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
};

export const deleteObjectFromR2 = async (key) => {
  if (!key) return;
  await r2Client.send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })
  );
};

// Short-lived signed URL — the caller must already have verified the
// requesting user owns this document before calling this. Default 5 min
// is plenty to load/view a PDF; it can be re-requested if it expires.
export const getSignedDownloadUrl = async (key, expiresInSeconds = 300) => {
  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
};
