/**Interface for Factory Pattern applied to response messages */


// Enum for HttpStatus codes
export enum HttpStatus {
    OK = 200, 
    CREATED = 201,
    NO_CONTENT = 204, 
    BAD_REQUEST = 400, 
    UNAUTHORIZED = 401, 
    FORBIDDEN = 403, 
    NOT_FOUND = 404, 
    INTERNAL_SERVER_ERROR = 500 
}

//Enum for success messages
export enum SuccesMessage{
    createRecordSuccess,
    updateRecordSuccess,
    readRecordSuccess,
    deleteRecordSuccess,
    generalSuccess
}

//Enum for error messages
export enum ErrorMessage{
    createRecordError,
    updateRecordError,
    readRecordError,
    deleteRecordError,
    notAuthorized,
    recordNotFound,
    recordAlreadyExist,
    invalidFormat,
    generalError,
    missingParameters,
    missingRoute 
}

/*Pattern Factory Method Components*/

// Product - Abstract Class
 export abstract class IMessage {
    protected abstract httpStatus: number;
    protected abstract content: string;
    protected abstract description?: string; // Campo opzionale
    protected type: string;

    constructor(type:string ="application/json"){
        this.type =type;

    }

    // getter for message
    getMessage() {
        return {
            status: this.httpStatus,
            message: this.content,
            description: this.description,
            type: this.type
        };
    }
}

//Creator - Interface  
export interface MessageFactory{
    createMessage(typeMessage: number, description?:string) : IMessage
}
