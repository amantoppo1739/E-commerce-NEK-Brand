import { v2 as cloudinary } from 'cloudinary';

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadImage(file: File): Promise<string> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary not configured');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: 'image',
          folder: 'nek-products',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      )
      .end(buffer);
  });
}

export async function deleteImage(publicId: string) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return;
  }

  return cloudinary.uploader.destroy(publicId);
}

export function getCloudinaryPublicId(url: string): string | null {
  const match = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|webp)$/i);
  return match ? match[1] : null;
}

