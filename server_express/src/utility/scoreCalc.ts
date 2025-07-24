export function calculateScore(score: number, operation: string, value: number): number {
    let result: number;

    // Determina l'operazione da eseguire
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

    // Impostare il risultato ai limiti se è minore di 0 o maggiore di 100
    if (result < 0) {
        result = 0;
    } else if (result > 100) {
        result = 100;
    }

    // Ritorna il risultato del calcolo
    return result;
}