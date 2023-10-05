const fs = require('fs').promises;

async function delay(seconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
}

const dbFilePath = 'db.json';
const maxLogEntries = 10; // Maximum number of log entries to keep

// Read data from the JSON file asynchronously
async function readLogsFromDatabase() {
    try {
        const jsonData = await fs.readFile(dbFilePath, 'utf8');
        const data = JSON.parse(jsonData);
        return data.logs || [];
    } catch (error) {
        console.error('Error reading from the database:', error);
        return [];
    }
}

async function isDuplicateLog(logEntry) {
    const logs = await readLogsFromDatabase();
    return logs.includes(logEntry);
}

// Write a log entry to the JSON file asynchronously and limit the log array to maxLogEntries
async function writeLogToDatabase(logEntry) {
    try {
        const existingLogs = await readLogsFromDatabase();

        // Add the new log entry to the end of the array
        existingLogs.push(logEntry);

        // If the array exceeds the maximum allowed length, remove the oldest entry
        if (existingLogs.length > maxLogEntries) {
            existingLogs.shift(); // Remove the first (oldest) element
        }

        const data = { logs: existingLogs };

        await fs.writeFile(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
        await delay(1);
        console.log('Log entry written to the database:', logEntry);
    } catch (error) {
        console.error('Error writing to the database:', error);
    }
}

module.exports = {
    readLogsFromDatabase,
    writeLogToDatabase,
    isDuplicateLog
};
