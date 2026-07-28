// frontend/src/services/span_services.js
const API_BASE_URL = 'http://localhost:3000';

// ===== TEAMS =====
export const addTestTeams = async () => {
  const response = await fetch(`${API_BASE_URL}/teams/test`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error("Failed to add test teams");
  return await response.json();
};

export const fetchTeams = async () => {
  const response = await fetch(`${API_BASE_URL}/teams`);
  if (!response.ok) throw new Error("Failed to fetch teams");
  return await response.json();
};

export const fetchActiveTeams = async () => {
  const teams = await fetchTeams();
  return teams.filter(team => !team.is_eliminated);
};

export const fetchTeam = async (teamId) => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}`);
  if (!response.ok) throw new Error("Failed to fetch team");
  return await response.json();
};

export const fetchTeamMembers = async (teamId) => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`);
  if (!response.ok) throw new Error("Failed to fetch team members");
  return await response.json();
};

export const fetchTeamWithMembers = async (teamId) => {
  const [team, members] = await Promise.all([
    fetchTeam(teamId),
    fetchTeamMembers(teamId),
  ]);
  return { team, members };
};

// ===== CREATE / UPDATE / DELETE =====

export const createTeam = async (naam, projek_beskrywing, span_bio, logo, academic_mark) => {
  const res = await fetch(`${API_BASE_URL}/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ naam, projek_beskrywing, span_bio, logo, academic_mark }),
  });
  return await res.json();
};

export const updateTeam = async (teamId, data) => {
  console.log('Making update request:', { teamId, data }); // Debug log
  const res = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Update failed:', errorData); // Debug log
    throw new Error(errorData.error || 'Failed to update team');
  }
  return await res.json();
};

export const updateTeamAcademicMark = async (teamId, mark) => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/academic-mark`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mark: parseFloat(mark) })
  });
  if (!response.ok) throw new Error('Could not update academic mark');
  return await response.json();
};

export const deleteTeam = async (teamId) => {
  const res = await fetch(`${API_BASE_URL}/teams/${teamId}`, { method: "DELETE" });
  return await res.json();
};

// Lid skep
export const createMember = async (teamId, naam, bio, foto) => {
  const res = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ naam, bio, foto }),
  });
  return await res.json();
};

// Lid update
export const updateMember = async (teamId, memberId, naam, bio, foto) => {
  const res = await fetch(`${API_BASE_URL}/teams/${teamId}/members/${memberId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ naam, bio, foto }),
  });
  return await res.json();
};


export const deleteMember = async (teamId, memberId) => {
  const res = await fetch(`${API_BASE_URL}/teams/${teamId}/members/${memberId}`, {
    method: "DELETE",
  });
  return await res.json();
};
