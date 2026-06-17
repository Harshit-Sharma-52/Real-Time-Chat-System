import express from 'express';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import config from '../config/index.js';

const router = express.Router();

router.post('/', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    let messageType = 'file';
    if (req.file.mimetype.startsWith('image/')) messageType = 'image';
    else if (req.file.mimetype.startsWith('audio/')) messageType = 'audio';

    res.json({
      fileUrl,
      fileName: req.file.originalname,
      messageType,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
