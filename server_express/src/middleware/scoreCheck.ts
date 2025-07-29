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

//Middleware che abbassa lo score in base alle richieste effettuate fuori dall'orario di lavoro
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
        const total_off_hours = Number(result.result?.count); // numero di richieste effettuate fuori da fascia oraria lavorativa
        console.log('\nSPLUNK QUERY: Splunk query results scoreOutsideWorkHours total_off_hours :',total_off_hours,"\n")

        if(!isNaN(total_off_hours) && total_off_hours > 0){
        
        const penalty = Math.min( Math.floor(total_off_hours /10) * 0.5 , 10 ) // per ogni 10 richieste fuori orario abbassa lo score di 0.5, lo score si può abbassare di un massimo di 10
        req.body.score = calculateScore(req.body.score, 'subtract', penalty);
        console.log(`[TRUST][OUTSIDE WORK HOURS] Penalty -${penalty} applied. New score: ${req.body.score}`);
        }

        console.log("\n-----FINE------ Dentro scoreQuery->scoreOutsideWorkHours IP: ", clientIP);

        return next();
    
    } catch (error:any) {
        console.error(`Splunk middleware error with calculate score from outside working hours: ${error.code || "unknown"} | ${error.message || error.response?.data}`);
        if (error.response) {
         console.error(`Status: ${error.response.status}`);
        }
        return next();
    }

}

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

        // 1. Ritorna il tempo medio complessivo tra una richiesta e la sua successiva
        const result = await searchService.searchDosAttackbyAvgBetweenRequest(clientIP);
        console.log('\nSPLUNK QUERY: Splunk query results search.Dos.Attack.by.Avg.Between.Request:', result,"\n")

         // 2. Calculate stats and update score
        const avg_time_between_attempts = Number(result.result?.avg_time_between_attempts); 
        console.log('\nSPLUNK QUERY: Splunk query results scoreTrustDosAnalysisMiddleware total_off_hours :',avg_time_between_attempts,"\n")

        if (!isNaN(avg_time_between_attempts) && avg_time_between_attempts < 10) {// se il tempo medio complessivo tra richieste è minore di 10 secondi allora Attacco Dos e abbasso di 5
        const penalty: number = 5;
        req.body.score = calculateScore(req.body.score, 'subtract', penalty);
        console.log(`[TRUST][DOS AVG TIME] Penalty -${penalty} applied. New score: ${req.body.score}`);
        }

        //1. Ritorna una riga con il ratio tra richieste 403 e il totale(25), se maggiore del 75% score si abbassa di 10, se maggiore 50% del 5, zero altrimenti
        const result1 = await searchService.searchDosAttackbyNumberOfNearBadRequest(clientIP);
        console.log('\nSPLUNK QUERY: Splunk query results search.Dos.Attack.by.Number.Of.Near.Bad.Request:', result1,"\n")

        
        const score_penalty = Number(result1.result?.score_penalty);
        const forbidden_ratio = Number(result1.result?.forbidden_ratio); 
        console.log('\nSPLUNK QUERY: Splunk query results scoreTrustDosAnalysisMiddleware score penality :',score_penalty, "and forbidden ratio: ", forbidden_ratio,"\n");

        if(!isNaN(forbidden_ratio)){
        if(forbidden_ratio >= 50){//Apply penalty if ratio >50 = -5 and if >75 = -10

        req.body.score = calculateScore(req.body.score, 'subtract', score_penalty);
        console.log(`[TRUST][DOS N° BAD REQUEST] Penalty -${score_penalty} applied. New score: ${req.body.score}`);
        }
        
        if(forbidden_ratio < 25){ //Aplly reward +10 if ratio <25 and +5 in ratio <50
            req.body.score = calculateScore(req.body.score, 'add', 10);
            console.log(`[TRUST][DOS N° BAD REQUEST] Reward +10 applied. New score: ${req.body.score}`);

        }else{
            req.body.score = calculateScore(req.body.score, 'add', 5);
            console.log(`[TRUST][DOS N° BAD REQUEST] Reward +5 applied. New score: ${req.body.score}`);

        }}


        console.log("\n-----FINE------ Dentro scoreQuery->scoreOutsideWorkHours IP: ", clientIP);
        return next();
    
    } catch (error:any) {
        console.error(`Splunk middleware error with calculate score Dos: ${error.code || "unknown"} | ${error.message || error.response?.data}`);
        if (error.response) {
         console.error(`Status: ${error.response.status}`);
        }
        return next();
    }

}