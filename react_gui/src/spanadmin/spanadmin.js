import React, { useState, useEffect } from 'react';
import './span.css';
import {
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  updateTeamAcademicMark,
  addTestTeams
} from '../services/span_services';
import Span from './span';

function SpanAdmin() {
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamBio, setNewTeamBio] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState('');
  const [newTeamAcademicMark, setNewTeamAcademicMark] = useState('');
  const [editingTeam, setEditingTeam] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [editAcademicMark, setEditAcademicMark] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      const data = await fetchTeams();
      // Sort teams by elimination status and academic mark
      const sortedTeams = data.sort((a, b) => {
        if (a.is_eliminated !== b.is_eliminated) {
          return a.is_eliminated ? 1 : -1; // Active teams first
        }
        return (b.academic_mark || 0) - (a.academic_mark || 0); // Then by academic mark
      });
      console.log('✅ Fetched teams:', sortedTeams);
      setTeams(sortedTeams);
    } catch (err) {
      console.error('❌ Error fetching teams:', err);
    }
  }

  async function handleCreateTeam() {
    if (!newTeam) return;
    try {
      await createTeam(newTeam, newTeamDesc, newTeamBio, newTeamLogo, newTeamAcademicMark || 0);
      setNewTeam('');
      setNewTeamDesc('');
      setNewTeamBio('');
      setNewTeamLogo('');
      setNewTeamAcademicMark('');
      await loadTeams();
    } catch (err) {
      console.error('❌ Error creating team:', err);
    }
  }

  async function handleUpdateTeam(id) {
    if (!editName) return;
    try {
      console.log('Preparing team update:', { id, editName, editDesc, editBio, editLogo, editAcademicMark }); // Debug log
      const teamData = {
        naam: editName,
        projek_beskrywing: editDesc || null,
        span_bio: editBio || null,
        logo: editLogo || null,
        academic_mark: editAcademicMark ? parseFloat(editAcademicMark) : null
      };
      console.log('Sending update data:', teamData); // Debug log
      await updateTeam(id, teamData);
      setEditingTeam(null);
      setEditName('');
      setEditDesc('');
      setEditBio('');
      setEditLogo('');
      setEditAcademicMark('');
      await loadTeams();
    } catch (err) {
      console.error('❌ Error updating team:', err);
    }
  }

  async function handleDeleteTeam(id) {
    try {
      await deleteTeam(id);
      await loadTeams();
    } catch (err) {
      console.error('❌ Error deleting team:', err);
    }
  }

  async function handleAcademicMarkUpdate(id, mark) {
    try {
      const parsedMark = parseFloat(mark);
      if (parsedMark < 0 || parsedMark > 100 || isNaN(parsedMark)) {
        alert('Akademiese punt moet tussen 0 en 100 wees');
        return;
      }
      await updateTeamAcademicMark(id, parsedMark);
      await loadTeams();
    } catch (err) {
      console.error('❌ Error updating academic mark:', err);
    }
  }

  return (
    <div>
      <h1>Welkom by die Span Admin bladsy</h1>

      {/* Test data button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          className="btn-brown"
          onClick={async () => {
            try {
              await addTestTeams();
              await loadTeams();
              alert('14 toets spanne is suksesvol bygevoeg!');
            } catch (err) {
              console.error('Error adding test teams:', err);
              alert('Kon nie toets spanne byvoeg nie');
            }
          }}
        >
          Voeg 14 Toets Spanne By
        </button>
      </div>

      {/* Skep span */}
      <div>
        <h2>Voeg nuwe span by</h2>
        <input
          type="text"
          value={newTeam}
          onChange={(e) => setNewTeam(e.target.value)}
          placeholder="Span naam"
        />
        <input
          type="text"
          value={newTeamDesc}
          onChange={(e) => setNewTeamDesc(e.target.value)}
          placeholder="Projek beskrywing"
        />
        <input
          type="text"
          value={newTeamBio}
          onChange={(e) => setNewTeamBio(e.target.value)}
          placeholder="Span bio"
        />
        <input
          type="text"
          value={newTeamLogo}
          onChange={(e) => setNewTeamLogo(e.target.value)}
          placeholder="Logo URL"
        />
        <input
          type="number"
          min="0"
          max="100"
          value={newTeamAcademicMark}
          onChange={(e) => setNewTeamAcademicMark(e.target.value)}
          placeholder="Akademiese Punt (0–100)"
        />
        <button className="btn-brown" onClick={handleCreateTeam}>
          Skep Span
        </button>
      </div>

      {/* Lys van spanne */}
      <div>
        <h2>Bestaande spanne</h2>
        <table>
          <thead>
            <tr>
              <th>Naam</th>
              <th>Beskrywing</th>
              <th>Bio</th>
              <th>Logo</th>
              <th>Akademiese Punt</th>
              <th>Aksies</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const academicMark =
                team.academic_mark ??
                team.academicMark ??
                team.mark ??
                0;

              return (
                <tr key={team.span_id}>
                  {editingTeam === team.span_id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editLogo}
                          onChange={(e) => setEditLogo(e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editAcademicMark}
                          onChange={(e) => setEditAcademicMark(e.target.value)}
                          style={{ width: '70px' }}
                        />
                      </td>
                      <td>
                        <button
                          className="btn-brown"
                          onClick={() => handleUpdateTeam(team.span_id)}
                        >
                          Stoor
                        </button>
                        <button
                          className="btn-navy"
                          onClick={() => setEditingTeam(null)}
                        >
                          Kanselleer
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{team.naam || '–'}</td>
                      <td>{team.projek_beskrywing || '–'}</td>
                      <td>{team.span_bio || '–'}</td>
                      <td>
                        {team.logo ? (
                          <img
                            src={team.logo}
                            alt="Logo"
                            style={{ width: 40, height: 40 }}
                          />
                        ) : (
                          '–'
                        )}
                      </td>
                      <td>
                        {editingTeam === team.span_id ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={academicMark || ''}
                            onChange={(e) =>
                              handleAcademicMarkUpdate(
                                team.span_id,
                                e.target.value
                              )
                            }
                            style={{ width: '70px' }}
                          />
                        ) : (
                          <span>{academicMark || '–'}</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-brown"
                          onClick={() => {
                            setEditingTeam(team.span_id);
                            setEditName(team.naam);
                            setEditDesc(team.projek_beskrywing || '');
                            setEditBio(team.span_bio || '');
                            setEditLogo(team.logo || '');
                            setEditAcademicMark(team.academic_mark || '');
                          }}
                        >
                          Wysig
                        </button>
                        <button
                          className="btn-navy"
                          onClick={() => handleDeleteTeam(team.span_id)}
                        >
                          Verwyder
                        </button>
                        <button
                          className="btn-brown"
                          onClick={() => setSelectedTeamId(team.span_id)}
                        >
                          Bekyk span
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {selectedTeamId && (
          <div
            style={{ marginTop: '2em', padding: '1em', border: '1px solid #ccc' }}
          >
            <h3>Span Detail</h3>
            <Span teamId={selectedTeamId} />
          </div>
        )}
      </div>
    </div>
  );
}

export default SpanAdmin;
