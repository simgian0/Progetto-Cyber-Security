/**This file contains various concrete products and also a Concrete Creator 
 * of the Pattern Factory Method dedicated to fail messages
 */
import { IMessage, HttpStatus, ErrorMessage, MessageFactory } from "./Messages";


/** Concrete Products - Classes */

class createRecordError extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        this.content = "Internal Server Error - Record creation failed.";
        this.description = description;
    }
}

class updateRecordError extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        this.content = "Internal Server Error - Record update failed.";
        this.description = description;
    }
}

class readRecordError extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        this.content = "Internal Server Error - Record reading failed.";
        this.description = description;
    }
}

class deleteRecordError extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        this.content = "Internal Server Error - Record deletion failed.";
        this.description = description;
    }
}

class notAuthorized extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.FORBIDDEN;
        this.content = "Forbidden - Not authorized for this operation.";
        this.description = description;
    }
}

class recordNotFound extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.NOT_FOUND;
        this.content = "Not Found - The record was not found or does not exist";
        this.description = description;
    }
}

class recordAlreadyExist extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.FORBIDDEN;
        this.content = "Forbidden - Record already exist.";
        this.description = description;
    }
}

class invalidFormat extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.BAD_REQUEST;
        this.content = "Bad Request - Format not valid.";
        this.description = description;
    }
}

class generalError extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        this.content = "Ops... Something went wrong!";
        this.description = description;
    }
}

class missingParameters extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.BAD_REQUEST;
        this.content = "Bad Request - Missing some parameters.";
        this.description = description;
    }
}

class missingRoute extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.NOT_FOUND;
        this.content = "Not Found - Missing route.";
        this.description = description;
    }
}

export class errorFactory implements MessageFactory {
    createMessage(typeMessage: ErrorMessage, description?: string): IMessage {
        switch (typeMessage) {
            case ErrorMessage.createRecordError:
                return new createRecordError(description);

            case ErrorMessage.updateRecordError:
                return new updateRecordError(description);

            case ErrorMessage.readRecordError:
                return new readRecordError(description);

            case ErrorMessage.deleteRecordError:
                return new deleteRecordError(description);

            case ErrorMessage.notAuthorized:
                return new notAuthorized(description);

            case ErrorMessage.recordNotFound:
                return new recordNotFound(description);

            case ErrorMessage.recordAlreadyExist:
                return new recordAlreadyExist(description);

            case ErrorMessage.invalidFormat:
                return new invalidFormat(description);

            case ErrorMessage.generalError:
                return new generalError(description);

            case ErrorMessage.missingParameters:
                return new missingParameters(description);

            case ErrorMessage.missingRoute:
                return new missingRoute(description);

            default:
                throw new Error("HTTP status non supportato.");
        }
    }
}