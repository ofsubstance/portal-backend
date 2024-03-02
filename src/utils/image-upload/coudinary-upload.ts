import { cloudinaryConfig } from '../configs/cloudinary.config';

const cloudinary = require('cloudinary').v2;

const fs = require('fs');

export const CloudinaryUpload = async (
  file: any,
  folderName: string,
  pub_id: string,
) => {
  cloudinary.config(cloudinaryConfig);
  const imageUpload = await cloudinary.uploader.upload(file, {
    folder: folderName,
    public_id: pub_id,
    overwrite: true,
  });
  return imageUpload;
};
