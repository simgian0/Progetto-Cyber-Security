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

/**
 * Middleware that adjusts score based on the average trust score
 * associated with the client IP, subnet, and MAC address.
 */
export const scoreTrustAnalysisMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIP = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.ip?.startsWith('::ffff:')
            ? req.ip.replace('::ffff:', '')
            : req.ip || '';

    // MAC from header
    const mac = req.headers['x-mac-address'] as string | undefined;

    // calc subnet from IP
    const subnet = clientIP.split('.').slice(0, 2).join('.');

    if (!subnet || !mac) {
        return next();
    }

    try {
        // Query Splunk for average scores
        const subnetRes = await searchService.getAvgScoreBySubnet(subnet);
        const macRes = await searchService.getAvgScoreByMac(mac);
        const ipRes = await searchService.getAvgScoreByIp(clientIP);

        const subnetScore = Number(subnetRes.result?.avg_score);
        const macScore = Number(macRes.result?.avg_score);
        const ipScore = Number(ipRes.result?.avg_score);

        // Penalty and bonus application
        if (req.body && typeof req.body.score === 'number') {
            let penalty = 0;
            let bonus = 0;

            // MAC score logic
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

            // Subnet score logic (less weight)
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

            // IP score logic
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
        console.error('Trust analysis error:', err.response?.data || err.message);
        return next();
    }
}

/**
 * Middleware that initializes the trust score to a default value (50).
 */
export const scoreInitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    req.body.score = 50;
    next();
};

/**
 * Adjusts score based on the client's network:
 * - +10 for Ethernet (172.19.x.x)
 * - -5 for WiFi (172.20.x.x)
 * - -10 for all other networks
 */
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

/**
 * Applies penalties if the client made a significant number of requests
 * outside standard working hours (08:00–20:00).
 * Every 10 off-hour requests = -0.5 score, max -10.
 */
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
        const result = await searchService.searchOutsideWorkHours(clientIP);
        console.log('\nSPLUNK QUERY: Splunk query results scoreOutsideWorkHours:', result, "\n")

        const total_off_hours = Number(result.result?.count); // number of off-hour requests
        console.log('\nSPLUNK QUERY: Splunk query results scoreOutsideWorkHours total_off_hours :', total_off_hours, "\n")

        if (!isNaN(total_off_hours) && total_off_hours > 0) {

            const penalty = Math.min(Math.floor(total_off_hours / 10) * 0.5, 10) // every 10 off-hour requests penalty of 0.5, penalty can be a max of 10.
            req.body.score = calculateScore(req.body.score, 'subtract', penalty);
            console.log(`[TRUST][OUTSIDE WORK HOURS] Penalty -${penalty} applied. New score: ${req.body.score}`);
        }

        console.log("\n-----FINE------ Dentro scoreQuery->scoreOutsideWorkHours IP: ", clientIP);

        return next();

    } catch (error: any) {
        console.error(`Splunk middleware error with calculate score from outside working hours: ${error.code || "unknown"} | ${error.message || error.response?.data}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
        }
        return next();
    }

}

/**
 * Evaluates signs of potential DoS behavior:
 * 1. Low average time between requests → penalty
 * 2. High ratio of recent 403s → penalty
 * 3. Low ratio of 403s → bonus
 */
export const scoreTrustDosAnalysisMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIP = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.ip?.startsWith('::ffff:')
            ? req.ip.replace('::ffff:', '')
            : req.ip || '';

    if (!clientIP || typeof req.body.score !== 'number') {
        return next();
    }

    console.log("\n-----INIZIO------ Dentro scoreQuery->scoreTrustDosAnalysisMiddleware IP: ", clientIP);

    try {

        // --- First analysis: request frequency ---
        const result = await searchService.searchDosAttackbyAvgBetweenRequest(clientIP);
        console.log('\nSPLUNK QUERY: Splunk query results search.Dos.Attack.by.Avg.Between.Request:', result, "\n")

        // Calculate stats and update score
        const avg_time_between_attempts = Number(result.result?.avg_time_between_attempts);
        console.log('\nSPLUNK QUERY: Splunk query results scoreTrustDosAnalysisMiddleware total_off_hours :', avg_time_between_attempts, "\n")

        if (!isNaN(avg_time_between_attempts) && avg_time_between_attempts < 10) { // if avg time between requests < 10 then Dos attack (-5)
            const penalty: number = 5;
            req.body.score = calculateScore(req.body.score, 'subtract', penalty);
            console.log(`[TRUST][DOS AVG TIME] Penalty -${penalty} applied. New score: ${req.body.score}`);
        }

        // --- Second analysis: 403 ratio in recent traffic ---
        //    Returns ratio between HTTP 403 responses and the last 25 requests.
        //    If the ratio is greater than 75%, apply a -10 penalty to the score.
        //    If the ratio is greater than 50%, apply a -5 penalty.
        //    Otherwise, no penalty is applied.
        const result1 = await searchService.searchDosAttackbyNumberOfNearBadRequest(clientIP);
        console.log('\nSPLUNK QUERY: Splunk query results search.Dos.Attack.by.Number.Of.Near.Bad.Request:', result1, "\n")


        const score_penalty = Number(result1.result?.score_penalty);
        const forbidden_ratio = Number(result1.result?.forbidden_ratio);
        console.log('\nSPLUNK QUERY: Splunk query results scoreTrustDosAnalysisMiddleware score penality :', score_penalty, "and forbidden ratio: ", forbidden_ratio, "\n");

        if (!isNaN(forbidden_ratio)) {
            if (forbidden_ratio >= 50) { //Apply penalty if ratio >50 = -5 and if >75 = -10

                req.body.score = calculateScore(req.body.score, 'subtract', score_penalty);
                console.log(`[TRUST][DOS N° BAD REQUEST] Penalty -${score_penalty} applied. New score: ${req.body.score}`);
            }

            if (forbidden_ratio < 25) { //Aplly reward +10 if ratio <25 and +5 in ratio <50
                req.body.score = calculateScore(req.body.score, 'add', 10);
                console.log(`[TRUST][DOS N° BAD REQUEST] Reward +10 applied. New score: ${req.body.score}`);

            } else {
                req.body.score = calculateScore(req.body.score, 'add', 5);
                console.log(`[TRUST][DOS N° BAD REQUEST] Reward +5 applied. New score: ${req.body.score}`);

            }
        }


        console.log("\n-----FINE------ Dentro scoreQuery->scoreOutsideWorkHours IP: ", clientIP);
        return next();

    } catch (error: any) {
        console.error(`Splunk middleware error with calculate score Dos: ${error.code || "unknown"} | ${error.message || error.response?.data}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
        }
        return next();
    }

}