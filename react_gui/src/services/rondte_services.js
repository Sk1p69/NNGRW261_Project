// Import auth helper
import { authHeader } from './auth_service';

const API_BASE_URL = 'http://localhost:3000/beoordelaar';

// Helper function to handle API responses
const handleResponse = async (response) => {
    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            throw new Error(error.error);
        }
        throw new Error('Netwerk fout tydens versoek');
    }
    return response.json();
};

// Get current active round
export const getCurrentActiveRound = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/rondte/active`, {
            headers: {
                ...authHeader()
            }
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Error getting active round:', error);
        throw error;
    }
};

// Get all rounds
export const getAllRondtes = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/rondte`, {
            headers: {
                ...authHeader()
            }
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Error getting all rounds:', error);
        throw error;
    }
};

// Create new round
export const createRondte = async (data) => {
    try {
        const response = await fetch(`${API_BASE_URL}/rondte`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader()
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Error creating round:', error);
        throw error;
    }
};

// Update round
export const updateRondte = async (id, data) => {
    try {
        const response = await fetch(`${API_BASE_URL}/rondte/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader()
            },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Error updating round:', error);
        throw error;
    }
};

// Lock round and set advancing teams
export const sluitRondte = async (id, { winnaarSpanId, spanneToelaatVirVolgendeRondte }) => {
    try {
        const response = await fetch(`${API_BASE_URL}/rondte/${id}/sluit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader()
            },
            body: JSON.stringify({
                winnaarSpanId,
                spanneToelaatVirVolgendeRondte
            })
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Error locking round:', error);
        throw error;
    }
};

// Delete round
export const deleteRondte = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/rondte/${id}`, {
            method: 'DELETE'
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Error deleting round:', error);
        throw error;
    }
};

// Get non-eliminated teams
export const getNonEliminatedTeams = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/rondte/eligible-teams`);
        return handleResponse(response);
    } catch (error) {
        console.error('Error getting eligible teams:', error);
        throw error;
    }
};

// Get teams for a specific round
export const getTeamsForRound = async (rondteId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/rondte/${rondteId}/teams`);
        return handleResponse(response);
    } catch (error) {
        console.error('Error getting teams for round:', error);
        throw error;
    }
};

// Create merkblad for round
export const createRondteMerkblad = async (rondteId, kriteriaSelections) => {
    try {
        const response = await fetch(`${API_BASE_URL}/rondte/${rondteId}/merkblad`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kriteriaSelections })
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Error creating merkblad:', error);
        throw error;
    }
};

// Get merkblad for round
export const getRondteMerkblad = async (rondteId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/rondte/${rondteId}/merkblad`);
        return handleResponse(response);
    } catch (error) {
        console.error('Error fetching merkblad:', error);
        throw error;
    }
};

// Update merkblad for round
export const updateRondteMerkblad = async (rondteId, kriteriaSelections) => {
    try {
        const response = await fetch(`${API_BASE_URL}/rondte/${rondteId}/merkblad`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kriteriaSelections })
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Error updating merkblad:', error);
        throw error;
    }
};