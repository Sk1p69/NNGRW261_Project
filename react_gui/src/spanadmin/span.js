import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchTeamWithMembers,
  createMember,
  updateMember,
  deleteMember
} from '../services/span_services';
import './span.css';

function Span({ teamId }) {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lid vorm states
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberBio, setNewMemberBio] = useState('');

  const [editingMember, setEditingMember] = useState(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberBio, setEditMemberBio] = useState('');

  // Fetch span + lede
  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { team, members } = await fetchTeamWithMembers(teamId);
      setTeam(team);
      setMembers(members);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeamData();
  }, [teamId, fetchTeamData]);

  // ======== Lid funksies ========
  const handleCreateMember = async () => {
    if (!newMemberName) return;
    try {
      await createMember(teamId, newMemberName, newMemberBio);
      setNewMemberName('');
      setNewMemberBio('');
      fetchTeamData();
    } catch (err) {
      console.error('Error creating member:', err);
    }
  };

  const handleUpdateMember = async () => {
    if (!editMemberName || !editingMember) return;
    try {
      await updateMember(teamId, editingMember, editMemberName, editMemberBio);
      setEditingMember(null);
      setEditMemberName('');
      setEditMemberBio('');
      fetchTeamData();
    } catch (err) {
      console.error('Error updating member:', err);
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      await deleteMember(teamId, memberId);
      fetchTeamData();
    } catch (err) {
      console.error('Error deleting member:', err);
    }
  };

  if (loading) {
    return <div className="span-container"><div className="loading">Laai span inligting...</div></div>;
  }

  if (error) {
    return <div className="span-container"><div className="error">Fout: {error}</div></div>;
  }

  const teamStatus = team.is_eliminated ? 
    <span style={{ color: 'red', fontWeight: 'bold' }}>(Geëlimineer)</span> : 
    <span style={{ color: 'green', fontWeight: 'bold' }}>(Aktief)</span>;

  return (
    <div className="span-container">
      {team && (
        <div className="team-card">
          {/* SPAN DETAIL */}
          <div className="team-header">
            <div className="team-header-content">
              <h2>{team.naam} {teamStatus}</h2>
              <div className="team-academic-mark">
                Akademiese Punt: <strong>{team.academic_mark || 'Geen'}</strong>
              </div>
            </div>
            {team.logo && (
              <div className="team-logo">
                <img src={team.logo} alt={`${team.naam} logo`} />
              </div>
            )}
            <div className="team-info">
              <h2 className="team-name">{team.naam}</h2>
              <p className="team-description">{team.projek_beskrywing}</p>
              <p className="team-bio">{team.span_bio}</p>
            </div>
          </div>

          <button onClick={fetchTeamData} className="btn-brown">
            Herlaai span data
          </button>

          {/* SPANLEDE BEHEER */}
          <div className="members-section">
            <h3>Bestuur Spanlede ({members.length})</h3>

            {editingMember ? (
              <div className="edit-member-form">
                <h4>Wysig Lid</h4>
                <input
                  type="text"
                  value={editMemberName}
                  onChange={(e) => setEditMemberName(e.target.value)}
                  placeholder="Lid naam"
                />

                <input
                  type="text"
                  value={editMemberBio}
                  onChange={(e) => setEditMemberBio(e.target.value)}
                  placeholder="Lid bio"
                />
                <button className="btn-brown" onClick={handleUpdateMember}>Stoor</button>
                <button className="btn-navy" onClick={() => setEditingMember(null)}>Kanselleer</button>
              </div>
            ) : (
              <div className="new-member-form">
                <h4>Voeg Nuwe Lid By</h4>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Lid naam"
                />

                <input
                  type="text"
                  value={newMemberBio}
                  onChange={(e) => setNewMemberBio(e.target.value)}
                  placeholder="Lid bio"
                />
                <button className="btn-brown" onClick={handleCreateMember}>Voeg Lid By</button>
              </div>
            )}

            {/* SPANLEDE DISPLAY */}
            <div className="members-grid">
              {members.map((member) => (
                <div key={member.lid_id} className="member-card">
                  <div className="member-avatar">
                    {member.foto ? (
                      <img src={member.foto} alt={member.naam} />
                    ) : (
                      <div className="default-avatar">{member.naam.charAt(0)}</div>
                    )}
                  </div>

                  <div className="member-info">
                    <h4 className="member-name">{member.naam}</h4>
                    <p className="member-bio">{member.bio}</p>
                  </div>

                  <div className="member-actions">
                    <button
                      className="btn-brown"
                      onClick={() => {
                        setEditingMember(member.lid_id);
                        setEditMemberName(member.naam);
                        setEditMemberBio(member.bio || '');
                      }}
                    >
                      Wysig
                    </button>
                    <button
                      className="btn-navy"
                      onClick={() => handleDeleteMember(member.lid_id)}
                    >
                      Verwyder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Span;
