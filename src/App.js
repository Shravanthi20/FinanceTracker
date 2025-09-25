import './App.css';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadData from './pages/UploadData';
import Home from './pages/Home';
import Logout from './pages/Logout';

function isAuthenticated() {
  try {
    return Boolean(localStorage.getItem('token'));
  } catch {
    return false;
  }
}

function RequireAuth({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const authed = isAuthenticated();
  return (
    <div className="container">
      <nav className="navbar">
        <Link className="navlink" to="/">Home</Link>
        {!authed && <Link className="navlink" to="/login">Login</Link>}
        {!authed && <Link className="navlink" to="/register">Register</Link>}
        {authed && <Link className="navlink" to="/upload">Upload</Link>}
        {authed && <Link className="navlink" to="/logout">Logout</Link>}
      </nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/upload"
          element={
            <RequireAuth>
              <UploadData />
            </RequireAuth>
          }
        />
        <Route path="/logout" element={<Logout />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;
