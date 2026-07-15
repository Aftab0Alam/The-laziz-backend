const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const createStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `laziz/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });

const uploadProductImage = multer({
  storage: createStorage('menu'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadCategoryImage = multer({
  storage: createStorage('categories'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadProfileImage = multer({
  storage: createStorage('profiles'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadSliderImage = multer({
  storage: createStorage('sliders'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadOfferImage = multer({
  storage: createStorage('offers'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = {
  uploadProductImage,
  uploadCategoryImage,
  uploadProfileImage,
  uploadSliderImage,
  uploadOfferImage,
};
