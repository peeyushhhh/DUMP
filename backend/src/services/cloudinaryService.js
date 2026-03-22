const cloudinary = require('../config/cloudinary');

async function uploadImage(fileBuffer, mimetype) {
  const base64 = fileBuffer.toString('base64');
  const dataUri = `data:${mimetype};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'dump-drawings',
    transformation: [
      { width: 600, crop: 'limit' },
      { format: 'webp', quality: 'auto' }
    ]
  });

  return result.secure_url;
}

module.exports = { uploadImage };