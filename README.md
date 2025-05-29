
# 📚 Book Review API

A RESTful API built with Node.js and MySQL to manage books and user reviews, with secure JWT authentication.

---

## 🚀 Tech Stack

- Node.js with Express.js
- MySQL Database
- JWT-based Authentication
- SQL transactions for consistency
- Postman or curl for testing

---

## ✅ Features

- User signup and login with secure JWT authentication
- Add, retrieve, and filter books
- Submit, update, and delete reviews (one per user per book)
- Pagination support on books and reviews
- Search functionality for books by title or author

---

## 🔐 Authentication Endpoints

### Signup
```bash
curl --location 'http://localhost:3000/api/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "password123"
}'
```

### Login
```bash
curl --location 'http://localhost:3000/api/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "testuser@example.com",
  "password": "password123"
}'
```

---

## 📚 Book Endpoints

### Add Book (Authenticated)
```bash
curl --location 'http://localhost:3000/api/books' \
--header 'Authorization: Bearer <jwt_token>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "title": "Book Title",
  "author": "Author Name",
  "genre": "Fiction",
  "published_year": 2024
}'
```

### Get All Books
```bash
curl --location 'http://localhost:3000/api/books?page=1&limit=5&author=John&genre=Fiction'
```

### Get Book by ID
```bash
curl --location 'http://localhost:3000/api/books/1'
```

---

## 📝 Review Endpoints

### Add Review
```bash
curl --location 'http://localhost:3000/api/books/1/reviews' \
--header 'Authorization: Bearer <jwt_token>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "rating": 4,
  "comment": "Great read!"
}'
```

### Update Review
```bash
curl --location --request PUT 'http://localhost:3000/api/reviews/1' \
--header 'Authorization: Bearer <jwt_token>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "rating": 5,
  "comment": "Updated review text"
}'
```

### Delete Review
```bash
curl --location --request DELETE 'http://localhost:3000/api/reviews/1' \
--header 'Authorization: Bearer <jwt_token>'
```

---

## 🔍 Search Endpoint

### Search Books
```bash
curl --location 'http://localhost:3000/api/search?query=harry&page=1&limit=5'
```

---

## ⚙️ Project Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/book-review-api.git
cd book-review-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:
```
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_SERVER=localhost
DB_DATABASE=book_review
JWT_SECRET=your_jwt_secret
PORT=3000
```

4. **Run the server**
```bash
npm start
```

---

## 📁 Source Code

- Modular structure with clear separation of concerns (routes, controllers, middleware, config)
- Uses environment variables for configuration
- Helpful inline comments for understanding logic
- Controller wrappers with SQL transaction support
- Includes complete request validation and error handling

---

## 🧠 Design Decisions & Assumptions

- One review per user per book
- JWT token must be passed in the `Authorization` header
- Pagination defaults: 10 items per page
- SQL used with parameterization to prevent SQL injection

---

## 🧪 Testing

You can use **curl** or **Postman** to test endpoints. Postman environment setup is optional and bearer tokens can be added in the Authorization tab.

