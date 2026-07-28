const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');

async function setDefaultGroups() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(getDatabasePath());
        
        db.serialize(() => {
            // Add assigned_group column if it doesn't exist
            db.run(`ALTER TABLE Users ADD COLUMN assigned_group TEXT`, (err) => {
                // Ignore error if column already exists
                
                // Assign all current beoordelaars to Group A
                db.run(`
                    UPDATE Users 
                    SET assigned_group = 'A' 
                    WHERE role = 'beoordelaar' AND (assigned_group IS NULL OR assigned_group = '')
                `, (err) => {
                    if (err) {
                        console.error('Error assigning beoordelaars to Group A:', err);
                        db.close();
                        reject(err);
                    } else {
                        console.log('Successfully assigned beoordelaars to Group A');
                        db.close();
                        resolve();
                    }
                });
            });
        });
    });
}

setDefaultGroups()
    .then(() => console.log('Migration completed successfully'))
    .catch(err => console.error('Migration failed:', err));