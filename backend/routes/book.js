const express = require('express');
const router = express.Router();

const bookCtrl = require('../controllers/book');
const { upload, processImage } = require('../middleware/multer-config');

router.post('/', upload.single('image'), processImage, bookCtrl.createBook);
router.put('/:id', upload.single('image'), processImage, bookCtrl.modifyBook);
router.delete('/:id', bookCtrl.deleteBook);
router.get('/:id', bookCtrl.getOneBook);
router.get('/', bookCtrl.getAllBooks);

module.exports = router;
