export const API_BASE_URL = 'http://localhost:3000';

const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.token) {
    throw new Error('Nie aangeteken nie. Teken asseblief weer aan.');
  }
  return user.token;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ==================== PUNTE / MERK ====================

// Fetch all merkblads
export const fetchAllMerkblads = async () => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/beoordelaar/merkblads`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Kon nie merkblaaie laai nie');
  return await response.json();
};

// Legacy punte submission - will be deprecated
export async function stuurPunte(punteData) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/merk/punte`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(punteData)
  });
  if (!response.ok) throw new Error("Kon nie punte stuur nie");
  return await response.json();
}

// Subscribe to realtime point updates
export function subscribeToStream(onMessage) {
  const realtimeService = require('./realtime/realtime_service').default;
  return realtimeService.subscribe('point_update', onMessage);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ==================== KRITERIA ====================

export const fetchAllKriteria = async () => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/kriteria`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Kon nie kriteria laai nie');
  return await response.json();
};

export const fetchKriteriaById = async (id) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/kriteria/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Kon nie kriteria laai nie');
  return await response.json();
};

export const createKriteria = async (data) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/kriteria`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Kon nie kriteria skep nie');
  return await response.json();
};

export const updateKriteria = async (id, data) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/kriteria/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Kon nie kriteria opdateer nie');
  return await response.json();
};

export const deleteKriteria = async (id) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/kriteria/${id}`, { 
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Kon nie kriteria verwyder nie');
  return await response.json();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ==================== RONDTES EN MERK ====================

// Get available rounds for marking
export const fetchAvailableRounds = async () => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/beoordelaar/rounds/available`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Kon nie beskikbare rondtes laai nie');
  return await response.json();
};

// Get merkblad for a specific round
export const fetchRoundMerkblad = async (roundId) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/beoordelaar/rounds/${roundId}/merkblad`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Kon nie rondte se merkblad laai nie');
  }
  return await response.json();
};

// Get available teams for marking in a round
export const fetchAvailableTeams = async (roundId) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/beoordelaar/rounds/${roundId}/teams`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Kon nie beskikbare spanne laai nie');
  return await response.json();
};

// Submit marks for a team in a round
export const submitTeamMarks = async (roundId, teamId, marks) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/beoordelaar/rounds/${roundId}/teams/${teamId}/marks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ marks })
  });
  if (!response.ok) throw new Error('Kon nie punte indien nie');
  return await response.json();
};

// Check if assessor has already marked a team in a round
export const hasMarkedTeam = async (roundId, teamId) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/beoordelaar/rounds/${roundId}/teams/${teamId}/marked`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Kon nie merk status nagaan nie');
  return await response.json();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ==================== RONDTES ====================

export const fetchAllRondtes = async () => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rondtes`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Kon nie rondtes laai nie');
  return await response.json();
};

export const createRondte = async (data) => {
  const safeData = {
    is_eerste: data.is_eerste ?? 0,
    is_laaste: data.is_laaste ?? 0,
    is_gesluit: data.is_gesluit ?? 0,
    max_spanne: parseInt(data.max_spanne, 10) || 0,
  };

  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rondtes`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(safeData),
  });

  if (!response.ok) throw new Error('Kon nie rondte skep nie');
  return await response.json();
};

export const updateRondte = async (id, data) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rondtes/${id}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Kon nie rondte opdateer nie');
  return await response.json();
};

export const deleteRondte = async (id) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rondtes/${id}`, { 
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Kon nie rondte verwyder nie');
  return await response.json();
};

export const sluitRondte = async (rondteId) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rondtes/${rondteId}/sluit`, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error("Kon nie rondte sluit nie");
  return await response.json();
};

export const fetchPuntePerRondte = async (rondteId) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rondtes/${rondteId}/punte`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error("Kon nie punte laai nie");
  return await response.json();
};

export const berekenWenner = async (rondteId) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rondtes/${rondteId}/wenner`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error("Kon nie wenner bereken nie");
  return await response.json();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ==================== SPANNE ====================

export const fetchTeams = async () => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/teams`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error("Kon nie spanne laai nie");
  return await response.json();
};