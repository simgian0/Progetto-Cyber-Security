import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

const LOG_FILE_PATH = path.join('/app/logs', 'server.log');
const SCORE_LOG_FILE_PATH = path.join('/app/logs', 'score.log');

// Funzione per garantire che la directory esista
const ensureLogDirectoryExists = (filePath: string) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// estrae subnet
const extractSubnet = (ip: string): string => {
    const parts = ip.split('.');
    return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : 'unknown';
};

export const splunkLogger = async (req: Request, res: Response, next: NextFunction) => {
    ensureLogDirectoryExists(LOG_FILE_PATH);
    ensureLogDirectoryExists(SCORE_LOG_FILE_PATH);

    const forwarded = req.headers['x-forwarded-for'];
    const clientIP = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip?.startsWith('::ffff:') ? req.ip.replace('::ffff:', '') : req.ip || '';
    const macAddress = typeof req.headers['x-mac-address'] === 'string' ? req.headers['x-mac-address'] : null;
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
        //console.log('DEBUG: res.statusCode =', res.statusCode, 'statusFromBody =', statusFromBody, 'responseBody =',responseBody);

        const numericStatus = parseInt(statusFromBody, 10);
        const type = numericStatus >= 400 ? 'error' : 'normal';
        // payload per server.log
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

        // Payload per score.log
        const score = req.body.score;
        if (typeof score === 'number' && !isNaN(score)){
            const subnet = extractSubnet(clientIP);
            const scoreLogPayload = {
                time: new Date().toISOString().replace('T', ' ').substring(0, 19),
                score: score,
                request_ip: clientIP,
                subnet: subnet, // calcolo uno score del subnet con una media degli score dei subnet
                mac_address: macAddress // calcolo uno score del mac con una media degli score dei mac
            };
            try {
                fs.appendFileSync(SCORE_LOG_FILE_PATH, JSON.stringify(scoreLogPayload) + '\n');
                console.log('log score inviato');
            } catch (err) {
                console.error('Errore scrittura score.log:', err);
            }
        }

        try {
            fs.appendFileSync(LOG_FILE_PATH, JSON.stringify(logPayload) + '\n');
            console.log('log inviato');
            console.log('SCORE FINALE --------------------------- ', clientIP, ': ', req.body.score);
        } catch (err) {
            console.error('Errore scrittura log Splunk:', err);
        }
    });

    next();
};