const API_BASE_URL = 'http://localhost:3000/beoordelaar';

const handleResponse = async (response, endpoint) => {
    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            throw new Error(error.error || `Error calling ${endpoint}`);
        } else {
            const text = await response.text();
            throw new Error(`Server error calling ${endpoint}: ${text}`);
        }
    }
    const data = await response.json();
    console.log(`Response from ${endpoint}:`, data);
    return data;
};

// Get competition settings
export const getCompetitionSettings = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return await handleResponse(response, '/settings');
    } catch (error) {
        console.error('Error in getCompetitionSettings:', error);
        throw error;
    }
};

// Get all competition settings
export const getAllCompetitionSettings = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/all`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error in getAllCompetitionSettings:', error);
        throw error;
    }
};

// Delete competition settings
export const deleteCompetitionSettings = async (settingId) => {
    const response = await fetch(`${API_BASE_URL}/settings/${settingId}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Could not delete competition settings');
    return await response.json();
};

// Update competition settings
export const updateCompetitionSettings = async (settings) => {
    const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Could not update competition settings');
    return await response.json();
};

// Update team academic mark
export const updateTeamAcademicMark = async (teamId, mark) => {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/mark`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark })
    });
    if (!response.ok) throw new Error('Could not update team academic mark');
    return await response.json();
};

// Get teams sorted by academic mark
export const getTeamsByAcademicMark = async () => {
    try {
        console.log('Fetching teams by academic mark...');
        const response = await fetch(`${API_BASE_URL}/teams/academic`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return await handleResponse(response, 'getTeamsByAcademicMark');
    } catch (error) {
        console.error('Error in getTeamsByAcademicMark:', error);
        throw error;
    }
};

// Eliminate teams
export const eliminateTeams = async () => {
    const response = await fetch(`${API_BASE_URL}/teams/eliminate`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Could not eliminate teams');
    return await response.json();
};

// Assign teams to groups
export const assignTeamsToGroups = async () => {
    const response = await fetch(`${API_BASE_URL}/teams/groups`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Could not assign teams to groups');
    return await response.json();
};

// Assign assessors to teams
export const assignAssessorsToTeams = async () => {
    const response = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Could not assign assessors to teams');
    return await response.json();
};

// Get assignments for an assessor
export const getAssessorAssignments = async (assessorId) => {
    const response = await fetch(`${API_BASE_URL}/assignments/${assessorId}`);
    if (!response.ok) throw new Error('Could not fetch assessor assignments');
    return await response.json();
};

// Get active teams count
export const getActiveTeamsCount = async () => {
    const response = await fetch(`${API_BASE_URL}/teams/active/count`);
    if (!response.ok) throw new Error('Could not get active teams count');
    return await response.json();
};

