const fs = require('fs');
const path = require('path');

const historyDir = 'C:\\Users\\22206\\AppData\\Roaming\\Code\\User\\History';
const projectDirText = 'tutoring-platform/frontend/src';

// The mistake happened around 2026-03-22T13:17:52+05:00
const mistakeTime = new Date('2026-03-22T13:17:40+05:00').getTime();

const dirs = fs.readdirSync(historyDir).filter(d => fs.statSync(path.join(historyDir, d)).isDirectory());
let restoredCount = 0;

dirs.forEach(dir => {
    const entriesPath = path.join(historyDir, dir, 'entries.json');
    if (fs.existsSync(entriesPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
            if (data.resource && data.resource.includes(projectDirText) && data.entries && data.entries.length > 0) {
                let actualPath = decodeURIComponent(data.resource.replace('file:///', ''));
                actualPath = actualPath.replace(/^c:/i, 'C:').replace(/\//g, '\\');

                let validEntries = data.entries.filter(e => e.timestamp < mistakeTime);
                validEntries.sort((a, b) => b.timestamp - a.timestamp);
                
                if (validEntries.length > 0) {
                    const bestEntry = validEntries[0];
                    const backupFile = path.join(historyDir, dir, bestEntry.id);
                    
                    if (fs.existsSync(backupFile) && fs.existsSync(actualPath)) {
                        const backupContent = fs.readFileSync(backupFile, 'utf8');
                        fs.writeFileSync(actualPath, backupContent, 'utf8');
                        console.log(`Restored ${actualPath} from backup (time: ${new Date(bestEntry.timestamp).toISOString()})`);
                        restoredCount++;
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }
});

console.log(`Total files restored: ${restoredCount}`);
