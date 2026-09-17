import { S3Client } from '@aws-sdk/client-s3';

// Cloudflare R2 exposes an S3-compatible API, so the standard AWS SDK v3
// S3Client works unchanged — only the endpoint and region differ from AWS.
// region 'auto' is what R2 expects; it ignores the value but the SDK
// requires one to be set.
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME;
console.log('bucket name',process.env.R2_BUCKET_NAME)

export default r2Client;
