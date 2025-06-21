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
    const base64String = file.buffer.toString('base64');

    const imageUpload = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${base64String}`,
      {
        folder: folderName,
        public_id: pub_id,
        overwrite: true,
      },
    );

    return imageUpload;
  } catch (error) {
    throw new Error(error);
  }
};
