import React, { useState, useEffect } from 'react';
import './MerkAdmin.css'; // import CSS
import {
  fetchAllKriteria,
  createKriteria,
  updateKriteria,
  deleteKriteria
} from '../services/merk_services';

function MerkAdmin() {
  // ------------------- Kriteria state -------------------
  const [kriteria, setKriteria] = useState([]);
  const [newKriteria, setNewKriteria] = useState({ beskrywing: '', default_totaal: '', merk_gids: '' });
  const [editKriteriaId, setEditKriteriaId] = useState(null);
  const [editKriteriaData, setEditKriteriaData] = useState({ beskrywing: '', default_totaal: '', merk_gids: '' });

  // ------------------- Hooks -------------------
  useEffect(() => {
    refreshKriteria();
  }, []);

  const refreshKriteria = () => {
    fetchAllKriteria().then(setKriteria).catch(() => setKriteria([]));
  };

  // ------------------- CRUD handlers -------------------
  const handleCreateKriteria = async e => {
    e.preventDefault();
    try {
      await createKriteria({
        beskrywing: newKriteria.beskrywing,
        default_totaal: parseInt(newKriteria.default_totaal, 10),
        merk_gids: newKriteria.merk_gids
      });
      setNewKriteria({ beskrywing: '', default_totaal: '', merk_gids: '' });
      refreshKriteria();
    } catch {
      alert('Kon nie kriteria skep nie');
    }
  };

  const handleEditKriteria = async e => {
    e.preventDefault();
    try {
      await updateKriteria(editKriteriaId, {
        beskrywing: editKriteriaData.beskrywing,
        default_totaal: parseInt(editKriteriaData.default_totaal, 10),
        merk_gids: editKriteriaData.merk_gids
      });
      setEditKriteriaId(null);
      setEditKriteriaData({ beskrywing: '', default_totaal: '', merk_gids: '' });
      refreshKriteria();
    } catch {
      alert('Kon nie kriteria opdateer nie');
    }
  };

  const handleDeleteKriteria = async id => {
    if (!window.confirm('Is jy seker jy wil hierdie kriteria verwyder?')) return;
    try {
      await deleteKriteria(id);
      refreshKriteria();
    } catch {
      alert('Kon nie kriteria verwyder nie');
    }
  };

  return (
    <div>
      <h1>Merk Admin</h1>
      <p>Hier kan jy merk-kriteria bestuur.</p>

      {/* ------------------- Kriteria ------------------- */}
      <h2>Skep nuwe kriteria</h2>
      <form onSubmit={handleCreateKriteria}>
        <div className="form-row">
          <label>Kriteria beskrywing:</label>
          <input
            name="beskrywing"
            value={newKriteria.beskrywing}
            onChange={e => setNewKriteria({ ...newKriteria, beskrywing: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <label>Default totaal:</label>
          <input
            name="default_totaal"
            type="number"
            value={newKriteria.default_totaal}
            onChange={e => setNewKriteria({ ...newKriteria, default_totaal: e.target.value })}
            required
          />
        </div>
        <div className="form-row">
          <label>Merkgids:</label>
          <input
            name="merk_gids"
            value={newKriteria.merk_gids}
            onChange={e => setNewKriteria({ ...newKriteria, merk_gids: e.target.value })}
            rows="4"
          />
        </div>
        <div className="form-row">
          <button type="submit" className="btn-brown">Voeg kriteria by</button>
        </div>
      </form>

      <h2>Bestaande kriteria</h2>
      <table>
        <thead>
          <tr>
            <th>Beskrywing</th>
            <th>Default Totaal</th>
            <th>Merk Gids</th>
            <th>Aksies</th>
          </tr>
        </thead>
        <tbody>
          {kriteria.map(k => (
            <tr key={k.kriteria_id}>
              {editKriteriaId === k.kriteria_id ? (
                <>
                  <td>
                    <input
                      value={editKriteriaData.beskrywing}
                      onChange={e => setEditKriteriaData({ ...editKriteriaData, beskrywing: e.target.value })}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={editKriteriaData.default_totaal}
                      onChange={e => setEditKriteriaData({ ...editKriteriaData, default_totaal: e.target.value })}
                      required
                    />
                  </td>
                  <td>
                    <textarea
                      value={editKriteriaData.merk_gids}
                      onChange={e => setEditKriteriaData({ ...editKriteriaData, merk_gids: e.target.value })}
                      rows="4"
                    />
                  </td>
                  <td>
                    <button className="btn-brown" onClick={handleEditKriteria}>Stoor</button>
                    <button className="btn-navy" type="button" onClick={() => setEditKriteriaId(null)}>Kanselleer</button>
                  </td>
                </>
              ) : (
                <>
                  <td><b>{k.beskrywing}</b></td>
                  <td>{k.default_totaal}</td>
                  <td style={{ whiteSpace: 'pre-line' }}>{k.merk_gids}</td>
                  <td>
                    <button
                      className="btn-brown"
                      onClick={() => {
                        setEditKriteriaId(k.kriteria_id);
                        setEditKriteriaData({ 
                          beskrywing: k.beskrywing, 
                          default_totaal: k.default_totaal,
                          merk_gids: k.merk_gids
                        });
                      }}
                    >
                      Wysig
                    </button>
                    <button
                      className="btn-navy"
                      onClick={() => handleDeleteKriteria(k.kriteria_id)}
                    >
                      Verwyder
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MerkAdmin;
