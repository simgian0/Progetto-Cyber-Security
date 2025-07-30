import express, { Request, Response } from 'express';
import { Database } from "./database/database";
import { Sequelize } from "sequelize";
import { splunkLogger } from './middleware/splunkLogger';
import { blockListMiddleware } from './middleware/blockList';
import router from "./routes/routes";
import * as dotenv from 'dotenv';
import * as errorMiddleware from "./middleware/errorHandler"
import  {splunkDashboard}  from "./middleware/splunkQueryLog";
import { 
    scoreInitMiddleware, 
    scoreTrustAnalysisMiddleware, 
    scoreTrustNetworkAnalysisMiddleware, 
    scoreOutsideWorkHours, 
    scoreTrustDosAnalysisMiddleware 
} from './middleware/scoreCheck';
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8000); // Set server port, default to 8000
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

// Allow Express to use x-forwarded-for headers
app.set('trust proxy', true);

// Middleware that logs every request to Splunk
app.use(splunkLogger);

// Block traffic from blacklisted IPs
app.use(blockListMiddleware);

// Score middlewares
app.use(scoreInitMiddleware); // Initialize score for each request
app.use(scoreTrustAnalysisMiddleware); // Modify score based on trust analysis (avg score from IP/subnet/MAC activity)
app.use(scoreTrustNetworkAnalysisMiddleware); // Modify score based on known or unknown networks
app.use(scoreOutsideWorkHours); // Penalize excessive requests outside of working hours
app.use(scoreTrustDosAnalysisMiddleware); // Penalize requests that seems part of DOS attacks

app.use(splunkDashboard); // Splunk dashboards

// Use the routes defined in the routes file
app.use(router);

// Middleware to handle route not found errors (404)
app.all('*', errorMiddleware.routeNotFound);

// Middleware for general error handling
app.use(errorMiddleware.ErrorHandler);

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});