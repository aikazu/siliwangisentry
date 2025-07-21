import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'app.log');

const logToFile = (message: string) => {
    // We use appendFileSync to ensure logs are written sequentially.
    // For high-volume applications, a more robust logging library (like Winston or Pino) would be better.
    fs.appendFileSync(LOG_FILE, message + '\n', 'utf8');
};

const formatMessage = (level: 'INFO' | 'ERROR', text: string, details?: any): string => {
    const timestamp = new Date().toISOString();
    let detailString = '';
    if (details) {
        if (details instanceof Error) {
            detailString = details.stack || details.message;
        } else if (typeof details === 'object') {
            detailString = JSON.stringify(details, null, 2);
        } else {
            detailString = String(details);
        }
    }
    return `[${timestamp}] [${level}] ${text} ${detailString ? `\n${detailString}` : ''}`;
};

export const logInfo = (text: string, details?: any) => {
    const message = formatMessage('INFO', text, details);
    console.log(message);
    logToFile(message);
};

export const logError = (text: string, error?: any) => {
    const message = formatMessage('ERROR', text, error);
    console.error(message);
    logToFile(message);
};
