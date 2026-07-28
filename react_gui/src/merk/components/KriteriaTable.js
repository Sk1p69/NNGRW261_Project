import React from 'react';

const KriteriaTable = ({ kriteria, marks, onMarkChange, readOnly }) => {
  return (
    <table className="criteria-table">
      <thead>
        <tr>
          <th>Kriteria</th>
          <th>Maksimum Punte</th>
          <th>Toegekende Punt</th>
        </tr>
      </thead>
      <tbody>
        {(kriteria || []).map(k => {
          const kriteriaId = k.kriteria_id || k.id;
          return (
            <tr key={kriteriaId}>
              <td>
                {k.beskrywing}
                {k.merk_gids && (
                  <div className="merk-gids">
                    <strong>Merk Gids:</strong>
                    <pre>{k.merk_gids}</pre>
                  </div>
                )}
              </td>
              <td>{k.max_punte}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  max={k.max_punte}
                  value={marks[kriteriaId] || ""}
                  onChange={(e) => onMarkChange(kriteriaId, e.target.value)}
                  disabled={readOnly}
                  required
                  className={readOnly ? 'input-readonly' : ''}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default KriteriaTable;