import React, { useState } from 'react';
import SkepMerkblad from './SkepMerkblad';
import { createRondte } from '../../services/rondte_services';
import './SkepRondte.css';

function SkepRondte({ onRoundCreated }) {
    const [maxTeams, setMaxTeams] = useState('');
    const [showMerkblad, setShowMerkblad] = useState(false);
    const [currentRoundId, setCurrentRoundId] = useState(null);
    const [error, setError] = useState('');

    const handleCreateRound = async () => {
        try {
            const maxTeamsNum = parseInt(maxTeams, 10);
            if (isNaN(maxTeamsNum) || maxTeamsNum <= 0) {
                setError('Voer asseblief \'n geldige aantal spanne in');
                return;
            }

            const round = await createRondte({
                naam: `Rondte ${new Date().toLocaleString()}`,
                max_teams: maxTeamsNum
            });
            setCurrentRoundId(round.rondte_id);
            setShowMerkblad(true);
            if (onRoundCreated) onRoundCreated(round);
        } catch (err) {
            setError('Kon nie rondte skep nie: ' + err.message);
        }
    };

    return (
        <div className="skep-rondte">
            <h2>Skep Nuwe Rondte</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="input-group">
                <label>Aantal spanne wat na volgende rondte gaan:</label>
                <input 
                    type="number"
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(e.target.value)}
                    min="1"
                    placeholder="Voer aantal spanne in"
                />
                <small className="help-text">Hierdie is die aantal spanne wat na die volgende rondte sal deurgaan</small>
            </div>

            <button onClick={handleCreateRound} disabled={!maxTeams || maxTeams <= 0}>
                Skep Rondte
            </button>

            {showMerkblad && currentRoundId && (
                <SkepMerkblad roundId={currentRoundId} />
            )}
        </div>
    );
}

export default SkepRondte;