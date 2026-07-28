import React, { useState, useEffect } from 'react';
import {
    getCurrentActiveRound,
    getAllRondtes,
    sluitRondte,
    getRondteMerkblad,
    getTeamsForRound
} from '../../services/rondte_services';
import './BestuurRondtes.css';
import { getRoundResults } from '../../services/round_services';
import SkepRondte from './SkepRondte';
import SkepMerkblad from './SkepMerkblad';

function BestuurRondtes() {
    const [rondtes, setRondtes] = useState([]);
    const [activeRondte, setActiveRondte] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showMerkblad, setShowMerkblad] = useState(false);
    const [merkblad, setMerkblad] = useState(null);

    useEffect(() => {
        loadAllData();
    }, []);

    // Load results for locked rounds
    useEffect(() => {
        const loadLockedRoundResults = async () => {
            if (rondtes) {
                const lockedRounds = rondtes.filter(r => r.is_gesluit);
                for (const round of lockedRounds) {
                    await loadRoundResults(round.rondte_id);
                }
            }
        };
        loadLockedRoundResults();
    }, [rondtes]);

    const loadAllData = async () => {
        try {
            const [allRondtes, activeRound] = await Promise.all([
                getAllRondtes(),
                getCurrentActiveRound()
            ]);

            setRondtes(allRondtes);
            setActiveRondte(activeRound);
        } catch (err) {
            setError('Kon nie data laai nie: ' + err.message);
        }
    };

    const handleViewMerkblad = async (rondteId) => {
        try {
            const merkbladData = await getRondteMerkblad(rondteId);
            setMerkblad(merkbladData);
            setShowMerkblad(true);
            setError('');
        } catch (err) {
            setError('Kon nie merkblad kry nie: ' + err.message);
        }
    };

    const [roundResults, setRoundResults] = useState(null);

    const loadRoundResults = async (rondteId) => {
        try {
            const results = await getRoundResults(rondteId);
            setRoundResults(results);
            return results;
        } catch (err) {
            console.error('Error loading round results:', err);
            setError('Kon nie rondte resultate laai nie: ' + err.message);
        }
    };

    const handleSluitRondte = async (rondteId) => {
        if (!window.confirm('Is jy seker jy wil hierdie rondte sluit?')) {
            return;
        }
        
        try {
            setError('');
            
            // Get the results first
            const results = await getRoundResults(rondteId);
            
            // Get all teams in the round even if they haven't been marked
            const teamsInRound = await getTeamsForRound(rondteId);
            
            // Create results array including teams with no marks (they get 0)
            const completeResults = teamsInRound.map(team => {
                const teamResult = results.find(r => r.span_id === team.span_id);
                return teamResult || {
                    span_id: team.span_id,
                    span_naam: team.naam,
                    gemiddelde_punt: 0
                };
            });
            
            // Sort by average score
            completeResults.sort((a, b) => (b.gemiddelde_punt || 0) - (a.gemiddelde_punt || 0));
            
            // Find the winner (highest score)
            const winner = completeResults[0];
            
            // Get teams that should advance (top teams based on results)
            const advancingTeams = completeResults.slice(0, activeRondte.max_spanne || 3)
                                               .map(team => team.span_id);
            
            // Close the round with winner and advancing teams
            await sluitRondte(rondteId, {
                winnaarSpanId: winner.span_id,
                spanneToelaatVirVolgendeRondte: advancingTeams
            });
            
            setRoundResults(results);
            setSuccess('Rondte is suksesvol gesluit');
            
            // Refresh the rounds list
            await loadAllData();
        } catch (err) {
            setError('Kon nie rondte sluit nie: ' + err.message);
        }
    };

    return (
        <div className="bestuur-rondtes">
            <h2>Bestuur Rondtes</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Show round creation if there's no active round */}
            {!activeRondte && <SkepRondte onRoundCreated={loadAllData} />}

            {/* Show active round, teams, and controls */}
            {activeRondte && (
                <section className="active-round">
                    <h3>Aktiewe Rondte: {activeRondte.naam}</h3>
                    
                    {/* Display round information */}
                    <div className="round-info-section">
                        <h4>Rondte Inligting</h4>
                        <div className="round-details">
                            <p className="teams-through">
                                <strong>Spanne wat deurgaan na volgende rondte: </strong> 
                                <span className="teams-number">{activeRondte.max_teams}</span>
                                <br/>
                                <small>Aan die einde van hierdie rondte sal die top {activeRondte.max_teams} spanne kwalifiseer vir die volgende rondte</small>
                            </p>
                        </div>
                        
                        {/* Display results if available */}
                        {roundResults && roundResults.length > 0 && (
                            <div className="round-results">
                                <h4>Huidige Uitslae</h4>
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Posisie</th>
                                            <th>Span</th>
                                            <th>Punte</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roundResults.map((team, index) => (
                                            <tr key={team.span_id || index} 
                                                className={index === 0 ? 'winner-row' : ''}>
                                                <td>{index + 1}</td>
                                                <td>{team.span_naam || team.naam}</td>
                                                <td>{Number(team.gemiddelde_punt || 0).toFixed(2)}</td>
                                                <td>
                                                    {index === 0 && (
                                                        <span className="winner-badge">Wenner!</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Add merkblad creation if it doesn't exist */}
                    {!merkblad && (
                        <SkepMerkblad 
                            roundId={activeRondte.rondte_id}
                            onMerkbladCreated={() => {
                                setSuccess('Merkblad geskep!');
                                handleViewMerkblad(activeRondte.rondte_id);
                            }}
                        />
                    )}

                    {/* Round controls */}
                    <div className="round-controls">
                        <button 
                            onClick={() => handleViewMerkblad(activeRondte.rondte_id)}
                            className="btn-primary"
                        >
                            Sien Merkblad
                        </button>
                        <button 
                            onClick={() => handleSluitRondte(activeRondte.rondte_id)}
                            className="btn-danger"
                        >
                            Sluit Rondte
                        </button>
                    </div>

                    {/* Display merkblad when viewing */}
                    {showMerkblad && merkblad && (
                        <div className="merkblad-view">
                            <h4>Merkblad vir {activeRondte.naam}</h4>
                            <div className="merkblad-items">
                                {merkblad.map(item => (
                                    <div key={item.kriteria_id} className="merkblad-item">
                                        <span>{item.beskrywing}</span>
                                        <span>Maksimum Punte: {item.max_punte}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowMerkblad(false)}>Sluit Merkblad</button>
                        </div>
                    )} 
                </section>
            )}

            {/* Show list of closed rounds */}
            <div className="rounds-list">
                <h3>Vorige Rondtes</h3>
                {rondtes
                    .filter(round => round.is_gesluit && (!activeRondte || round.rondte_id !== activeRondte.rondte_id))
                    .map(round => (
                    <div key={`closed-${round.rondte_id}`} className="round-item">
                        <div className="round-info">
                            <span className="round-name">{round.naam}</span>
                            <span className="round-date">Geskep: {new Date(round.created_at).toLocaleString()}</span>
                            {round.wenner_naam && (
                                <span className="round-winner">Wenner: {round.wenner_naam}</span>
                            )}
                        </div>
                        
                        {roundResults && round.rondte_id === activeRondte?.rondte_id && (
                            <div className="round-results">
                                <h4>Finale Uitslae</h4>
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Posisie</th>
                                            <th>Span Naam</th>
                                            <th>Gemiddelde Punt</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roundResults.map((result, index) => (
                                            <tr key={result.span_id} className={index === 0 ? 'winner-row' : ''}>
                                                <td>{result.rank}</td>
                                                <td>{result.span_naam}</td>
                                                <td>{Number(result.gemiddelde_punt || 0).toFixed(2)}</td>
                                                <td>
                                                    {index === 0 && <span className="winner-badge">Wenner!</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BestuurRondtes;