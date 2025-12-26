
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, 'buildpro_db.sqlite');
const BACKUP_DIR = path.join(__dirname, 'backups');

async function backup() {
    console.log("Starting database backup...");

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `buildpro_db_${timestamp}.sqlite`);

    try {
        if (!fs.existsSync(DB_PATH)) {
            console.error("Critical Error: buildpro_db.sqlite not found!");
            return;
        }

        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`Backup successful: ${backupPath}`);

        // Clean up old backups (keep last 5)
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.sqlite'))
            .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (backups.length > 5) {
            backups.slice(5).forEach(b => {
                fs.unlinkSync(path.join(BACKUP_DIR, b.name));
                console.log(`Deleted old backup: ${b.name}`);
            });
        }
    } catch (e) {
        console.error("Backup failed:", e);
    }
}

backup();
