import express, { Request, Response } from 'express';
import { Database } from "./database/database";
import { Sequelize } from "sequelize";
import { splunkLogger } from './middleware/splunkLogger';
import { blockListMiddleware } from './middleware/blockList';
import router from "./routes/routes";
import * as dotenv from 'dotenv';
import * as errorMiddleware from "./middleware/errorHandler"
import  {generalRequestStatusforIP}  from "./middleware/splunkQueryLog";
import { scoreInitMiddleware, scoreTrustAnalysisMiddleware, scoreTrustNetworkAnalysisMiddleware } from './middleware/scoreCheck';
import { scoreOutsideWorkHours } from './middleware/scoreCheck';
import { scoreTrustDosAnalysisMiddleware } from './middleware/scoreCheck';
import { AlertService } from './api/endpoints/AlertService';
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
//Send a request to create an alert in Splunk.
const alertSetting = async() =>{
    const alert = new AlertService();
    try{
        await alert.setAlerts()
    } catch(error){
        console.error('Error creating setting for alerts:', error);
    }

}

// Call the function to connect to the database
connectDB();



// Middleware to parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve per mantenere x-forwarded-for
app.set('trust proxy', true);

// Middleware Splunk logger
app.use(splunkLogger);

// Middleware per bloccare IP
app.use(blockListMiddleware);

// Middleware per modificare lo score
app.use(scoreInitMiddleware); // inizializza a 50 lo score
app.use(scoreTrustAnalysisMiddleware); // abbassa/alza lo score in base all'avg score di ip, della subnet e del mac address delle ultime 100 richieste
app.use(scoreTrustNetworkAnalysisMiddleware); // abbassa/alza lo score in base alla network in cui si fa la richiesta
app.use(scoreOutsideWorkHours); //abbassa lo score in base a un tot di richieste giornaliere fatte fuori orario di lavoro, per un multiplo
app.use(scoreTrustDosAnalysisMiddleware)

app.use(generalRequestStatusforIP);

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

//Call the function to set the alerts
setTimeout(() => {
    console.log('⚙️  Task post-avvio eseguito dopo 20 secondi');
    alertSetting();
}, 180000);
