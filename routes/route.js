const express = require("express");
const router = express.Router();
const { transactionalControllerWrapper } = require('../utils/controllerWrapper');
const { authenticate } = require('../middlewares/auth');
const booksController = require('../controllers/books');
const { signup, login } = require('../controllers/auth');

router.post('/signup', transactionalControllerWrapper(signup));
router.post('/login', transactionalControllerWrapper(login));

// Add book (authenticated)
router.post('/books', authenticate, transactionalControllerWrapper(booksController.addBook));

// Get books (public)
router.get('/books', transactionalControllerWrapper(booksController.getBooks));

// Get book details + reviews (public)
router.get('/books/:id', transactionalControllerWrapper(booksController.getBookById));

// Add review (authenticated)
router.post('/books/:id/reviews', authenticate, transactionalControllerWrapper(booksController.addReview));

// Update review (authenticated)
router.put('/reviews/:id', authenticate, transactionalControllerWrapper(booksController.updateReview));

// Delete review (authenticated)
router.delete('/reviews/:id', authenticate, transactionalControllerWrapper(booksController.deleteReview));

//search books (public)
router.get('/search', transactionalControllerWrapper(booksController.searchBooks));

module.exports = router;
