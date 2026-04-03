const https = require('https');
const cloudinary = require('../config/cloudinary');

/** Avoid "Stale request" when the host system clock is wrong (signing uses timestamp). */
let cachedUploadTimestamp = { ts: null, expiresAt: 0 };

function getTimestampFromCloudinaryHead() {
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'res.cloudinary.com',
        path: '/',
        method: 'HEAD',
        timeout: 4500,
      },
      (res) => {
        const dateHeader = res.headers.date;
        res.resume();
        if (!dateHeader) {
          resolve(null);
          return;
        }
        const unix = Math.floor(new Date(dateHeader).getTime() / 1000);
        if (Number.isNaN(unix) || unix <= 0) {
          resolve(null);
          return;
        }
        resolve(unix);
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function resolveUploadTimestamp() {
  const now = Date.now();
  if (cachedUploadTimestamp.ts != null && cachedUploadTimestamp.expiresAt > now) {
    return cachedUploadTimestamp.ts;
  }
  const networkTs = await getTimestampFromCloudinaryHead();
  if (networkTs != null) {
    cachedUploadTimestamp = { ts: networkTs, expiresAt: now + 60_000 };
    return networkTs;
  }
  return Math.floor(now / 1000);
}

async function uploadImage(fileBuffer, mimetype) {
  const base64 = fileBuffer.toString('base64');
  const dataUri = `data:${mimetype};base64,${base64}`;
  const timestamp = await resolveUploadTimestamp();

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'dump-drawings',
    timestamp,
    transformation: [
      { width: 600, crop: 'limit' },
      { format: 'webp', quality: 'auto' },
    ],
  });

  return result.secure_url;
}

module.exports = { uploadImage };
