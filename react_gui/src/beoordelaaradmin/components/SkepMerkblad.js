import React, { useState, useEffect } from 'react';
import { fetchAllKriteria } from '../../services/merk_services';
import { createRondteMerkblad } from '../../services/rondte_services';
import './SkepMerkblad.css';

function SkepMerkblad({ roundId }) {
    const [kriteria, setKriteria] = useState([]);
    const [selectedKriteria, setSelectedKriteria] = useState([]);
    const [kriteriaMaxPoints, setKriteriaMaxPoints] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadKriteria();
    }, []);

    const loadKriteria = async () => {
        try {
            const data = await fetchAllKriteria();
            setKriteria(data);
        } catch (err) {
            setError('Kon nie kriteria laai nie: ' + err.message);
        }
    };

    const handleKriteriaToggle = (kriteriumId) => {
        setSelectedKriteria(prev => {
            if (prev.includes(kriteriumId)) {
                return prev.filter(id => id !== kriteriumId);
            } else {
                return [...prev, kriteriumId];
            }
        });
    };

    const handleMaxPointsChange = (kriteriumId, points) => {
        setKriteriaMaxPoints(prev => ({
            ...prev,
            [kriteriumId]: points
        }));
    };

    const handleCreateMerkblad = async () => {
        try {
            if (selectedKriteria.length === 0) {
                setError('Kies ten minste een kriterium');
                return;
            }

            const kriteriaSelections = selectedKriteria.map(k => ({
                kriteria_id: k,
                max_punte: parseInt(kriteriaMaxPoints[k] || 10, 10), // default to 10 if not set, ensure it's a number
                gewig: 1.0 // Default weight
            }));

            await createRondteMerkblad(roundId, kriteriaSelections);
            setSuccess('Merkblad suksesvol geskep!');
            setError('');
        } catch (err) {
            setError('Kon nie merkblad skep nie: ' + err.message);
            setSuccess('');
        }
    };

    return (
        <div className="skep-merkblad">
            <h3>Skep Merkblad</h3>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="kriteria-list">
                {kriteria.map(kriterium => (
                    <div key={kriterium.kriteria_id} className="kriterium-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedKriteria.includes(kriterium.kriteria_id)}
                                onChange={() => handleKriteriaToggle(kriterium.kriteria_id)}
                            />
                            {kriterium.beskrywing}
                        </label>
                        {selectedKriteria.includes(kriterium.kriteria_id) && (
                            <input
                                type="number"
                                value={kriteriaMaxPoints[kriterium.kriteria_id] || ''}
                                onChange={(e) => handleMaxPointsChange(kriterium.kriteria_id, e.target.value)}
                                placeholder="Punte"
                                min="1"
                                className="points-input"
                            />
                        )}
                    </div>
                ))}
            </div>

            <button 
                onClick={handleCreateMerkblad} 
                disabled={selectedKriteria.length === 0}
            >
                Skep Merkblad
            </button>
        </div>
    );
}

export default SkepMerkblad;