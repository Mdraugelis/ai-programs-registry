import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onSidebarToggle}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">AI Atlas</h1>
        </Link>
      </div>

      <nav className="hidden md:flex items-center space-x-6">
        <Link
          to="/initiatives"
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          Initiatives
        </Link>
        <Link
          to="/initiatives/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 font-medium"
        >
          New Initiative
        </Link>
      </nav>

      {user && (
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
          <div className="relative">
            <button
              onClick={logout}
              className="flex items-center p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;