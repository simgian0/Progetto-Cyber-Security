//Import factory
import { errorFactory } from "../factory/FailMessage";
import { ErrorMessage } from "../factory/Messages";

const errorMessageFactory: errorFactory = new errorFactory();

// Middleware function to handle routes that are not found
export function routeNotFound(req: any, res: any, next: any) {
    // Pass an error message to the next middleware indicating that the route is missing
    next(errorMessageFactory.createMessage(ErrorMessage.missingRoute));
}

// Error handling middleware function
export function ErrorHandler(err: any, req: any, res: any, next: any) {
    // Extract the error message from the error object
    var message = (err).getMessage();
    // Prepare the complete response object
    const responseBody = {
        status: message.status,
        message: message.message,
        description: message.description,
        type: message.type
    };

    // Send the response with the appropriate content type and status code
    res.setHeader('Content-Type', message.type)
        .status(message.status)
        .send(JSON.stringify(responseBody));

}