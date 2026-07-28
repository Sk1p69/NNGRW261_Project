import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MerkAdmin from './merkadmin/merkadmin';
import BeoordelaarAdmin from './beoordelaaradmin/beoordelaaradmin';
import Merk from './merk/merk';
import SpanAdmin from './spanadmin/spanadmin';
import Aanteken from './components/Aanteken';
import { getCurrentUser } from './services/auth_service';

function NavBar() {
  const user = getCurrentUser();
  const currentPath = window.location.pathname;
  
  // Don't show navbar on login page
  if (currentPath === '/aanteken') {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = "/aanteken";
  };

  function route(path) {
    window.location.href = "/" + path;
  }
  
  return (
    <div className="navbar">
      {user?.user.role === 'admin' && (
        <>
          <div className="nav-item" onClick={() => route("spanadmin")}>
            Span Admin
          </div>
          <div className="nav-item" onClick={() => route("merkadmin")}>
            Merk Admin
          </div>
          <div className="nav-item" onClick={() => route("beoordelaaradmin")}>
            Beoordelaar Admin
          </div>
        </>
      )}
      
      {user?.user.role === 'beoordelaar' && (
        <div className="nav-item" onClick={() => route("merk")}>
          Merk
        </div>
      )}
      
      <div className="nav-item" onClick={handleLogout}>
        Teken Uit
      </div>
    </div>
  );
}

function App() {
  const ProtectedRoute = ({ children, allowedRole }) => {
    const user = getCurrentUser();
    
    if (!user) {
      return <Navigate to="/aanteken" />;
    }

    if (allowedRole && user.user.role !== allowedRole) {
      return <Navigate to="/" />;
    }

    return children;
  };

  return (
    <Router>
      <div className="App">
        {getCurrentUser() && <NavBar />}
        <Routes>
          <Route path="/aanteken" element={<Aanteken />} />
          <Route path="/" element={<Navigate to="/aanteken" />} />
          
          <Route 
            path="/merkadmin" 
            element={
              <ProtectedRoute allowedRole="admin">
                <MerkAdmin />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/beoordelaaradmin" 
            element={
              <ProtectedRoute allowedRole="admin">
                <BeoordelaarAdmin />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/merk" 
            element={
              <ProtectedRoute allowedRole="beoordelaar">
                <Merk />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/spanadmin" 
            element={
              <ProtectedRoute allowedRole="admin">
                <SpanAdmin />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;