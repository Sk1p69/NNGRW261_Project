import React from 'react';  

const StatusMessages = ({ error, successMessage }) => {
  return (
    <>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
    </>
  );
};

export default StatusMessages;