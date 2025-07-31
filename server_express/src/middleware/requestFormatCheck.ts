import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Drawing from '../models/Drawing';
import { calculateScore } from '../utility/scoreCalc';
// Import factory
import { errorFactory } from "../factory/FailMessage";
import { ErrorMessage } from "../factory/Messages";
// Instantiate the error message factory
const errorMessageFactory: errorFactory = new errorFactory();

export class requestFormatCheck{

    validateRequest = async (req: Request, res: Response, next: NextFunction) =>{
        const {name, owner_id, target_team} = req.body
        
        //Tutte le richieste diverse da GET e DELETE devono possedere un body
        if(req.method !== "GET" && req.method !== "DELETE"){
            if(!req.body){
            req.body.score = calculateScore(req.body.score, 'subtract', 1);
            return next(errorMessageFactory.createMessage(ErrorMessage.missingParameters, "Payload can't be empty"));
            }

            if(!name || !this.isStringValid(name) || name.length > 255){
                req.body.score = calculateScore(req.body.score, 'subtract', 1);
                return next(errorMessageFactory.createMessage(ErrorMessage.invalidFormat, "Drawing name not valid."));
            }

            if(req.method === "POST"){

                if(!owner_id || isNaN(Number(owner_id))){
                    req.body.score = calculateScore(req.body.score, 'subtract', 1);
                    return next(errorMessageFactory.createMessage(ErrorMessage.invalidFormat, "Owner ID Not Valid"));

                 }

                if(!target_team || !this.isStringValid(target_team) || target_team.length > 50){
                    req.body.score = calculateScore(req.body.score, 'subtract', 1);
                    return next(errorMessageFactory.createMessage(ErrorMessage.invalidFormat, "Drawing target team Not Valid"));

                }
            }
        }
        next();

    }

    // Helper function to check if a value is a valid string
    isStringValid(value: any): boolean {
    return typeof value === 'string' && value.trim().length > 0;
    }
}
export default new requestFormatCheck();