const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

function getDatabasePath() {
    return path.resolve(__dirname, '..', 'melktert.db');
}

function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const dbPath = getDatabasePath();
        console.log('Initializing database at:', dbPath);

        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            console.log('Creating database directory:', dbDir);
            fs.mkdirSync(dbDir, { recursive: true });
        }

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                return reject(err);
            }
            console.log('Database opened successfully');
        });

        db.serialize(() => {
            db.run('PRAGMA foreign_keys = ON');
            
            // Create Span table first since it's referenced by other tables
            db.run(`
                CREATE TABLE IF NOT EXISTS Span (
                    span_id INTEGER PRIMARY KEY,
                    naam TEXT NOT NULL,
                    logo TEXT,
                    projek_beskrywing TEXT,
                    span_bio TEXT,
                    academic_mark FLOAT,
                    is_eliminated INTEGER DEFAULT 0,
                    presentation_group TEXT
                )
            `);

            // Create Users table if not exists
            db.run(`CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                assigned_group TEXT
            )`);

            // Create Kriteria table
            db.run(`CREATE TABLE IF NOT EXISTS Kriteria (
                kriteria_id INTEGER PRIMARY KEY AUTOINCREMENT,
                beskrywing TEXT NOT NULL,
                default_totaal INTEGER NOT NULL,
                max_punte INTEGER DEFAULT 10,
                gewig FLOAT DEFAULT 1.0,
                merk_gids TEXT
            )`);

            // Create Rounds table after Span since it references it
            db.run(`CREATE TABLE IF NOT EXISTS Rounds (
                rondte_id INTEGER PRIMARY KEY AUTOINCREMENT,
                naam TEXT NOT NULL,
                max_teams INTEGER DEFAULT 15,
                min_time_per_team INTEGER DEFAULT 20,
                is_active INTEGER DEFAULT 1,
                is_locked INTEGER DEFAULT 0,
                winner_span_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (winner_span_id) REFERENCES Span(span_id)
            )`);

            // Create RondteKriteria table
            db.run(`CREATE TABLE IF NOT EXISTS RondteKriteria (
                rondte_id INTEGER,
                kriteria_id INTEGER,
                max_punte INTEGER,
                gewig FLOAT DEFAULT 1.0,
                PRIMARY KEY (rondte_id, kriteria_id),
                FOREIGN KEY (rondte_id) REFERENCES Rounds(rondte_id),
                FOREIGN KEY (kriteria_id) REFERENCES Kriteria(kriteria_id)
            )`);

            // Create RondteSpanBeoordelaar table
            db.run(`CREATE TABLE IF NOT EXISTS RondteSpanBeoordelaar (
                rondte_id INTEGER,
                span_id INTEGER,
                beoordelaar_id INTEGER,
                PRIMARY KEY (rondte_id, span_id, beoordelaar_id),
                FOREIGN KEY (rondte_id) REFERENCES Rounds(rondte_id),
                FOREIGN KEY (span_id) REFERENCES Span(span_id),
                FOREIGN KEY (beoordelaar_id) REFERENCES Users(id)
            )`);

            // Create Punte table last since it references multiple tables
            db.run(`CREATE TABLE IF NOT EXISTS Punte (
                punte_id INTEGER PRIMARY KEY AUTOINCREMENT,
                rondte_id INTEGER,
                span_id INTEGER,
                beoordelaar_id INTEGER,
                kriteria_id INTEGER,
                punt INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (rondte_id) REFERENCES Rounds(rondte_id),
                FOREIGN KEY (span_id) REFERENCES Span(span_id),
                FOREIGN KEY (beoordelaar_id) REFERENCES Users(id),
                FOREIGN KEY (kriteria_id) REFERENCES Kriteria(kriteria_id),
                UNIQUE(rondte_id, span_id, beoordelaar_id, kriteria_id)
            )`);

            // Lid table
            db.run(`
                CREATE TABLE IF NOT EXISTS Lid (
                    lid_id INTEGER PRIMARY KEY,
                    span_id INTEGER NOT NULL,
                    naam TEXT NOT NULL,
                    foto TEXT,
                    bio TEXT,
                    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE
                )
            `);

            // Competition Settings table
            db.run(`
            CREATE TABLE IF NOT EXISTS CompetitionSettings (
                settings_id INTEGER PRIMARY KEY,
                required_assessors INTEGER NOT NULL,
                required_teams INTEGER NOT NULL,
                total_time_minutes INTEGER NOT NULL DEFAULT 120,
                time_per_team TEXT DEFAULT '20',
                max_teams INTEGER NOT NULL DEFAULT 0,
                teams_to_eliminate INTEGER NOT NULL DEFAULT 0,
                is_teams_complete INTEGER DEFAULT 0,
                is_elimination_complete INTEGER DEFAULT 0,
                is_assignments_complete INTEGER DEFAULT 0
            )
            `);

            // Insert default competition settings if they don't exist
            db.run(`
                INSERT OR IGNORE INTO CompetitionSettings (
                    settings_id, 
                    required_assessors, 
                    required_teams, 
                    total_time_minutes, 
                    time_per_team, 
                    max_teams,
                    teams_to_eliminate
                ) VALUES (1, 12, 15, 120, '30', 15, 0)
            `);

            // Consistently use Afrikaans: Rondte table
            db.run(`
            CREATE TABLE IF NOT EXISTS Rondte (
                rondte_id INTEGER PRIMARY KEY AUTOINCREMENT,
                naam TEXT NOT NULL,
                max_spanne INTEGER DEFAULT 15,
                is_active INTEGER DEFAULT 1,
                is_gesluit INTEGER DEFAULT 0,
                winner_span_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (winner_span_id) REFERENCES Span(span_id)
            )
            `);

            // RondteMerkblad table
            db.run(`
            CREATE TABLE IF NOT EXISTS RondteMerkblad (
                merkblad_id INTEGER PRIMARY KEY AUTOINCREMENT,
                rondte_id INTEGER NOT NULL,
                kriteria_id INTEGER NOT NULL,
                max_punte INTEGER NOT NULL,
                gewig FLOAT DEFAULT 1.0,
                FOREIGN KEY (rondte_id) REFERENCES Rondte(rondte_id) ON DELETE CASCADE,
                FOREIGN KEY (kriteria_id) REFERENCES Kriteria(kriteria_id) ON DELETE CASCADE
            )
            `);



            // Kriteria table already created above

            // Merkblad table
            db.run(`
                CREATE TABLE IF NOT EXISTS Merkblad (
                merkblad_id INTEGER PRIMARY KEY,
                rondte_id INTEGER NOT NULL,
                kriteria_id INTEGER NOT NULL,
                totaal INTEGER,
                is_gesluit INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (rondte_id) REFERENCES Rondte(rondte_id) ON DELETE CASCADE,
                FOREIGN KEY (kriteria_id) REFERENCES Kriteria(kriteria_id) ON DELETE CASCADE
            )
            `);



            // Punte_span_brug table
            db.run(`
                CREATE TABLE IF NOT EXISTS Punte_span_brug (
                    id INTEGER PRIMARY KEY,
                    merkblad_id INTEGER NOT NULL,
                    span_id INTEGER NOT NULL,
                    punt INTEGER NOT NULL,
                    FOREIGN KEY (merkblad_id) REFERENCES merkblad(merkblad_id) ON DELETE CASCADE,
                    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE
                )
            `);

            // rondte_uitslag table
            db.run(`
                CREATE TABLE IF NOT EXISTS rondte_uitslag (
                    span_id INTEGER NOT NULL,
                    rondte_id INTEGER NOT NULL,
                    rank INTEGER,
                    in_gevaar INTEGER NOT NULL DEFAULT 1,
                    gemiddelde_punt INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (span_id, rondte_id),
                    FOREIGN KEY (span_id) REFERENCES Span(span_id) ON DELETE CASCADE,
                    FOREIGN KEY (rondte_id) REFERENCES Rondte(rondte_id) ON DELETE CASCADE
                )
            `);

            // Insert dummy data for Span and Lid tables
            db.run(`
                INSERT OR IGNORE INTO Span (span_id, naam, projek_beskrywing, span_bio) 
                VALUES (1, 'Melktert Masters', 'Die toekoms van wegneem melktert bestellings', 'Ons skep full stack web apps')
                ;
                UPDATE Span SET academic_mark = 99 WHERE span_id = 1;
            `);

            db.run(`
                INSERT OR IGNORE INTO Lid (lid_id, span_id, naam, bio) 
                VALUES 
                (1, 1, 'Die Leier', 'Hou van projek bestuur.'),
                (2, 1, 'Die react dev', 'Hou van gebruikerskoppelvlakke skep.'),
                (3, 1, 'Die express dev', 'Hou van agterend dienste skep.'),
                (4, 1, 'Die DB dev', 'Hou van data en databasisse.')
            `);

            // Insert dummy data for Kriteria table
            db.run(`
                INSERT OR IGNORE INTO Kriteria (kriteria_id, beskrywing, default_totaal, merk_gids) 
                VALUES 
                (1, 'Voorkoms', 20, 'Evalueer: \n- Algemene voorkoms\n- Kleur van kors\n- Kleur van vulsel\n- Netjiese afwerking\n- Versiering'),
                (2, 'Tekstuur', 25, 'Evalueer: \n- Kors tekstuur\n- Vulsel tekstuur\n- Sagtheid\n- Kruimelrigheid\n- Snyvermoë'),
                (3, 'Smaak', 30, 'Evalueer: \n- Balans van geure\n- Soet vlak\n- Kaneel hoeveelheid\n- Varsheid\n- Nasmaak'),
                (4, 'Tegniek', 15, 'Evalueer: \n- Bak tegniek\n- Temperatuur beheer\n- Vulsel bereiding\n- Deeg hantering\n- Oond gebruik'),
                (5, 'Oorspronklikheid', 10, 'Evalueer: \n- Unieke elemente\n- Tradisionele waardes\n- Kreatiwiteit\n- Innovasie\n- Persoonlike styl')
            `);

            // Insert default competition settings
            db.run(`
                INSERT OR IGNORE INTO CompetitionSettings (
                    settings_id, required_assessors, required_teams, 
                    total_time_minutes, time_per_team, max_teams,
                    teams_to_eliminate, is_teams_complete, is_elimination_complete, 
                    is_assignments_complete
                ) VALUES (1, 2, 0, 120, '20', 0, 0, 0, 0, 0)
            `);

            // Create assessor-team assignments table
            db.run(`
                CREATE TABLE IF NOT EXISTS AssessorTeamAssignments (
                    assessor_id INTEGER NOT NULL,
                    team_id INTEGER NOT NULL,
                    PRIMARY KEY (assessor_id, team_id),
                    FOREIGN KEY (assessor_id) REFERENCES User(id),
                    FOREIGN KEY (team_id) REFERENCES Span(span_id)
                )
            `);

            db.close((err) => {
                if (err) return reject(err);
                return resolve(dbPath);
            });
        });
    });
}

module.exports = { initializeDatabase, getDatabasePath };


