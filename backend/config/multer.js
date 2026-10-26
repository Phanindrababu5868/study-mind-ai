import multer from 'multer';

// Memory storage — the file lives only as a Buffer in req.file.buffer for
// the lifetime of the request. It's forwarded straight to R2 and never
// written to this server's disk.
const storage = multer.memoryStorage();

// File filter — only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    const error = new Error('Only PDF files are allowed!');
    error.statusCode = 400; // otherwise the error handler reports it as a 500
    cb(error, false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  }
});

export default upload;
