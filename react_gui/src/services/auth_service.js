import axios from 'axios';

const API_URL = 'http://localhost:3000/auth';

export const login = async (username, password) => {
    try {
        console.log('Attempting login with:', { username });  // Debug logging (don't log password)
        
        const response = await axios.post(`${API_URL}/login`, {
            username,
            password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Login response:', response.data);  // Debug logging
        
        if (!response.data || !response.data.token) {
            throw new Error('Ongeldige antwoord van die bediener');
        }
        
        return response.data;
    } catch (error) {
        console.error('Login error:', error.response || error);  // Debug logging
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Kon nie aanmeld nie. Probeer asseblief weer.');
    }
};

export const logout = () => {
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

export const authHeader = () => {
    const user = getCurrentUser();
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};