import { Request, Response, NextFunction } from 'express';
import blockList from "../config/blocklist.json"; // file json con gli ip bloccati
// Import factory
import { errorFactory } from "../factory/FailMessage";
import { ErrorMessage } from "../factory/Messages";
// Instantiate the error message factory
const errorMessageFactory: errorFactory = new errorFactory();

/**
 * Middleware that checks if the client's IP address is in a blocklist.
 * - Extracts the IP from 'x-forwarded-for' or request metadata.
 * - If the IP is missing or blocked, responds with an unauthorized error.
 * - Otherwise, allows the request to proceed.
 */
export const blockListMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIP = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip?.startsWith('::ffff:') ? req.ip.replace('::ffff:', '') : req.ip || '';
    console.log("req ip: ", clientIP);
    if (!clientIP) {
    const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'IP not Found');
    return res.json({ error: message });
    }
    
    // If IP is in the blocklist, reject the request
    if (blockList.includes(clientIP)) {
    const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'Blocked IP: IP not Authorized');
    return res.json({ error: message });
    }

    next();
};