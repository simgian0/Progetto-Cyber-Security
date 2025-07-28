import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../api/endpoints/SearchService'
import { calculateScore } from '../utility/scoreCalc';

// Import factory
import { errorFactory } from "../factory/FailMessage";
import { ErrorMessage } from "../factory/Messages";
// Instantiate the error message factory
const errorMessageFactory: errorFactory = new errorFactory();
const searchService = new SearchService();

/*export const scoreCheckMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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
};*/

// Applica penalità o bonus sullo score in base agli avg score di ip, subnet e MAC
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
        return next();
    }

    try {
        const subnetRes = await searchService.getAvgScoreBySubnet(subnet);
        const macRes = await searchService.getAvgScoreByMac(mac);
        const ipRes = await searchService.getAvgScoreByIp(clientIP);
        
        const subnetScore = Number(subnetRes.result?.avg_score);
        const macScore = Number(macRes.result?.avg_score);
        const ipScore = Number(ipRes.result?.avg_score);
        
        // Penalità e premio sullo score
        if (req.body && typeof req.body.score === 'number') {
            let penalty = 0;
            let bonus = 0;
            if (!isNaN(macScore)) {
                if (macScore <= 20) {
                    penalty += 10;
                    console.log(`[TRUST] MAC penalty -10 (macScore: ${macScore})`);
                } else if (macScore <= 50) {
                    penalty += 5;
                    console.log(`[TRUST] MAC penalty -5 (macScore: ${macScore})`);
                } else if (macScore >= 70) {
                    bonus += 10;
                    console.log(`[TRUST] MAC bonus +10 (macScore: ${macScore})`);
                }
            }

            // subnetScore pesa un po di meno in quanto rappresenta un intera subnet
            if (!isNaN(subnetScore)) {
                if (subnetScore <= 20) {
                    penalty += 5;
                    console.log(`[TRUST] Subnet penalty -10 (subnetScore: ${subnetScore})`);
                } else if (subnetScore <= 50) {
                    penalty += 2;
                    console.log(`[TRUST] Subnet penalty -5 (subnetScore: ${subnetScore})`);
                } else if (subnetScore >= 70) {
                    bonus += 5;
                    console.log(`[TRUST] Subnet bonus +10 (subnetScore: ${subnetScore})`);
                }
            }

            if (!isNaN(ipScore)) {
                if (ipScore <= 20) {
                    penalty += 10;
                    console.log(`[TRUST] IP penalty -10 (ipScore: ${ipScore})`);
                } else if (ipScore <= 50) {
                    penalty += 5;
                    console.log(`[TRUST] IP penalty -5 (ipScore: ${ipScore})`);
                } else if (ipScore >= 70) {
                    bonus += 10;
                    console.log(`[TRUST] IP bonus +10 (ipScore: ${ipScore})`);
                }
            }

            if (penalty > 0) {
                req.body.score = calculateScore(req.body.score, "subtract", penalty);
                console.log(`[TRUST] Total trust penalty applied: -${penalty}, New score: ${req.body.score}`);
            }

            if (bonus > 0) {
                req.body.score = calculateScore(req.body.score, "add", bonus);
                console.log(`[TRUST] Total trust bonus applied: +${bonus}, New score: ${req.body.score}`);
            }
        }

        console.log(`[TRUST] Final score: ${req.body.score} | MAC avg: ${macScore}, Subnet avg: ${subnetScore}`);

        return next();
    } catch (err: any) {
        console.error('Trust analysis error:',  err.response?.data || err.message);
        return next();
    }
}

export const scoreInitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    req.body.score = 50;
    next();
};

// Applica penalità o bonus sullo score in base al tipo di network
export const scoreTrustNetworkAnalysisMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIP = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.ip?.startsWith('::ffff:')
            ? req.ip.replace('::ffff:', '')
            : req.ip || '';
    
    if (!clientIP || typeof req.body.score !== 'number') {
        return next();
    }
    
    const ipParts: number[] = clientIP.split('.').map((part: string) => parseInt(part, 10));
    let bonus = 0;
    let penalty = 0;

    if (ipParts[0] === 172 && ipParts[1] === 19) {
        bonus += 10;
        console.log(`[TRUST][NETWORK] Ethernet bonus +10 applied for IP ${clientIP}`);
    } else if (ipParts[0] === 172 && ipParts[1] === 20) {
        penalty += 5;
        console.log(`[TRUST][NETWORK] WiFi penalty -5 applied for IP ${clientIP}`);
    } else {
        penalty += 10;
        console.log(`[TRUST][NETWORK] External network penalty -10 applied for IP ${clientIP}`);
    }

    if (penalty > 0) {
        req.body.score = calculateScore(req.body.score, 'subtract', penalty);
        console.log(`[TRUST][NETWORK] Penalty -${penalty} applied. New score: ${req.body.score}`);
    }

    if (bonus > 0) {
        req.body.score = calculateScore(req.body.score, 'add', bonus);
        console.log(`[TRUST][NETWORK] Bonus +${bonus} applied. New score: ${req.body.score}`);
    }

    return next();
}

export const scoreOutsideWorkHours = async (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIP = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.ip?.startsWith('::ffff:')
            ? req.ip.replace('::ffff:', '')
            : req.ip || '';
    
    if (!clientIP || typeof req.body.score !== 'number') {
        return next();
    }

    console.log("\n-----INIZIO------ Dentro scoreQuery->scoreOutsideWorkHours IP: ", clientIP);

    try {

        // 1. Ritorna il numero di richiesta fatte fuori da orario lavorativo (8:00 - 20:00)
        const result = await searchService.searchOutsideWorkHours(clientIP);
        console.log('\nSPLUNK QUERY: Splunk query results scoreOutsideWorkHours:', result,"\n")

         // 2. Calculate stats
        const total_off_hours = result.result?.count; // numero di richieste effettuate fuori da fascia oraria lavorativa
        console.log('\nSPLUNK QUERY: Splunk query results scoreOutsideWorkHours total_off_hours :',total_off_hours,"\n")

        const penalty = Math.min( Math.floor(total_off_hours /10) * 0.5 , 10 ) // per ogni 10 richieste fuori orario abbassa lo score di 0.5, lo score si può abbassare di un massimo di 10
        req.body.score = calculateScore(req.body.score, 'subtract', penalty);
        console.log(`[TRUST][OUTSIDE WORK HOURS] Penalty -${penalty} applied. New score: ${req.body.score}`);

        console.log("\n-----FINE------ Dentro scoreQuery->scoreOutsideWorkHours IP: ", clientIP);
    
    } catch (error:any) {
        console.error(`Splunk middleware error with obtain score from query: ${error.code || "unknown"} | ${error.message || error.response?.data}`);
        if (error.response) {
         console.error(`Status: ${error.response.status}`);
        }
        const message = errorMessageFactory.createMessage(ErrorMessage.generalError, 'Error with calculating score form query');
        return res.json({ error: message });
    }
}