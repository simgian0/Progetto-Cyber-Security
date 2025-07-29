/**This file contains various concrete products and also a Concrete Creator 
 * of the Pattern Factory Method dedicated to successful messages
 */
import { IMessage, HttpStatus, SuccesMessage, MessageFactory } from "./Messages";


/** Concrete Products - Classes */

class createRecordSuccess extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.CREATED;
        this.content = "Created - Record creation succeeded";
        this.description = description;
    }
}

class updateRecordSuccess extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.CREATED;
        this.content = "Created - Record update succeeded";
        this.description = description;
    }
}

class readRecordSuccess extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.OK;
        this.content = "OK - Record reading succeeded.";
        this.description = description;
    }
}

class deleteRecordSuccess extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.NO_CONTENT;
        this.content = "No Content - Record deletion succeeded";
        this.description = description;
    }
}

class generalSuccess extends IMessage {
    httpStatus: number;
    content: string;
    description?: string;

    constructor(description?: string) {
        super()
        this.httpStatus = HttpStatus.OK;
        this.content = "OK - Operation succeeded";
        this.description = description;
    }
}

export class successFactory implements MessageFactory {
    createMessage(typeMessage: SuccesMessage, description?: string): IMessage {
        switch (typeMessage) {
            case SuccesMessage.createRecordSuccess:
                return new createRecordSuccess(description);

            case SuccesMessage.updateRecordSuccess:
                return new updateRecordSuccess(description);

            case SuccesMessage.readRecordSuccess:
                return new readRecordSuccess(description);

            case SuccesMessage.deleteRecordSuccess:
                return new deleteRecordSuccess(description);

            case SuccesMessage.generalSuccess:
                return new generalSuccess(description);

            default:
                throw new Error("HTTP status non supportato.");
        }
    }
}