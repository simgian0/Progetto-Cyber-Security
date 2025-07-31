import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Drawing from '../models/Drawing';
import { calculateScore } from '../utility/scoreCalc';
// Import factory
import { errorFactory } from "../factory/FailMessage";
import { ErrorMessage } from "../factory/Messages";
// Instantiate the error message factory
const errorMessageFactory: errorFactory = new errorFactory();

export class requestFormatCheck {
    /**
     * Middleware that validates the format and presence of request body parameters.
     * Applies a small score penalty for each format violation.
     */
    validateRequest = async (req: Request, res: Response, next: NextFunction) => {
        const { name, owner_id, target_team } = req.body

        // All methods except GET and DELETE must include a body
        if (req.method !== "GET" && req.method !== "DELETE") {
            if (!req.body) {
                req.body.score = calculateScore(req.body.score, 'subtract', 1);
                return next(errorMessageFactory.createMessage(ErrorMessage.missingParameters, "Payload can't be empty"));
            }

            // Validate 'name': must be a non-empty string and not exceed 255 characters
            if (!name || !this.isStringValid(name) || name.length > 255) {
                req.body.score = calculateScore(req.body.score, 'subtract', 1);
                return next(errorMessageFactory.createMessage(ErrorMessage.invalidFormat, "Drawing name not valid."));
            }

            //console.log("------- risultato validate: ", req.method, " - - - ", owner_id, " - - - ", target_team);

            // POST-specific validation
            if (req.method === "POST") {
                // Validate 'owner_id': must be present and a valid number
                if (!owner_id || isNaN(Number(owner_id))) {
                    req.body.score = calculateScore(req.body.score, 'subtract', 1);
                    return next(errorMessageFactory.createMessage(ErrorMessage.invalidFormat, "Owner ID Not Valid"));

                }

                // Validate 'target_team': must be a non-empty string, not too long
                if (!target_team || !this.isStringValid(target_team) || target_team.length > 50) {
                    req.body.score = calculateScore(req.body.score, 'subtract', 1);
                    return next(errorMessageFactory.createMessage(ErrorMessage.invalidFormat, "Drawing target team Not Valid"));

                }
            }
        }
        next();
    }

    // Helper function to check if a value is a valid string
    isStringValid(value: any): boolean {
        const isValid = typeof value === 'string' && value.trim().length > 0;
        console.log(`isStringValid("${value}") -> ${isValid}`);
        return isValid;
    }
}
export default new requestFormatCheck();