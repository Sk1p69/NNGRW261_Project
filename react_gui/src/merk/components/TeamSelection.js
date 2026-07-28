import React from 'react';

const TeamSelection = ({ selectedTeam, assignedTeams, onTeamSelect }) => {
  return (
    <div className="team-selection">
      <label>
        Kies Span:
        <select 
          value={selectedTeam?.span_id || ""} 
          onChange={(e) => {
            const team = assignedTeams.find(t => t.span_id === parseInt(e.target.value));
            onTeamSelect(team);
          }}
        >
          <option value="">-- Kies 'n span --</option>
          {assignedTeams.map(team => (
            <option key={team.span_id} value={team.span_id}>
              {team.naam}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default TeamSelection;