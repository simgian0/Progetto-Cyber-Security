import { Sequelize } from "sequelize"

import * as dotenv from 'dotenv';
dotenv.config();

export class Database{
    // Private static instance of Database class for the Singleton pattern
    private static instance: Database;
    // Private Sequelize instance to handle the connection
    private sequelize: Sequelize; 

    // Private constructor to enforce Singleton pattern
    private constructor() {
         // Check if environment variables are set
         if (
            !process.env.POSTGRES_DB ||
            !process.env.POSTGRES_USER ||
            !process.env.POSTGRES_PASSWORD ||
            !process.env.POSTGRES_HOST ||
            !process.env.POSTGRES_PORT
        ) {
            throw new Error("Environment variables are not set");
        }

        // Configure Sequelize using environment variables
        this.sequelize = new Sequelize(
            process.env.POSTGRES_DB,
            process.env.POSTGRES_USER,
            process.env.POSTGRES_PASSWORD,
            {
                host: process.env.POSTGRES_HOST,
                port: Number(process.env.POSTGRES_PORT),
                dialect: 'postgres',
            }
        );
    }
    
    // Public static method to get the Sequelize instance
    public static getSequelize(): Sequelize {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance.sequelize;
    }
}