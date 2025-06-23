import { Request, Response, NextFunction } from 'express';
import blockList from "../config/blocklist.json"; // file json con gli ip bloccati
// Import factory
import { errorFactory } from "../factory/FailMessage";
import { ErrorMessage } from "../factory/Messages";
// Instantiate the error message factory
const errorMessageFactory: errorFactory = new errorFactory();

export const blockListMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip?.startsWith('::ffff:') ? req.ip.replace('::ffff:', '') : req.ip || ''; // trasforma eventuali ipv6 in ipv4
    console.log("req ip: ", clientIP);
    if (!clientIP) {
    const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'IP not Found');
    return res.json({ error: message });
    }

    if (blockList.includes(clientIP)) {
    const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'Blocked IP: IP not Authorized');
    return res.json({ error: message });
    }

    next();
};