// Pluggable file storage. When S3 env vars are set, objects are written to an
// S3-compatible bucket (AWS S3, Supabase Storage, Cloudflare R2, DigitalOcean
// Spaces). Otherwise files are written to the local uploads/ directory and
// served by Express. Local disk is fine for dev but ephemeral on hosts like
// Railway — configure S3 for production so photos and PDFs survive redeploys.
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.S3_REGION || 'us-east-1';
const ACCESS_KEY = process.env.S3_ACCESS_KEY_ID;
const SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY;
const ENDPOINT = process.env.S3_ENDPOINT; // for non-AWS S3-compatible providers
const PUBLIC_BASE = process.env.S3_PUBLIC_URL; // optional CDN / public base URL
const FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === 'true';

const enabled = Boolean(BUCKET && ACCESS_KEY && SECRET_KEY);

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;

const s3 = enabled
  ? new S3Client({
      region: REGION,
      endpoint: ENDPOINT || undefined,
      forcePathStyle: FORCE_PATH_STYLE,
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    })
  : null;

if (enabled) {
  console.log(`🗄️  Using S3 storage (bucket: ${BUCKET})`);
} else {
  console.warn('⚠️  S3 not configured — files stored on local disk (ephemeral on most hosts).');
}

function s3PublicUrl(key) {
  if (PUBLIC_BASE) return `${PUBLIC_BASE.replace(/\/$/, '')}/${key}`;
  if (ENDPOINT) return `${ENDPOINT.replace(/\/$/, '')}/${BUCKET}/${key}`;
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

// Save a buffer under `key` (e.g. "photos/123-abc.jpg"). Returns a public URL.
async function save(buffer, key, contentType) {
  if (enabled) {
    await s3.send(
      new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType })
    );
    return s3PublicUrl(key);
  }
  const dest = path.join(UPLOAD_DIR, key);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buffer);
  return `${PUBLIC_URL}/uploads/${key}`;
}

// Publish a file that already exists on local disk (e.g. a generated PDF).
// Uploads it to S3 when enabled; in local mode it's already served, so just
// return its URL. The local file is left in place for use as an email attachment.
async function publish(localPath, key, contentType) {
  if (enabled) {
    const buffer = fs.readFileSync(localPath);
    await s3.send(
      new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType })
    );
    return s3PublicUrl(key);
  }
  return `${PUBLIC_URL}/uploads/${key}`;
}

const CONTENT_TYPES = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// Open a stored object for streaming back through the API (so files can be
// served even when the bucket isn't publicly readable). Resolves to
// { stream, contentType, contentLength } or throws if the object is missing.
async function getStream(key) {
  if (enabled) {
    const out = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return { stream: out.Body, contentType: out.ContentType, contentLength: out.ContentLength };
  }
  const filepath = path.join(UPLOAD_DIR, key);
  const stat = fs.statSync(filepath); // throws ENOENT if absent → caller 404s
  return {
    stream: fs.createReadStream(filepath),
    contentType: CONTENT_TYPES[path.extname(key).toLowerCase()] || 'application/octet-stream',
    contentLength: stat.size,
  };
}

module.exports = { storageEnabled: enabled, save, publish, getStream, UPLOAD_DIR };
