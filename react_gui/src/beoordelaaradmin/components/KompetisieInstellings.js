import React, { useState, useEffect } from 'react';
import { updateCompetitionSettings, getAllCompetitionSettings, deleteCompetitionSettings } from '../../services/competition_services';

function KompetisieInstellings({ settings, onSettingsUpdate }) {
  const [formData, setFormData] = useState({
    required_assessors: settings?.required_assessors || 0,
    required_teams: settings?.required_teams || 0,
    total_time_minutes: settings?.total_time_minutes || 0,
    time_per_team: settings?.time_per_team || "20",
    max_teams: settings?.max_teams || 0,
    teams_to_eliminate: settings?.teams_to_eliminate || 0
  });
  const [savedSettings, setSavedSettings] = useState([]);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadSavedSettings();
  }, []);

  const loadSavedSettings = async () => {
    try {
      console.log('Loading saved settings...');
      const allSettings = await getAllCompetitionSettings();
      console.log('Received settings:', allSettings);
      if (Array.isArray(allSettings)) {
        setSavedSettings(allSettings);
      } else {
        console.error('Unexpected settings format:', allSettings);
        setError("Kon nie gestoorde instellings laai nie: Onverwagse data formaat");
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError("Kon nie gestoorde instellings laai nie: " + err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const calculateTeamsAndGroups = () => {
    const { total_time_minutes, time_per_team, required_assessors } = formData;
    
      // Calculate teams per group based on time constraints
      const teamsPerGroup = Math.floor(total_time_minutes / parseInt(time_per_team));
      
      // Total possible teams with both groups
      const totalPossibleTeams = teamsPerGroup * 2;
      
      // Teams that need to be eliminated
      const teamsToEliminate = Math.max(0, formData.required_teams - totalPossibleTeams);
      
      // Check if we have enough assessors for two groups
      const assessorsPerGroup = Math.ceil(required_assessors / 2);    return {
      teamsPerGroup,
      totalPossibleTeams,
      teamsToEliminate,
      assessorsPerGroup
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      // Validate inputs
      if (formData.required_assessors < 2) {
        setError("Ten minste 2 beoordelaars word benodig vir 2 groepe");
        return;
      }

      if (formData.required_teams < 1) {
        setError("Spesifiseer die totale aantal spanne");
        return;
      }

      if (formData.total_time_minutes < 60) {
        setError("Totale tyd moet ten minste 60 minute wees");
        return;
      }

      const { totalPossibleTeams } = calculateTeamsAndGroups();
      
      // Update the max_teams based on calculations
      const updatedSettings = {
        ...formData,
        max_teams: totalPossibleTeams
      };

      await updateCompetitionSettings(updatedSettings);
      await loadSavedSettings(); // Reload the settings list
      setSuccessMessage("Kompetisie instellings suksesvol opgedateer");
      onSettingsUpdate(updatedSettings);
    } catch (err) {
      setError(err.message || "Kon nie instellings opdateer nie");
    }
  };

  const handleSettingSelect = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "") {
      setSelectedSetting(null);
      setFormData({
        required_assessors: 0,
        required_teams: 0,
        total_time_minutes: 0,
        time_per_team: "20",
        max_teams: 0,
        teams_to_eliminate: 0
      });
    } else {
      const setting = savedSettings.find(s => s.settings_id === parseInt(selectedId));
      setSelectedSetting(setting);
      setFormData(setting);
    }
  };

  const handleDeleteSetting = async (settingId) => {
    try {
      await deleteCompetitionSettings(settingId);
      await loadSavedSettings();
      setSuccessMessage("Instelling suksesvol verwyder");
      if (selectedSetting?.settings_id === settingId) {
        setSelectedSetting(null);
        setFormData({
          required_assessors: 0,
          required_teams: 0,
          total_time_minutes: 0,
          time_per_team: "20",
          max_teams: 0,
          teams_to_eliminate: 0
        });
      }
    } catch (err) {
      setError("Kon nie instelling verwyder nie: " + err.message);
    }
  };

  const { teamsPerGroup, totalPossibleTeams, teamsToEliminate, assessorsPerGroup } = calculateTeamsAndGroups();

  return (
    <div className="kompetisie-instellings">
      <h2>Kompetisie Instellings</h2>
      
      {error && (
        <div className="error-message" style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '4px' }}>
          <strong>Fout:</strong> {error}
        </div>
      )}
      {successMessage && (
        <div className="success-message" style={{ padding: '10px', marginBottom: '10px', backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '4px' }}>
          {successMessage}
        </div>
      )}

      <div className="settings-selector">
        <label>Kies Gestoorde Instelling:</label>
        <select 
          value={selectedSetting?.settings_id || ""} 
          onChange={handleSettingSelect}
          className="settings-dropdown"
        >
          <option value="">Nuwe Instelling</option>
          {savedSettings.map(setting => (
            <option key={setting.settings_id} value={setting.settings_id}>
              {`${setting.required_teams} Spanne, ${setting.required_assessors} Beoordelaars, ${setting.total_time_minutes} Min`}
            </option>
          ))}
        </select>
        {selectedSetting && (
          <button 
            type="button" 
            onClick={() => handleDeleteSetting(selectedSetting.settings_id)}
            className="delete-button"
          >
            Verwyder Instelling
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Aantal Beoordelaars:</label>
          <input
            type="number"
            name="required_assessors"
            value={formData.required_assessors}
            onChange={handleInputChange}
            min="2"
          />
          <small>Minimum 2 beoordelaars word benodig (1 per groep)</small>
        </div>

        <div className="form-group">
          <label>Totale Aantal Spanne:</label>
          <input
            type="number"
            name="required_teams"
            value={formData.required_teams}
            onChange={handleInputChange}
            min="1"
          />
          <small>Die totale aantal spanne wat aan die kompetisie gaan deelneem</small>
        </div>

        <div className="form-group">
          <label>Totale Tyd (minute):</label>
          <input
            type="number"
            name="total_time_minutes"
            value={formData.total_time_minutes}
            onChange={handleInputChange}
            min="60"
          />
        </div>

        <div className="form-group">
          <label>Tyd per Span (minute):</label>
          <select 
            name="time_per_team"
            value={formData.time_per_team}
            onChange={handleInputChange}
          >
            <option value="20">20 minute</option>
            <option value="30">30 minute</option>
          </select>
        </div>

        <div className="calculation-summary">
          <h3>Berekende Waardes:</h3>
          <p>Spanne per groep: {teamsPerGroup}</p>
          <p>Totale moontlike spanne: {totalPossibleTeams}</p>
          <p>Spanne om te elimineer: {teamsToEliminate}</p>
          <p>Beoordelaars per groep: {assessorsPerGroup}</p>
        </div>

        <button type="submit" className="primary-button">
          Stoor Instellings
        </button>
      </form>
    </div>
  );
}

export default KompetisieInstellings;