// Extract and validate pagination parameters from request query
// Defaults: page=1, limit=10 if invalid or missing values
function getPaginationParams(req) {
  const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
  const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
  const offset = (page - 1) * limit; // Calculate SQL offset for pagination
  return { page, limit, offset };
}

// Create a new book record with required validation
// Returns the new book with generated ID
async function addBook({ connection, req }) {
  const { title, author, genre, description } = req.body;
  if (!title || !author) throw new Error('Title and author are required');

  const [result] = await connection.query(
    'INSERT INTO books (title, author, genre, description) VALUES (?, ?, ?, ?)',
    [title, author, genre || null, description || null]
  );
  return { id: result.insertId, title, author, genre, description };
}

// Retrieve paginated books with optional author/genre filters
async function getBooks({ connection, req }) {
  const { page, limit, offset } = getPaginationParams(req);
  const { author, genre } = req.query;

  let whereClauses = [];
  let params = [];

  if (author) {
    whereClauses.push('author LIKE ?');
    params.push(`%${author}%`);
  }
  if (genre) {
    whereClauses.push('genre = ?');
    params.push(genre);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [books] = await connection.query(
    `SELECT * FROM books ${whereSql} ORDER BY id  LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  
  // total count for pagination
  const [[{ total }]] = await connection.query(
    `SELECT COUNT(*) as total FROM books ${whereSql}`,
    params
  );

  return {
    page,
    limit,
    total,
    books,
  };
}

// Get book details with average rating and paginated reviews
// Includes reviewer usernames and sorts reviews by newest first
async function getBookById({ connection, req }) {
  const bookId = req.params.id;

  // Verify book exists
  const [[book]] = await connection.query('SELECT * FROM books WHERE id = ?', [bookId]);
  if (!book) throw new Error('Book not found');

  // Calculate average rating across all reviews
  const [[{ avgRating }]] = await connection.query(
    'SELECT AVG(rating) AS avgRating FROM reviews WHERE book_id = ?',
    [bookId]
  );

  // Get paginated reviews with user details
  const { page, limit, offset } = getPaginationParams(req);
  const [reviews] = await connection.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, r.updated_at, u.username
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.book_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [bookId, limit, offset]
  );

  // Get total review count for pagination
  const [[{ totalReviews }]] = await connection.query(
    'SELECT COUNT(*) as totalReviews FROM reviews WHERE book_id = ?',
    [bookId]
  );

  return {
    book,
    avgRating: avgRating ? Number(avgRating).toFixed(2) : null, // Format to 2 decimals
    reviews: {
      page,
      limit,
      totalReviews,
      data: reviews,
    },
  };
}

// Add user review for a book (prevents duplicate reviews)
// Validates rating range (1-5) and enforces one review per user per book
async function addReview({ connection, req }) {
  const bookId = req.params.id;
  const userId = req.user.id; // From authentication middleware
  const { rating, comment } = req.body;

  // Validate rating is within acceptable range
  if (!rating || rating < 1 || rating > 5) throw new Error('Rating must be 1 to 5');

  // Verify the book exists before adding review
  const [[book]] = await connection.query('SELECT id FROM books WHERE id = ?', [bookId]);
  if (!book) throw new Error('Book not found');

  // Prevent duplicate reviews from same user
  const [[existingReview]] = await connection.query(
    'SELECT id FROM reviews WHERE book_id = ? AND user_id = ?',
    [bookId, userId]
  );
  if (existingReview) throw new Error('You have already reviewed this book');

  const [result] = await connection.query(
    'INSERT INTO reviews (book_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
    [bookId, userId, rating, comment || null]
  );

  return { id: result.insertId, book_id: bookId, user_id: userId, rating, comment };
}

// Update user's own review with ownership validation
// Allows partial updates - only provided fields are changed
async function updateReview({ connection, req }) {
  const reviewId = req.params.id;
  const userId = req.user.id; // From authentication middleware
  const { rating, comment } = req.body;

  // Verify user owns this review (security check)
  const [[review]] = await connection.query(
    'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
    [reviewId, userId]
  );
  if (!review) throw new Error('Review not found or not owned by you');

  // Validate new rating if provided
  if (rating && (rating < 1 || rating > 5)) throw new Error('Rating must be 1 to 5');

  // Update with new values or keep existing ones
  await connection.query(
    'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
    [rating || review.rating, comment || review.comment, reviewId]
  );

  return { message: 'Review updated' };
}

// Delete user's own review with ownership validation  
// Ensures users can only delete their own reviews for security
async function deleteReview({ connection, req }) {
  const reviewId = req.params.id;
  const userId = req.user.id; // From authentication middleware

  // Verify user owns this review before deletion
  const [[review]] = await connection.query(
    'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
    [reviewId, userId]
  );
  if (!review) throw new Error('Review not found or not owned by you');

  await connection.query('DELETE FROM reviews WHERE id = ?', [reviewId]);

  return { message: 'Review deleted' };
}

// Search books by title or author with pagination
// Case-insensitive partial matching on both title and author fields
async function searchBooks({ connection, req }) {
  const { page, limit, offset } = getPaginationParams(req);
  const { query } = req.query;

  // Require search query parameter
  if (!query) {
    throw new Error("Query parameter 'query' is required");
  }

  const likeQuery = `%${query.toLowerCase()}%`; // Case-insensitive partial match

  const whereSql = `WHERE LOWER(title) LIKE ? OR LOWER(author) LIKE ?`;
  const params = [likeQuery, likeQuery, limit, offset];

  // Search matching books with pagination, sorted by title
  const [books] = await connection.query(
    `SELECT * FROM books ${whereSql} ORDER BY title LIMIT ? OFFSET ?`,
    params
  );

  // Get total count of matching books for pagination
  const [[{ total }]] = await connection.query(
    `SELECT COUNT(*) as total FROM books ${whereSql}`,
    [likeQuery, likeQuery]
  );

  return {
    page,
    limit,
    total,
    books,
  };
}

module.exports = {
  addBook,
  getBooks,
  getBookById,
  addReview,
  updateReview,
  deleteReview,
  searchBooks
};