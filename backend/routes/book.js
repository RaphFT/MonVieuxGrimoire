const express = require('express');

const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const bookCtrl = require('../controllers/book');

// Routes publiques (sans authentification)
router.get('/', bookCtrl.getAllBooks);
router.get('/bestrating', bookCtrl.getBestRating);
router.get('/:id', bookCtrl.getOneBook);

// Routes protégées (avec authentification)
router.post('/', auth, upload, upload.resizeImage, bookCtrl.createBook);
router.post('/:id/rating', auth, bookCtrl.createRating);
router.put('/:id', auth, upload, upload.resizeImage, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);

module.exports = router;
