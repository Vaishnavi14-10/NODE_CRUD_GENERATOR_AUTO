const express = require("express");
const app = express();
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Middleware
app.use(express.json());

// Swagger configuration
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CRUD API",
      version: "1.0.0",
      description: "Automatically generated CRUD APIs with Swagger",
    },
    servers: [
      {
        url: "http://localhost:3000", // 👈 this should be inside 'definition'
      },
    ],
  },
  apis: ["./routes/*.js", "./swagger-components/*.yaml"], // paths to your route + component files
});

// Serve Swagger docs at /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Test route
app.get("/", (req, res) => {
  res.send("✅ Server is running. Visit /api-docs for Swagger UI.");
});

// Route imports
const router = require("./routes/index"); // update this if your file is elsewhere
app.use("/api", router); // your CRUD routes accessible at /api/resource

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
