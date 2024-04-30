const cloudinary = require('cloudinary').v2;

export const CloudinaryUpload = async (
  file: Express.Multer.File,
  folderName: string,
  pub_id: string,
) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    // Check if file.buffer is available for in-memory file uploads
    const fileToUpload = file.buffer
      ? { resource_type: 'auto', file: file.buffer }
      : file.path;

    const imageUpload = await cloudinary.uploader.upload(fileToUpload, {
      folder: folderName,
      public_id: pub_id,
      overwrite: true,
    });

    console.log(imageUpload);
    return imageUpload;
  } catch (error) {
    console.log(error);
  }
};
