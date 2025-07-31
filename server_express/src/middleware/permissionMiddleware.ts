import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Drawing from '../models/Drawing';
import { calculateScore } from '../utility/scoreCalc';
// Import factory
import { errorFactory } from "../factory/FailMessage";
import { ErrorMessage } from "../factory/Messages";
// Instantiate the error message factory
const errorMessageFactory: errorFactory = new errorFactory();

class permissionMiddleware{
    /**
     * Middleware that checks if the user has one of the required roles.
     * - Retrieves user data from the database using the 'x-user-id' header.
     * - If role is valid, increases the request score.
     * - If not, blocks the request and decreases the score.
     */
    checkRole = (requiredRoles: string[]) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.headers['x-user-id'];  
            const userIdAsNumber = Number(userId);
            
            if (isNaN(userIdAsNumber)) {
                const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'User not authenticated');
                return res.json({ error: message });
            }

            try {
                const user = await User.findByPk(userIdAsNumber); 

                if (!user) {
                    const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'User not found');
                    return res.json({ error: message });
                }
                
                req.body.user_name = user.name;
                req.body.role = user.role;
                req.body.team = user.team;

                // Verify user role
                if (requiredRoles.includes(user.role)) {
                    req.body.score = calculateScore(req.body.score, 'add', 10);
                    console.log(`[TRUST][PERMISSION] Bonus checkRole +10 applied. New score: ${req.body.score}`);
                    
                    return next();  // OK
                } else {
                    // If the role is not in requiredRoles, error and penalty
                    req.body.score = calculateScore(req.body.score, 'subtract', 10);
                    console.log(`[TRUST][PERMISSION] Penalty checkRole -10 applied. New score: ${req.body.score}`);
                    const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'Forbidden: You do not have permission to perform this action');
                    return res.json({ error: message });
                }
            } catch (error) {
                const message = errorMessageFactory.createMessage(ErrorMessage.generalError, 'Internal server error');
                return res.json({ error: message });
            }
        };
    }

    /**
     * Middleware that allows access if:
     * - the user is the owner of the drawing
     * - OR the user is in the same team as the drawing
     * Otherwise, it blocks the request and decreases the score.
     */
    async checkTeam(req: Request, res: Response, next: NextFunction) {
        const userId = req.headers['x-user-id'];
        const userIdAsNumber = Number(userId);
            
        if (isNaN(userIdAsNumber)) {
            const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'User not authenticated');
            return res.json({ error: message });
        }

        try {
            const user = await User.findByPk(userIdAsNumber); 

            if (!user) {
                const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'User not found');
                return res.json({ error: message });
            }
            
            const drawingId = req.params.id; //id from parameters
            
            if (isNaN(Number(drawingId))) {
                const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'Invalid drawing ID');
                return res.json({ error: message });
            }

            // Drawing from database
            const drawing = await Drawing.findByPk(drawingId);

            if (!drawing) {
                req.body.score = calculateScore(req.body.score, 'subtract', 5);
                console.log(`[TRUST][PERMISSION] Penalty checkTeam -5 applied. New score: ${req.body.score}`);
                const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'Drawing not found');
                return res.json({ error: message });
            }

            // Allow if user is the owner or in the same team as the drawing
            if (user.id !== drawing.owner_id && user.team !== drawing.target_team) {
                req.body.score = calculateScore(req.body.score, 'subtract', 10);
                console.log(`[TRUST][PERMISSION] Penalty checkTeam -10 applied. New score: ${req.body.score}`);
                const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'Forbidden: You are not in the same team as the drawing owner');
                return res.json({ error: message });
            }
            
            req.body.score = calculateScore(req.body.score, 'add', 10);
            console.log(`[TRUST][PERMISSION] Bonus checkTeam +10 applied. New score: ${req.body.score}`);
            next();
        } catch (error) {
            const message = errorMessageFactory.createMessage(ErrorMessage.generalError, 'Internal server error');
            return res.json({ error: message });
        }
    }

    /**
     * Middleware that prevents users with role "impiegato" from creating drawings for teams other than their own.
     * - If the user's role is "impiegato" and target_team is different, block the request and penalize score.
     * - Otherwise, apply a score bonus and allow.
     */
    checkTargetTeam = async (req: Request, res: Response, next: NextFunction) => {
        const userId = Number(req.headers['x-user-id']);
        if (isNaN(userId)) {
            const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'User not authenticated');
            return res.json({ error: message });
        }

        try {
            const user = await User.findByPk(userId);

            if (!user) {
                const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'User not found');
                return res.json({ error: message });
            }

            const { target_team } = req.body;

            if (!target_team) {
                const message = errorMessageFactory.createMessage(ErrorMessage.invalidFormat, 'target_team attribute not specified');
                return res.json({ error: message });
            }

            // If the user's role is "impiegato" and target_team is different, block the request and penalize score
            if (user.role === 'impiegato' && user.team !== target_team) {
                req.body.score = calculateScore(req.body.score, 'subtract', 10);
                console.log(`[TRUST][PERMISSION] Penalty checkTargetTeam -10 applied. New score: ${req.body.score}`);
                const message = errorMessageFactory.createMessage(
                    ErrorMessage.notAuthorized,
                    `Users with role "Impiegato" are not allowed to create drawings for a team other than their own.`
                );
                return res.json({ error: message });
            }

            req.body.score = calculateScore(req.body.score, 'add', 10);
            console.log(`[TRUST][PERMISSION] Bonus checkTargetTeam +10 applied. New score: ${req.body.score}`);
            return next();
        } catch (error) {
            const message = errorMessageFactory.createMessage(ErrorMessage.generalError, 'Internal server error');
            return res.json({ error: message });
        }
    }

}

export default new permissionMiddleware();