import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth_service';
import './Aanteken.css';

const Aanteken = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await login(username, password);
            console.log('Login response:', response);  // Debug logging
            
            if (!response || !response.token) {
                throw new Error('Ongeldige antwoord van die bediener');
            }

            // Store the entire response as user data
            localStorage.setItem('user', JSON.stringify(response));
            
            // Navigate based on user role
            const userRole = response.user?.role;
            if (userRole === 'admin') {
                navigate('/merkadmin');
            } else if (userRole === 'beoordelaar') {
                navigate('/merk');
            } else {
                throw new Error('Ongeldige gebruikersrol');
            }
        } catch (error) {
            console.error('Login error:', error);  // Debug logging
            setError(error.message || 'Aanmelding het misluk');
        }
    };

    return (
        <div className="aanteken-container">
            <div className="aanteken-box">
                <h2>Teken Aan</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="username">Gebruikersnaam:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Wagwoord:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="aanteken-button">
                        Teken Aan
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Aanteken;