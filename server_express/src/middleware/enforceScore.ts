import { Request, Response, NextFunction } from 'express';
import { errorFactory } from '../factory/FailMessage';
import { ErrorMessage } from '../factory/Messages';

const errorMessageFactory = new errorFactory();

/**
 * Middleware that blocks requests with a score lower than 20.
 * Even if the request is otherwise valid, it is denied if the score is too low.
 */
export const enforceScoreMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const score = req.body.score;
    if (typeof score === 'number' && !isNaN(score)) {
        if (score < 20) {
            const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized,`Blocked: score too low (${score} < 20)`);
            console.warn(`[ENFORCEMENT] Richiesta bloccata: score ${score} < 20`);
            return res.json({ error: message });
        }
    }

    next();
};
