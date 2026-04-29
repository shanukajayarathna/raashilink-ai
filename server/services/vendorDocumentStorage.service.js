import fs from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localStorageDir = path.resolve(__dirname, '../uploads/vendor-documents');

const storageProvider = String(process.env.VENDOR_DOCUMENT_STORAGE || 'local').toLowerCase();

function buildSafeFileName(originalName = 'document') {
  const safeName = String(originalName || 'document')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
  const extension = path.extname(safeName);
  const baseName = path.basename(safeName, extension) || 'document';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${baseName}${extension}`;
}

function getS3Config() {
  const bucket = process.env.AWS_S3_BUCKET || '';
  const region = process.env.AWS_REGION || '';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
  const publicBaseUrl = (process.env.AWS_S3_PUBLIC_BASE_URL || '').replace(/\/$/, '');

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl,
  };
}

let s3Client = null;

function getS3Client(config) {
  if (!s3Client) {
    s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return s3Client;
}

async function storeDocumentInS3(file, config) {
  const key = `vendor-documents/${buildSafeFileName(file.originalname)}`;
  const client = getS3Client(config);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const url = config.publicBaseUrl
    ? `${config.publicBaseUrl}/${key}`
    : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;

  return {
    url,
    fileName: file.originalname,
  };
}

async function storeDocumentLocally(file, baseApiUrl) {
  fs.mkdirSync(localStorageDir, { recursive: true });

  const fileName = buildSafeFileName(file.originalname);
  const absolutePath = path.resolve(localStorageDir, fileName);
  await fsPromises.writeFile(absolutePath, file.buffer);

  return {
    url: `${baseApiUrl}/uploads/vendor-documents/${fileName}`,
    fileName: file.originalname,
  };
}

export async function storeVendorDocuments({ files = [], baseApiUrl }) {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const s3Config = storageProvider === 's3' ? getS3Config() : null;
  const useS3 = Boolean(s3Config);

  const output = [];
  for (const file of files) {
    if (useS3) {
      output.push(await storeDocumentInS3(file, s3Config));
      continue;
    }

    output.push(await storeDocumentLocally(file, baseApiUrl));
  }

  return output;
}
