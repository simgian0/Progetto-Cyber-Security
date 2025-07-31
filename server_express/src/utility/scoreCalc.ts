export function calculateScore(score: number, operation: string, value: number): number {
    let result: number;

    // Determine the operation to perform
    switch (operation.toLowerCase()) {
        case 'multiply':
            result = score * value;
            break;
        case 'divide':
            if (value === 0) {
                throw new Error('Division by zero is not allowed');
            }
            result = score / value;
            break;
        case 'add':
            result = score + value;
            break;
        case 'subtract':
            result = score - value;
            break;
        default:
            throw new Error('Invalid operation. Please use "multiply", "divide", "add", or "subtract".');
    }

    // Clamp the result to a minimum of 1 and a maximum of 100
    if (result == null || result <= 0) {
        result = 1;
    } else if (result > 100) {
        result = 100;
    }

    // Return the calculated score
    return result;
}