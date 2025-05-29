const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); 
const recordsRoutes = require("./routes/route");

// Initialize Express application
const app = express();

// Enable Cross-Origin Resource Sharing for all routes
app.use(cors()); 

// Parse incoming JSON request bodies and make them available in req.body
app.use(bodyParser.json());

// Mount all API routes under the /api prefix
app.use("/api", recordsRoutes);

app.get("/", (req, res) => {
  res.send("Backend API is running. Please use the /api endpoint for requests.");
});

// Start server on specified port or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});