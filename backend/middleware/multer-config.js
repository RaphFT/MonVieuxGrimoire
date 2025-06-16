const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Dossier où on va sauvegarder les images
const imagesFolder = path.join(__dirname, '..', 'images');

// Crée le dossier images s'il n'existe pas
if (!fs.existsSync(imagesFolder)) {
  fs.mkdirSync(imagesFolder);
}

// Multer va stocker le fichier en mémoire (buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Seulement JPEG et PNG autorisés'));
    }
  }
});

// Middleware pour traiter l’image avec Sharp et sauvegarder sur disque
const processImage = (req, res, next) => {
  if (!req.file) {
    return next(); // Pas d'image envoyée
  }

  const filename = `book-${Date.now()}.jpeg`; // Nom unique pour l'image

  sharp(req.file.buffer)               // Prend le buffer mémoire de Multer
    .resize(500, 750)                  // Redimensionne (largeur 500px, hauteur 750px)
    .jpeg({ quality: 80 })             // Convertit en jpeg qualité 80%
    .toFile(path.join(imagesFolder, filename))  // Sauvegarde dans dossier 'images'
    .then(() => {
      // On ajoute le chemin dans req.file pour l'utiliser après
      req.file.filename = filename;
      req.file.path = `/images/${filename}`;
      next();
    })
    .catch(err => next(err));
};

module.exports = {
  upload,
  processImage
};
