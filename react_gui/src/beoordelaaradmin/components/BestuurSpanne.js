import React, { useState, useEffect } from 'react';
import { getTeamsByAcademicMark, getCompetitionSettings, eliminateTeams } from '../../services/competition_services';

function BestuurSpanne() {
    const [teams, setTeams] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eliminating, setEliminating] = useState(false);

    const handleEliminateTeams = async () => {
        try {
            setEliminating(true);
            await eliminateTeams(settings.teams_to_eliminate);
            // Fetch fresh data after elimination
            const [updatedTeams, updatedSettings] = await Promise.all([
                getTeamsByAcademicMark(),
                getCompetitionSettings()
            ]);
            setTeams(updatedTeams);
            setSettings(updatedSettings);
        } catch (err) {
            console.error('Error in handleEliminateTeams:', err);
            setError('Error eliminating teams: ' + err.message);
        } finally {
            setEliminating(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching teams and settings...');
                const [teamsData, settingsData] = await Promise.all([
                    getTeamsByAcademicMark(),
                    getCompetitionSettings()
                ]);
                console.log('Teams data:', teamsData);
                console.log('Settings data:', settingsData);
                setTeams(teamsData);
                setSettings(settingsData);
                setLoading(false);
            } catch (err) {
                console.error('Error in fetchData:', err);
                setError('Error fetching data: ' + err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!settings) return null;
    if (!settings.required_teams || settings.required_teams === 0) return null;

    // Count total teams
    const totalTeams = teams.length;
    // Count non-eliminated teams
    const activeTeams = teams.filter(team => team.is_eliminated === 0).length;

    // First check if we have enough total teams
    const notEnoughTotalTeams = totalTeams < settings.required_teams;

    return (
        <div className="bestuur-spanne">
            <h2>Bestuur Spanne</h2>
            
            {notEnoughTotalTeams ? (
                <div className="warning-message">
                    <p>Daar is nie genoeg spanne nie!</p>
                    <p>Benodig nog {settings.required_teams - totalTeams} spanne.</p>
                    <p>Voeg asseblief meer spanne by voor die kompetisie kan begin.</p>
                </div>
            ) : (
                <div className="teams-list">
                    <h3>Spanne volgens akademiese punte</h3>
                    <div className="status-summary">
                        <p>Totale spanne: {totalTeams}</p>
                        <p>Aktiewe spanne: {activeTeams}</p>
                        <p>Ge-elimineerde spanne: {totalTeams - activeTeams}</p>
                    </div>
                    {settings.teams_to_eliminate > 0 && activeTeams > (settings.required_teams - settings.teams_to_eliminate) && (
                        <div className="elimination-section">
                            <p>Daar is {settings.teams_to_eliminate} spanne om te elimineer</p>
                            <button 
                                onClick={handleEliminateTeams}
                                disabled={eliminating}
                                className="eliminate-button"
                            >
                                {eliminating ? 'Besig met eliminasie...' : 'Elimineer spanne'}
                            </button>
                        </div>
                    )}
                    <table>
                        <thead>
                            <tr>
                                <th>Posisie</th>
                                <th>Span Naam</th>
                                <th>Akademiese Punt</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map((team, index) => (
                                <tr 
                                    key={team.span_id}
                                    className={team.is_eliminated === 1 ? 'eliminated' : ''}
                                >
                                    <td>{index + 1}</td>
                                    <td>{team.naam}</td>
                                    <td>{team.academic_mark ? `${team.academic_mark}%` : 'Geen punt'}</td>
                                    <td>
                                        {team.is_eliminated === 1 ? 
                                            'Ge-elimineer' : 
                                            'Kwalifiseer'
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default BestuurSpanne;