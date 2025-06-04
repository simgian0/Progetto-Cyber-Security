import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Drawing from '../models/Drawing';
// //Import factory
import { errorFactory } from "../factory/FailMessage";
import { ErrorMessage } from "../factory/Messages";
// Instantiate the error message factory
const errorMessageFactory: errorFactory = new errorFactory();

class permissionMiddleware{
    // Middleware per la gestione dei permessi in base al ruolo
    checkRole = (requiredRoles: string[]) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            const userId = req.headers['x-user-id'];  // Ottieni l'ID dell'utente dal header
            const userIdAsNumber = Number(userId); // lo trasformo in number
            
            if (isNaN(userIdAsNumber)) {
                const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'User not authenticated');
                return res.json({ error: message });
            }

            try {
                // Recupera l'utente dal database
                const user = await User.findByPk(userIdAsNumber); 

                // Se l'utente non esiste, restituisci un errore
                if (!user) {
                    const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'User not found');
                    return res.json({ error: message });
                }

                // Verifica se il ruolo dell'utente corrisponde a uno dei ruoli richiesti
                if (requiredRoles.includes(user.role)) {
                    return next();  // Ruolo valido, continua l'elaborazione
                } else {
                    // Se l'utente non ha il permesso, restituisci un errore
                    const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'Forbidden: You do not have permission to perform this action');
                    return res.json({ error: message });
                }
            } catch (error) {
                // In caso di errore nel processo, restituisci un errore generico
                const message = errorMessageFactory.createMessage(ErrorMessage.generalError, 'Internal server error');
                return res.json({ error: message });
            }
        };
    }

    // Se l'utente fa parte dello stesso team della risorsa o se ne è il proprietario fa passare
    async checkTeam(req: Request, res: Response, next: NextFunction) {
        const userId = req.headers['x-user-id'];  // Ottieni l'ID dell'utente dal header
        const userIdAsNumber = Number(userId); // lo trasformo in number
            
        if (isNaN(userIdAsNumber)) {
            const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'User not authenticated');
            return res.json({ error: message });
        }

        try {
            // Recupera l'utente dal database
            const user = await User.findByPk(userIdAsNumber); 

            // Se l'utente non esiste, restituisci un errore
            if (!user) {
                const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'User not found');
                return res.json({ error: message });
            }
            
            const drawingId = req.params.id; //id del disegno passato come parametro
            // Controlla se l'ID del disegno è valido
            if (isNaN(Number(drawingId))) {
                const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'Invalid drawing ID');
                return res.json({ error: message });
            }

            // Recupera il disegno dal database
            const drawing = await Drawing.findByPk(drawingId);

            if (!drawing) {
                const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'Drawing not found');
                return res.json({ error: message });
            }

            // Verifica se il team dell'utente corrisponde al team del proprietario del disegno. 
            // Consente anche se l'utente ne è il proprietario, anche se il team è diverso
            if (user.id !== drawing.owner_id && user.team !== drawing.target_team) {
                const message = errorMessageFactory.createMessage(ErrorMessage.notAuthorized, 'Forbidden: You are not in the same team as the drawing owner');
                return res.json({ error: message });
            }

            next();
        } catch (error) {
            // In caso di errore nel processo, restituisci un errore generico
            const message = errorMessageFactory.createMessage(ErrorMessage.generalError, 'Internal server error');
            return res.json({ error: message });
        }
    }

    // controlla se l'utente può creare un drawing in un team diverso dal proprio
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

            // Se non è stato specificato target_team, errore
            if (!target_team) {
                const message = errorMessageFactory.createMessage(ErrorMessage.invalidFormat, 'target_team attribute not specified');
                return res.json({ error: message });
            }

            // Se l'utente è un impiegato e specifica un team diverso dal proprio
            if (user.role === 'impiegato' && user.team !== target_team) {
                const message = errorMessageFactory.createMessage(
                    ErrorMessage.notAuthorized,
                    `Users with role "Impiegato" are not allowed to create drawings for a team other than their own.`
                );
                return res.json({ error: message });
            }

            return next();
        } catch (error) {
            const message = errorMessageFactory.createMessage(ErrorMessage.generalError, 'Internal server error');
            return res.json({ error: message });
        }
    }

}

export default new permissionMiddleware();