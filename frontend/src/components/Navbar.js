import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);
  const toggleNotif = () => setIsNotifOpen((prev) => !prev);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            💰 FinTracker
          </Link>
        </div>

        {/* Menu */}
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

                {/* 🔽 Shared Account Dropdown */}
                <div className="navbar-dropdown">
                  <button
                    className="navbar-link dropdown-toggle"
                    onClick={toggleDropdown}
                  >
                    🤝 Shared Account ▾
                  </button>

                  {isDropdownOpen && (
                    <div className="dropdown-menu">
                      <Link 
                        to="/add-members"
                        className={`dropdown-item ${isActive('/add-members') ? 'active' : ''}`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        👥 Create Group
                      </Link>
                      <Link 
                        to="/split-expense"
                        className={`dropdown-item ${isActive('/split-expense') ? 'active' : ''}`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        💸 Split Expense
                      </Link>
                      <Link 
                        to="/goal-savings"
                        className={`dropdown-item ${isActive('/goal-savings') ? 'active' : ''}`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        🎯 Goal-Based Savings
                      </Link>
                      <Link 
                        to="/contributions"
                        className={`dropdown-item ${isActive('/contributions') ? 'active' : ''}`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        💰 Contributions
                      </Link>
                    </div>
                  )}
                </div>

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

                {/* 🔔 Notifications Dropdown */}
                <div className="navbar-dropdown" style={{ marginLeft: 8 }}>
                  <button
                    className="navbar-link dropdown-toggle"
                    onClick={toggleNotif}
                  >
                    🔔 Notifications ▾
                  </button>

                  {isNotifOpen && (
                    <div className="dropdown-menu">
                      <Link
                        to="/settings/notifications#create"
                        className={`dropdown-item ${isActive('/settings/notifications') ? 'active' : ''}`}
                        onClick={() => setIsNotifOpen(false)}
                      >
                        ➕ Create Reminder
                      </Link>
                      <Link
                        to="/settings/notifications#notify"
                        className={`dropdown-item ${isActive('/settings/notifications') ? 'active' : ''}`}
                        onClick={() => setIsNotifOpen(false)}
                      >
                        📨 Create Notification
                      </Link>
                      <Link
                        to="/settings/notifications#reminders"
                        className={`dropdown-item ${isActive('/settings/notifications') ? 'active' : ''}`}
                        onClick={() => setIsNotifOpen(false)}
                      >
                        🗓️ Show Reminders
                      </Link>
                    </div>
                  )}
                </div>
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

          {/* User Section */}
          <div className="navbar-user">
            {isAuthenticated() ? (
              <div className="user-menu">
                <span className="user-name">👋 Hello, {user?.name || 'User'}</span>
                <button onClick={handleLogout} className="logout-btn">
                  🚪 Logout
                </button>
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="navbar-link">Login</Link>
                <Link to="/register" className="navbar-link register">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optional: Small inline styles for dropdown */}
      <style>{`
        .navbar-dropdown {
          position: relative;
          display: inline-block;
          color:white;
        }

        .dropdown-toggle {
          background: none;
          border: none;
          cursor: pointer;
          color: inherit;
          font: inherit;
          padding: 0;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border: 1px solid #ddd;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          border-radius: 6px;
          min-width: 200px;
          z-index: 100;
          display: flex;
          flex-direction: column;
        }

        .dropdown-item {
          padding: 10px 15px;
          color: #333;
          text-decoration: none;
          transition: background 0.2s ease;
        }

        .dropdown-item:hover {
          background: #f3f3f3;
        }

        .dropdown-item.active {
          background: #2196f3;
          color: white;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
