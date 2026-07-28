const sqlite3 = require('sqlite3').verbose();
const { getDatabasePath } = require('../db_setup/setup');

// Calculate average marks and rankings for teams in a round
async function calculateRoundResults(rondte_id) {
    const db = new sqlite3.Database(getDatabasePath());
    console.log('Calculating results for round:', rondte_id);

    try {
        await runQuery(db, 'BEGIN TRANSACTION');

        // Get all teams and their marks for this round
        const teamResults = await allQuery(db, `
            WITH RoundTeams AS (
                SELECT DISTINCT rsb.span_id
                FROM RondteSpanBeoordelaar rsb
                WHERE rsb.rondte_id = ?
            ),
            TeamMarks AS (
                SELECT 
                    s.span_id,
                    s.naam as span_naam,
                    COALESCE(
                        ROUND(
                            SUM(CAST(p.punt AS FLOAT) * k.gewig) / 
                            COUNT(DISTINCT p.kriteria_id)
                        , 2),
                        0
                    ) as gemiddelde_punt,
                    COUNT(DISTINCT p.beoordelaar_id) as aantal_beoordelaars,
                    COUNT(DISTINCT p.kriteria_id) as aantal_kriteria
                FROM Span s
                LEFT JOIN Punte p ON s.span_id = p.span_id AND p.rondte_id = ?
                LEFT JOIN Kriteria k ON p.kriteria_id = k.kriteria_id
                WHERE s.span_id IN (SELECT span_id FROM RoundTeams)
                GROUP BY s.span_id, s.naam
            )
            SELECT *
            FROM TeamMarks
            ORDER BY gemiddelde_punt DESC
        `, [rondte_id, rondte_id]);

        // Insert or update results for each team
        for (let [index, result] of teamResults.entries()) {
            const rank = index + 1;
            await runQuery(db, `
                INSERT OR REPLACE INTO rondte_uitslag 
                (span_id, rondte_id, rank, gemiddelde_punt, in_gevaar)
                VALUES (?, ?, ?, ?, ?)
            `, [
                result.span_id, 
                rondte_id, 
                rank, 
                result.gemiddelde_punt, 
                0 // Reset in_gevaar status
            ]);
        }

        // Update the winner in the Rondte table
        if (teamResults.length > 0) {
            await runQuery(db, `
                UPDATE Rondte 
                SET winner_span_id = ?,
                    is_gesluit = 1
                WHERE rondte_id = ?
            `, [teamResults[0].span_id, rondte_id]);
        }

        await runQuery(db, 'COMMIT');

        // Return simplified results
        return {
            rankings: teamResults.map((team, index) => ({
                ...team,
                gemiddelde_punt: Math.round(team.gemiddelde_punt),
                rank: index + 1,
                is_winner: index === 0
            }))
        };

    } catch (error) {
        await runQuery(db, 'ROLLBACK');
        console.error('Error calculating round results:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Get results for a specific round
async function getRoundResults(rondte_id) {
    const db = new sqlite3.Database(getDatabasePath());

    try {
        const results = await allQuery(db, `
            SELECT 
                ru.rank,
                ru.span_id,
                s.naam as span_naam,
                ru.gemiddelde_punt,
                ru.in_gevaar,
                CASE WHEN r.winner_span_id = ru.span_id THEN 1 ELSE 0 END as is_winner
            FROM rondte_uitslag ru
            INNER JOIN Span s ON ru.span_id = s.span_id
            INNER JOIN Rondte r ON ru.rondte_id = r.rondte_id
            WHERE ru.rondte_id = ?
            ORDER BY ru.rank
        `, [rondte_id]);

        return results;

    } catch (error) {
        console.error('Error getting round results:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Helper function to run a query that doesn't return results
function runQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

// Helper function to get multiple rows
function allQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = {
    calculateRoundResults,
    getRoundResults
};