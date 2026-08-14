const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// ─────────────────────────────────────────────────────────────────
// Custom Cloudinary storage engine compatible with multer v2
// Reads the file stream, uploads to Cloudinary, returns path + filename
// ─────────────────────────────────────────────────────────────────
function CloudinaryStorageEngine(folder) {
  this.folder = folder;
}

CloudinaryStorageEngine.prototype._handleFile = function (req, file, cb) {
  const folder = this.folder;

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: `laziz/${folder}`,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
    (error, result) => {
      if (error) {
        console.error('[Cloudinary Upload Error]', error);
        return cb(error);
      }
      cb(null, {
        path: result.secure_url,      // req.file.path  → imageUrl
        filename: result.public_id,   // req.file.filename → cloudinaryPublicId
        size: result.bytes,
      });
    }
  );

  // In multer v2 the stream is on file.stream (non-enumerable)
  // In multer v1 it is also file.stream — works the same way
  if (file.stream) {
    file.stream.pipe(uploadStream);
  } else {
    // Fallback: buffer already in memory
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  }
};

CloudinaryStorageEngine.prototype._removeFile = function (req, file, cb) {
  if (file.filename) {
    cloudinary.uploader.destroy(file.filename, cb);
  } else {
    cb(null);
  }
};

// ─────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────
const createStorage = (folder) => new CloudinaryStorageEngine(folder);

const uploadProductImage = multer({
  storage: createStorage('menu'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed'), false);
    }
  },
});

const uploadCategoryImage = multer({
  storage: createStorage('categories'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed'), false);
    }
  },
});

const uploadProfileImage = multer({
  storage: createStorage('profiles'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed'), false);
    }
  },
});

const uploadSliderImage = multer({
  storage: createStorage('sliders'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed'), false);
    }
  },
});

const uploadOfferImage = multer({
  storage: createStorage('offers'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed'), false);
    }
  },
});

module.exports = {
  uploadProductImage,
  uploadCategoryImage,
  uploadProfileImage,
  uploadSliderImage,
  uploadOfferImage,
};
