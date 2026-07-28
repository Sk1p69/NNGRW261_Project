import React, { useState, useEffect } from 'react';
import {
  getCompetitionSettings,
  getTeamsByAcademicMark
} from "../services/competition_services";
import KompetisieInstellings from './components/KompetisieInstellings';
import BestuurSpanne from './components/BestuurSpanne';
import BestuurRondtes from './components/BestuurRondtes';
import GroupManagement from './components/GroupManagement';
import './BeoordelaarAdmin.css';

const BeoordelaarAdmin = () => {
  const [settings, setSettings] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const settingsData = await getCompetitionSettings();
      setSettings(settingsData);

      if (settingsData && settingsData.required_teams > 0) {
        const teamsData = await getTeamsByAcademicMark();
        setTeams(teamsData);
      }
      
      setLoading(false);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error loading data: ' + err.message });
      setLoading(false);
    }
  };

  const handleSettingsUpdate = (updatedSettings) => {
    setSettings(updatedSettings);
    loadInitialData();
  };



  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Laai data...</p>
      </div>
    );
  }

  return (
    <div className="beoordelaar-admin">
      <h1>Beoordelaar Admin</h1>

      {statusMessage && (
        <div className={`message ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      {/* Competition Settings */}
      <KompetisieInstellings 
        settings={settings}
        onSettingsUpdate={handleSettingsUpdate}
      />

      {/* Team Management - only show if settings exist */}
      {settings && settings.required_teams > 0 ? (
        teams.length >= settings.required_teams ? (
          <>
            <BestuurSpanne teams={teams} />
            {/* Group Management - now under BestuurSpanne */}
            <div className="section">
              <GroupManagement />
            </div>
          </>
        ) : (
          <div className="warning-message">
            Skep eers alle spanne ({teams.length}/{settings.required_teams} spanne geskep)
          </div>
        )
      ) : (
        <div className="info-message">
          Skep eers kompetisie instellings
        </div>
      )}

      {/* Rounds Management - only show if settings exist and enough teams */}
      {settings && settings.required_teams > 0 && teams.length >= settings.required_teams && (
        <BestuurRondtes />
      )}
    </div>
  );
};

export default BeoordelaarAdmin;