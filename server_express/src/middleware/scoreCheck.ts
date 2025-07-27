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
        const recovered_score = result.result?.recovered_score;
        const minutes_since = result.result?.minutes_since;
        console.log('SCORE RAW ---------------------------', score);
        console.log('RECOVERED SCORE ---------------------', recovered_score);
        console.log('MINUTES SINCE -----------------------', minutes_since);
        // Controlla se è stato trovato un risultato
        if (result && !isNaN(score)) {
            // Se trovato, controlla se è possibile recuperare del punteggio altrimenti estrai lo score dal risultato e passa al middleware successivo
            if (!isNaN(minutes_since) && minutes_since >= 60 && !isNaN(recovered_score)) {
                req.body.score = recovered_score;
                console.log('Using recovered score:', recovered_score);
            } else {
                req.body.score = score;
                console.log('Using original score:', score);
            }
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

export const scoreTrustAnalysisMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIP = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.ip?.startsWith('::ffff:')
            ? req.ip.replace('::ffff:', '')
            : req.ip || '';

    // Recupera MAC da header
    const mac = req.headers['x-mac-address'] as string | undefined;

    // Calcola subnet da IP
    const subnet = clientIP.split('.').slice(0, 2).join('.');

    if (!subnet || !mac) {
        req.body.scoreMultiplier = 1.0;
        return next();
    }

    try {
        const subnetRes = await searchService.getAvgScoreBySubnet(subnet);
        const macRes = await searchService.getAvgScoreByMac(mac);
        //console.log("-------------------------------- result", subnetRes);
        //console.log("-------------------------------- result", macRes);
        const subnetScore = Number(subnetRes.result?.avg_score);
        const macScore = Number(macRes.result?.avg_score);
        // Blocco se troppo bassi
        if ((!isNaN(subnetScore) && subnetScore < 20) || (!isNaN(macScore) && macScore < 20)) {
            const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized,`Blocked request: trust score too low (subnetScore: ${subnetScore}, macScore: ${macScore})`);
            return res.json({ error: message });
        }

        const macMultiplier = isNaN(macScore) ? 1.0 : macScore < 50 ? 0.6 : 1.0;
        const subnetMultiplier = isNaN(subnetScore) ? 1.0 : subnetScore < 50 ? 0.6 : 1.0;
        const multiplier = (macMultiplier + subnetMultiplier) / 2;

        req.body.scoreMultiplier = multiplier;

        console.log(`[TRUST] clientIP: ${clientIP}, subnet: ${subnet}, mac: ${mac}`);
        console.log(`[TRUST] MAC avg: ${macScore}, Subnet avg: ${subnetScore}, Multiplier: ${multiplier}`);

        return next();
    } catch (err) {
        console.error('Trust analysis error:', err);
        req.body.scoreMultiplier = 1.0;
        return next();
    }
}
