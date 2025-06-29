const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Types MIME supportés avec leurs extensions
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Configuration du stockage Multer
const storage = multer.diskStorage({
  // Définition du dossier de destination
  destination: (req, file, callback) => {
    callback(null, 'images');
  },

  // Génération du nom de fichier unique
  filename: (req, file, callback) => {
    // Nettoyage du nom original (remplacement des espaces et points par des underscores)
    const cleanName = file.originalname.replace(/[\s.]+/g, '_');
    // Récupération de l'extension depuis le type MIME
    const extension = MIME_TYPES[file.mimetype];
    // Ajout d'un timestamp pour garantir l'unicité
    const timestamp = Date.now();
    // Nom final : nom_nettoyé_timestamp.extension
    const finalName = `${cleanName}_${timestamp}.${extension}`;
    
    callback(null, finalName);
  },
});

// Configuration de Multer avec validation des fichiers
const upload = multer({
  storage,
  // Validation des types de fichiers
  fileFilter: (req, file, callback) => {
    // Vérification du type MIME
    if (MIME_TYPES[file.mimetype]) {
      callback(null, true);
    } else {
      callback(new Error('Type de fichier non supporté. Utilisez JPG, PNG ou WebP.'), false);
    }
  },
  // Limitation de la taille du fichier (5MB max)
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB en octets
  },
}).single('image');

// Middleware d'export principal
module.exports = upload;

// Middleware de traitement et optimisation des images
module.exports.resizeImage = async (req, res, next) => {
  try {
    // Vérification de la présence d'un fichier
    if (!req.file) {
      return next();
    }

    const originalPath = req.file.path;
    const fileName = req.file.filename;
    
    // Génération du nom pour l'image optimisée (WebP)
    const nameWithoutExt = path.parse(fileName).name;
    const optimizedFileName = `${nameWithoutExt}_optimized.webp`;
    const optimizedPath = path.join('images', optimizedFileName);

    // Configuration de l'optimisation Sharp
    await sharp(originalPath)
      // Redimensionnement avec maintien des proportions
      .resize({
        width: 206,
        height: 260,
        fit: 'cover', // Recadrage pour maintenir les proportions
        position: 'center', // Centrage du recadrage
      })
      // Conversion en WebP avec optimisation
      .webp({
        quality: 80, // Qualité optimale (80% = bon compromis qualité/taille)
        effort: 6, // Niveau d'effort de compression (0-6)
      })
      // Suppression des métadonnées pour réduire la taille
      .withMetadata(false)
      // Sauvegarde du fichier optimisé
      .toFile(optimizedPath);

    // Suppression du fichier original après optimisation
    fs.unlink(originalPath, (err) => {
      if (err) {
        console.error('Erreur lors de la suppression du fichier original:', err);
      }
    });

    // Mise à jour du chemin du fichier dans la requête
    req.file.path = optimizedPath;
    req.file.filename = optimizedFileName;
    req.file.mimetype = 'image/webp';

    next();
  } catch (error) {
    console.error('Erreur lors du traitement de l\'image:', error);
    
    // En cas d'erreur, on supprime le fichier original s'il existe
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Erreur lors de la suppression du fichier:', err);
      });
    }
    
    // Retour d'une erreur 400 avec message explicite
    return res.status(400).json({
      message: 'Erreur lors du traitement de l\'image. Vérifiez le format et la taille.',
    });
  }
};

// Fonction utilitaire pour nettoyer les anciens fichiers
module.exports.cleanupOldFiles = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Erreur lors du nettoyage du fichier:', err);
      }
    });
  }
};