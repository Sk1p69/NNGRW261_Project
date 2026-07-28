import React, { useState, useEffect } from 'react';
import {
  fetchAvailableRounds,
  fetchAvailableTeams,
  fetchRoundMerkblad,
  submitTeamMarks,
  fetchPuntePerRondte,
  hasMarkedTeam
} from '../services/merk_services';
import TeamSelection from './components/TeamSelection';
import MarkingForm from './components/MarkingForm';
import StatusMessages from './components/StatusMessages';
import './merk.css';

const Merk = () => {
  const [activeRound, setActiveRound] = useState(null);
  const [assignedTeams, setAssignedTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [kriteria, setKriteria] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasMarked, setHasMarked] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use API to fetch available rounds and pick the first active one
        const rounds = await fetchAvailableRounds();
        console.log('Available rounds:', rounds); // Debug log
        const round = Array.isArray(rounds) ? rounds[0] : null;
        setActiveRound(round);

        if (round) {
          try {
            // fetch the merkblad (which contains criteria)
            console.log('Fetching merkblad for round:', round.rondte_id); // Debug log
            const merkblad = await fetchRoundMerkblad(round.rondte_id);
            console.log('Received merkblad:', merkblad); // Debug log
            setKriteria(merkblad?.kriteria || []);

            // fetch only teams assigned to this beoordelaar for this round
            const teams = await fetchAvailableTeams(round.rondte_id);
            console.log('Available teams:', teams); // Debug log
            setAssignedTeams(teams || []);
          } catch (err) {
            console.error('Error loading round data:', err); // Debug log
            setError(`Kon nie rondte data laai nie: ${err.message}`);
          }
        } else {
          setError('Geen aktiewe rondte beskikbaar nie');
        }
      } catch (err) {
        console.error('Error in loadData:', err); // Debug log
        setError(`Kon nie data laai nie: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadMarks = async () => {
      if (!selectedTeam || !activeRound) return;

      try {
        setLoading(true);
        // Check if beoordelaar has already marked this team
        const marked = await hasMarkedTeam(activeRound.rondte_id, selectedTeam.span_id);
        setHasMarked(marked);

        if (marked) {
          // Load only this beoordelaar's marks for this team
          const punte = await fetchPuntePerRondte(activeRound.rondte_id);
          // filter for this team and beoordelaar's marks only
          const teamMarks = (punte || []).filter(p => 
            p.span_id === selectedTeam.span_id && p.beoordelaar_id === JSON.parse(localStorage.getItem('user')).id
          );
          const marksObject = teamMarks.reduce((acc, m) => ({ ...acc, [m.kriteria_id]: m.punt }), {});
          setMarks(marksObject);
        } else {
          setMarks({});
        }
      } catch (err) {
        setError('Kon nie bestaande punte laai nie: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadMarks();
  }, [selectedTeam, activeRound]);

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    setMarks({});
    setError(null);
  };

  const handleMarkChange = (kriteria_id, value) => {
    const kriterium = kriteria.find(k => (k.kriteria_id || k.id) === kriteria_id);
    if (!kriterium) {
      console.error('Could not find kriterium with id:', kriteria_id);
      return;
    }

    const numValue = parseInt(value, 10) || 0;
    if (numValue < 0 || numValue > kriterium.max_punte) {
      setError(`Punt moet tussen 0 en ${kriterium.max_punte} wees`);
      return;
    }

    setMarks(prev => ({
      ...prev,
      [kriteria_id]: numValue
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeam || !activeRound) return;

    try {
      setLoading(true);
      setError(null);

      const missingMarks = kriteria.some(k => marks[k.kriteria_id] === undefined);
      if (missingMarks) {
        throw new Error('Ken asseblief punte toe vir alle kriteria');
      }

      // submit or update marks via API
      await submitTeamMarks(activeRound.rondte_id, selectedTeam.span_id, marks);

      setSuccessMessage(hasMarked ? 'Punte suksesvol opgedateer' : 'Punte suksesvol gestoor');
      setHasMarked(true); // Update state to reflect that marks have been submitted
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedTeam) {
    return <div className="loading">Laai...</div>;
  }

  if (!activeRound) {
    return <div className="message">Geen aktiewe rondte beskikbaar nie</div>;
  }

  return (
    <div className="merk-container">
      <h1>Merkblad - {activeRound.naam}</h1>

      <TeamSelection 
        selectedTeam={selectedTeam}
        assignedTeams={assignedTeams}
        onTeamSelect={handleTeamSelect}
      />

      {selectedTeam && (
        <MarkingForm
          selectedTeam={selectedTeam}
          kriteria={kriteria}
          marks={marks}
          onMarkChange={handleMarkChange}
          onSubmit={handleSubmit}
          loading={loading}
          hasMarked={hasMarked}
        />
      )}

      <StatusMessages 
        error={error}
        successMessage={successMessage}
      />
    </div>
  );
};

export default Merk;