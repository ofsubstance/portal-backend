const cloudinary = require('cloudinary').v2;

export const CloudinaryUpload = async (
  file: any,
  folderName: string,
  pub_id: string,
) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  const imageUpload = await cloudinary.uploader.upload(file, {
    folder: folderName,
    public_id: pub_id,
    overwrite: true,
  });
  return imageUpload;
};
