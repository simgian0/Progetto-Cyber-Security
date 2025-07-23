import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

const LOG_FILE_PATH = path.join('/app/logs', 'server.log');

// Funzione per garantire che la directory esista
const ensureLogDirectoryExists = (filePath: string) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

export const splunkLogger = async (req: Request, res: Response, next: NextFunction) => {
    ensureLogDirectoryExists(LOG_FILE_PATH);
    const clientIP = req.ip?.startsWith('::ffff:') ? req.ip.replace('::ffff:', '') : req.ip || ''; // trasforma eventuali ipv6 in ipv4

    let responseBody: any = null;

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
        responseBody = body; // salva il contenuto della risposta
        return originalJson(body); // continua normalmente
    };

    res.on('finish', () => {
        const statusFromBody =
            responseBody?.success?.httpStatus ||
            responseBody?.error?.httpStatus ||
            res.statusCode;
        console.log('DEBUG: res.statusCode =', res.statusCode, 'statusFromBody =', statusFromBody, 'responseBody =',responseBody);

       const numericStatus = parseInt(statusFromBody, 10);
    const type = numericStatus >= 400 ? 'error' : 'normal';
        
        const logPayload = {
            time: new Date().toISOString().replace('T', ' ').substring(0, 19),
            method: req.method,
            path: req.originalUrl,
            headers: req.headers,
            body: responseBody,
            user_id: req.headers['x-user-id'] || null,
            status: statusFromBody,
            request_ip: clientIP,
            type: type 
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