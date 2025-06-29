const Book = require('../models/Book');
const { cleanupOldFiles } = require('../middleware/upload');

// POST => Enregistrement d'un livre
exports.createBook = (req, res) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      averageRating: bookObject.ratings[0].grade,
    });

    book.save()
      .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
      .catch((error) => {
        console.error('createBook Save Error:', error);
        res.status(400).json({ error });
      });
  } catch (error) {
    console.error('createBook Parse Error:', error);
    res.status(400).json({ message: 'Données invalides' });
  }
};

// GET => Récupération d'un livre spécifique
exports.getOneBook = (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }
      res.status(200).json(book);
    })
    .catch((error) => res.status(500).json({ message: 'Erreur serveur' }));
};

// PUT => Modification d'un livre existant
exports.modifyBook = (req, res) => {
  let bookObject;
  let oldImagePath;

  try {
    if (req.file) {
      bookObject = {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      };
    } else {
      bookObject = { ...req.body };
    }

    delete bookObject._userId;
  } catch (error) {
    return res.status(400).json({ message: 'Données invalides' });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }

      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: 'Non autorisé' });
      }

      // Sauvegarde du chemin de l'ancienne image pour nettoyage
      if (req.file && book.imageUrl) {
        oldImagePath = book.imageUrl.split('/images/')[1];
        oldImagePath = `images/${oldImagePath}`;
      }

      return Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id },
      );
    })
    .then(() => {
      // Nettoyage de l'ancienne image après mise à jour réussie
      if (oldImagePath) {
        cleanupOldFiles(oldImagePath);
      }
      res.status(200).json({ message: 'Livre modifié !' });
    })
    .catch((error) => {
      console.error('modifyBook Error:', error);
      res.status(500).json({ message: 'Erreur lors de la modification' });
    });
};

// DELETE => Suppression d'un livre
exports.deleteBook = (req, res) => {
  let imagePath;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }

      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: 'Non autorisé' });
      }

      // Sauvegarde du chemin de l'image pour nettoyage
      if (book.imageUrl) {
        imagePath = book.imageUrl.split('/images/')[1];
        imagePath = `images/${imagePath}`;
      }

      return Book.deleteOne({ _id: req.params.id });
    })
    .then(() => {
      // Nettoyage de l'image après suppression réussie
      if (imagePath) {
        cleanupOldFiles(imagePath);
      }
      res.status(200).json({ message: 'Livre supprimé !' });
    })
    .catch((error) => {
      console.error('deleteBook Error:', error);
      res.status(500).json({ message: 'Erreur lors de la suppression' });
    });
};

// GET => Récupération de tous les livres
exports.getAllBooks = (req, res) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => {
      console.error('getAllBooks Error:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération' });
    });
};

// POST => Création d'une note
exports.createRating = (req, res) => {
  const rating = parseInt(req.body.rating, 10);
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'La note doit être comprise entre 1 et 5' });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }

      const hasRated = book.ratings.some((r) => r.userId === req.auth.userId);
      if (hasRated) {
        return res.status(403).json({ message: 'Vous avez déjà noté ce livre' });
      }

      const newRating = {
        userId: req.auth.userId,
        grade: rating,
      };

      book.ratings.push(newRating);
      const totalRating = book.ratings.reduce((sum, r) => sum + r.grade, 0);
      // Calcul de la moyenne avec limitation à 2 décimales
      book.averageRating = Math.round((totalRating / book.ratings.length) * 100) / 100;

      return book.save();
    })
    .then((updatedBook) => res.status(201).json(updatedBook))
    .catch((error) => {
      console.error('createRating Error:', error);
      res.status(500).json({ message: 'Erreur lors de l\'ajout de la note' });
    });
};

// GET => Récupération des 3 livres les mieux notés
exports.getBestRating = (req, res) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => {
      console.error('getBestRating Error:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération' });
    });
};