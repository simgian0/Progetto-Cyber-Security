import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../api/endpoints/SearchService'

// Import factory
import { errorFactory } from "../factory/FailMessage";
import { ErrorMessage } from "../factory/Messages";
// Instantiate the error message factory
const errorMessageFactory: errorFactory = new errorFactory();
const searchService = new SearchService();

export const scoreCheckMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip?.startsWith('::ffff:') ? req.ip.replace('::ffff:', '') : req.ip || '';

        if (!ip) {
            const message = errorMessageFactory.createMessage(ErrorMessage.missingParameters, 'Missing ip');
            return res.json({ error: message });
        }

        const result = await searchService.searchScore(ip);
        console.log("-------------------------------- result", result);
        // Estrarre il punteggio dal risultato
        const score = result.result?.score;
        console.log("-------------------------------- parsed", score);

        // Controlla se è stato trovato un risultato
        if (result && !isNaN(score)) {
            // Se trovato, estrai lo score dal risultato e passa al middleware successivo
            req.body.score = score; // Passa lo score al body della request per usarlo nei middleware successivi
        } else {
            // Se non trovato, imposta lo score di default
            req.body.score = 50;
            console.log('SCORE default --------------------------- ', req.body.score);
        }
        // Passa al middleware successivo
        next();
    } catch (error) {
        const message = errorMessageFactory.createMessage(ErrorMessage.generalError, 'Error with searching for scores');
        return res.json({ error: message });
    }
};