export const API_BASE_URL = 'http://localhost:3000';

// Lock a round and calculate results
export async function lockRound(rondte_id) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/rounds/${rondte_id}/lock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kon nie rondte sluit nie');
    }

    return await response.json();
}

// Get results for a round
export async function getRoundResults(rondte_id) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/rounds/${rondte_id}/results`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kon nie rondte resultate kry nie');
    }

    return await response.json();
}

export function getAuthToken() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) {
        throw new Error('Nie aangeteken nie');
    }
    return user.token;
}

// Get the current active round
export async function getCurrentActiveRound() {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/active-round`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Kon nie aktiewe rondte kry nie');
    return await response.json();
}

// Get all assigned teams for the logged-in assessor
export async function getMyAssignedTeams() {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/my-teams`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Kon nie toegewysde spanne kry nie');
    return await response.json();
}

// Submit marks for a team
export async function submitMarks(data) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/submit-marks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Kon nie punte stoor nie');
    }
    return await response.json();
}

// Get marks for a specific team
export async function getMarks(rondte_id, span_id) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/marks/${rondte_id}/${span_id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Kon nie punte laai nie');
    return await response.json();
}

// Get criteria for current round
export async function getRondteKriteria(rondte_id) {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/rondte/${rondte_id}/kriteria`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error('Kon nie kriteria laai nie');
    return await response.json();
}