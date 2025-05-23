import express, { Request, Response } from 'express';
import { Database } from "./database/database";
import { Sequelize } from "sequelize";
import router from "./routes/routes";
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8000); // Set server port, default to 3000 if not specified
const sequelize: Sequelize = Database.getSequelize(); // Get Sequelize instance from the Database class

// Initialize the database connection and start the server
const connectDB = async () => {
    try {
        // Attempt to connect to the database
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
};

// Call the function to connect to the database
connectDB();

// Middleware to parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the routes defined in the routes file
app.use(router);

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});