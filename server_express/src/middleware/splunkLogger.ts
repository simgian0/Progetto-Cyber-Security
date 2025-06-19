import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

const LOG_FILE_PATH = path.join(__dirname, '../logs/server.log');

// Funzione per garantire che la directory esista
const ensureLogDirectoryExists = (filePath: string) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

export const splunkLogger = async (req: Request, res: Response, next: NextFunction) => {
    ensureLogDirectoryExists(LOG_FILE_PATH);
    res.on('finish', () => {
        const logPayload = {
            time: Date.now() / 1000,
            host: 'node-server',
            source: 'express-app',
            event: {
                method: req.method,
                path: req.originalUrl,
                headers: req.headers,
                body: req.body,
                user_id: req.headers['x-user-id'] || null,
                status: res.statusCode // Logga anche lo status della risposta
            }
        };

        try {
            fs.appendFileSync(LOG_FILE_PATH, JSON.stringify(logPayload) + '\n');
            console.log('log inviato');
        } catch (err) {
            console.error('Errore scrittura log Splunk:', err);
        }
    });

    next();
};