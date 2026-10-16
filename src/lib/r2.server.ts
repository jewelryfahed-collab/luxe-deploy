// Server-only Cloudflare R2 client — replaces Supabase Storage for product
// media (photos + .glb/.gltf 3D models).
//
// Uses R2's S3-compatible API via a signed-request helper (aws4fetch) instead
// of a native Workers R2 binding, so the same code works whether this app is
// deployed to Cloudflare Workers or run anywhere else (local dev, another
// host) — only the environment variables below need to be set.
//
// Required environment variables:
//   R2_ACCOUNT_ID          Cloudflare account ID
//   R2_ACCESS_KEY_ID       R2 API token "Access Key ID"
//   R2_SECRET_ACCESS_KEY   R2 API token "Secret Access Key"
//   R2_BUCKET              bucket name, e.g. "fahed-media"
//   R2_PUBLIC_URL           the bucket's public base URL — either the R2.dev
//                           dev subdomain (https://pub-xxxx.r2.dev) or a
//                           custom domain you've mapped to the bucket, with
//                           *no* trailing slash.
//
// Create the bucket + a scoped API token in the Cloudflare dashboard under
// R2 → Manage R2 API Tokens, and turn on "Public access" (or a custom
// domain) on the bucket so uploaded files are reachable by URL.

import { AwsClient } from "aws4fetch";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}. Set it to your Cloudflare R2 credentials.`);
  }
  return value;
}

let _client: AwsClient | undefined;
function r2Client() {
  if (!_client) {
    _client = new AwsClient({
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      service: "s3",
      region: "auto",
    });
  }
  return _client;
}

function endpointFor(key: string) {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const bucket = requireEnv("R2_BUCKET");
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
}

/** Upload a file to R2 and return its public URL. */
export async function uploadToR2(key: string, file: File | Blob, contentType?: string) {
  const client = r2Client();
  const url = endpointFor(key);
  const headers: HeadersInit = contentType ? { "content-type": contentType } : {};
  const res = await client.fetch(url, { method: "PUT", body: file, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`R2 upload failed (${res.status}): ${body || res.statusText}`);
  }
  const publicBase = requireEnv("R2_PUBLIC_URL").replace(/\/$/, "");
  return `${publicBase}/${key}`;
}

/** Delete an object from R2 by its key (the path after the bucket name). */
export async function deleteFromR2(key: string) {
  const client = r2Client();
  const url = endpointFor(key);
  const res = await client.fetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => "");
    throw new Error(`R2 delete failed (${res.status}): ${body || res.statusText}`);
  }
}
