const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// إعداد مكان واسم الملف
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // الفولدر اللي لسه عاملينه
  },
  filename: function (req, file, cb) {
    // بنضيف وقت الرفع لاسم الملف عشان ميتكررش
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// مسار الرفع
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'لم يتم رفع أي ملف' });
  }
  // السيرفر بيرد علينا برابط الملف عشان نحفظه في الداتا بيز
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

module.exports = router;