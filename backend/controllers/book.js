const Book = require('../models/Book');

exports.createBook = (req, res, next) => {
  console.log('req.body =', req.body);
  console.log('req.file =', req.file);

  delete req.body._id;

  let bookData = {};

  try {
    // Si req.body.book existe (c'est une string JSON), on la parse
    if (req.body.book) {
      bookData = JSON.parse(req.body.book);
    } else {
      // Sinon on prend directement req.body (cas sans form-data par exemple)
      bookData = { ...req.body };
    }
  } catch (error) {
    return res.status(400).json({ error: 'Données JSON invalides dans book' });
  }

  const bookObject = {
    ...bookData,
    imageUrl: req.file ? req.file.path : ''
  };

  console.log('bookObject to save:', bookObject);

  const book = new Book(bookObject);

  book.save()
    .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
    .catch(error => {
      console.error('Error saving book:', error);
      res.status(400).json({ error: error.message });
    });
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? 
      { ...req.body, imageUrl: req.file.path } : 
      { ...req.body };
  
    Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: 'Livre modifié !' }))
      .catch(error => res.status(400).json({ error }));
  }

exports.deleteBook = (req, res, next) => {
    Book.deleteOne({ _id: req.params.id })
      .then(() => res.status(200).json({ message: 'Livre supprimé !'}))
      .catch(error => res.status(400).json({ error }));
  }

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then(book => res.status(200).json(book))
      .catch(error => res.status(404).json({ error }));
  }

exports.getAllBooks = (req, res, next) => {
    Book.find()
      .then(books => res.status(200).json(books))
      .catch(error => res.status(400).json({ error }));
  }