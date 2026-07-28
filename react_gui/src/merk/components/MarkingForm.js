import React from 'react';
import KriteriaTable from './KriteriaTable';

const MarkingForm = ({ selectedTeam, kriteria, marks, onMarkChange, onSubmit, loading, hasMarked }) => {
  return (
    <form onSubmit={onSubmit} className="marking-form">
      <h2>Merk Span: {selectedTeam.naam}</h2>
      <p className="form-status">
        {hasMarked ? 'Wysig bestaande punte vir span' : 'Ken nuwe punte toe vir span'}
      </p>
      
      <KriteriaTable 
        kriteria={kriteria}
        marks={marks}
        onMarkChange={onMarkChange}
        readOnly={loading}
      />

      <div className="form-footer">
        {hasMarked && (
          <p className="edit-notice">
            Let wel: U kan hierdie punte slegs een keer toeken. Maak seker dat alle punte korrek is voor u dit indien.
          </p>
        )}
        <button 
          type="submit" 
          className="submit-button"
          disabled={loading || !selectedTeam}
        >
          {hasMarked ? 'Opdateer Punte' : 'Stoor Punte'}
        </button>
      </div>
    </form>
  );
};

export default MarkingForm;