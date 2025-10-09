import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            💰 FinTracker
          </Link>
        </div>
        
        <div className="navbar-menu">
          <div className="navbar-nav">
            {isAuthenticated() ? (
              <>
                <Link 
                  to="/upload" 
                  className={`navbar-link ${isActive('/upload') ? 'active' : ''}`}
                >
                  📊 Data Management
                </Link>
                <Link 
                  to="/add-members" 
                  className={`navbar-link ${isActive('/add-members') ? 'active' : ''}`}
                >
                  👥 Add Members
                </Link>
                <Link 
                  to="/split-expense" 
                  className={`navbar-link ${isActive('/split-expense') ? 'active' : ''}`}
                >
                  💸 Split Expense
                </Link>
                <Link 
                  to="/invoices" 
                  className={`navbar-link ${isActive('/invoices') ? 'active' : ''}`}
                >
                  📄 Invoices
                </Link>
                <Link 
                  to="/reports" 
                  className={`navbar-link ${isActive('/reports') ? 'active' : ''}`}
                >
                  📈 Reports
                </Link>
                <Link 
                  to="/forecast" 
                  className={`navbar-link ${isActive('/forecast') ? 'active' : ''}`}
                >
                  🤖 Forecast
                </Link>
                <Link 
                  to="/settings/notifications"
                  className={`navbar-link ${isActive('/settings/notifications') ? 'active' : ''}`}
                >
                  🔔 Notifications
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`navbar-link ${isActive('/login') ? 'active' : ''}`}
                >
                  🔐 Login
                </Link>
                <Link 
                  to="/register" 
                  className={`navbar-link ${isActive('/register') ? 'active' : ''}`}
                >
                  📝 Register
                </Link>
              </>
            )}
          </div>
          
          <div className="navbar-user">
            {isAuthenticated() ? (
              <div className="user-menu">
                <span className="user-name">
                  👋 Hello, {user?.name || 'User'}
                </span>
                <button 
                  onClick={handleLogout}
                  className="logout-btn"
                >
                  🚪 Logout
                </button>
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="navbar-link">
                  Login
                </Link>
                <Link to="/register" className="navbar-link register">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
