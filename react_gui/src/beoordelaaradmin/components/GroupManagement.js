import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GroupManagement.css';

const GroupManagement = () => {
    // Fetch initial data when component mounts
    useEffect(() => {
        fetchTeams();
    }, []);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [groupATeams, setGroupATeams] = useState([]);
    const [groupBTeams, setGroupBTeams] = useState([]);

    // Function to auto-assign teams
    const handleAutoAssign = async () => {
        try {
            const response = await axios.post('http://localhost:3000/admin/groups/auto-assign', {});
            setMessage(`Teams automatically assigned: ${response.data.groupA} teams in Group A, ${response.data.groupB} teams in Group B`);
            // Refresh team lists
            fetchTeams();
            setError('');
        } catch (err) {
            console.error('Auto-assign error:', err.response || err);
            setError('Error assigning teams: ' + (err.response?.data?.error || err.message));
            setMessage('');
        }
    };

    // Function to fetch teams in each group
    const fetchTeams = async () => {
        try {
            const [groupAResponse, groupBResponse] = await Promise.all([
                axios.get('http://localhost:3000/admin/groups/A/teams'),
                axios.get('http://localhost:3000/admin/groups/B/teams')
            ]);
            setGroupATeams(groupAResponse.data);
            setGroupBTeams(groupBResponse.data);
            setError('');
        } catch (err) {
            console.error('Fetch teams error:', err.response || err);
            setError('Error fetching teams: ' + (err.response?.data?.error || err.message));
        }
    };

    // Function to manually assign a team to a group
    const assignTeamToGroup = async (teamId, group) => {
        try {
            await axios.post(`http://localhost:3000/admin/teams/${teamId}/group`, { group });
            fetchTeams(); // Refresh team lists
            setMessage(`Team successfully assigned to Group ${group}`);
            setError('');
        } catch (err) {
            setError('Error assigning team: ' + (err.response?.data?.error || err.message));
            setMessage('');
        }
    };

    return (
        <div className="group-management">
            <h2>Span Groep Bestuur</h2>
            
            {/* Auto-assign button */}
            <div className="auto-assign-section">
                <button style={{ backgroundColor: '#0C2340' }}
                    className="auto-assign-button"
                    onClick={handleAutoAssign}
                >
                    Ken spanne outomaties toe aan groepe
                </button>
            </div>

            {/* Messages */}
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            {/* Group display */}
            <div className="groups-container">
                <div className="group-section">
                    <h3>Groep A</h3>
                    <ul>
                        {groupATeams.map(team => (
                            <li key={team.span_id}>
                                {team.naam}
                                <button onClick={() => assignTeamToGroup(team.span_id, 'B')}>
                                    Skuif na Groep B
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="group-section">
                    <h3>Groep B</h3>
                    <ul>
                        {groupBTeams.map(team => (
                            <li key={team.span_id}>
                                {team.naam}
                                <button onClick={() => assignTeamToGroup(team.span_id, 'A')}>
                                    Skuif na Groep A
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default GroupManagement;