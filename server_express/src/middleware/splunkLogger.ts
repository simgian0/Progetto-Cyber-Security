import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

const SPLUNK_HEC_URL = 'http://splunk:8088/services/collector'; // nome host nel compose TO DO: cambiare per utilizzare fluentbit
const SPLUNK_HEC_TOKEN = '18750b35-4911-4f0b-8ddb-52e5ea075a26'; // token

export const splunkLogger = async (req: Request, res: Response, next: NextFunction) => {
    const logPayload = {
        time: Date.now() / 1000,
        host: 'node-server',
        source: 'express-app',
        event: {
            method: req.method,
            path: req.originalUrl,
            headers: req.headers,
            body: req.body,
            user_id: req.headers['x-user-id'] || null
        }
    };

    // salvare log localmente

    // inviare a splunk tramite fluentbit (auto)

    try {
    await axios.post(SPLUNK_HEC_URL, {
        event: JSON.stringify(logPayload.event), // Invia solo la parte 'event' del log
        sourcetype: "_json" // log in formato JSON
    }, {
        headers: {
            'Authorization': `Splunk ${SPLUNK_HEC_TOKEN}`, // Token di autorizzazione per HEC
            'Content-Type': 'application/json' // Tipo di contenuto JSON
        }
    });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('[Splunk HEC] Logging failed:', error.message);
        } else {
            console.error('[Splunk HEC] Logging failed: Unknown error');
        }
    }

    next();
};