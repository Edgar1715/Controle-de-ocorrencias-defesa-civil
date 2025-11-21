
import React from 'react';
import { User, UserRole } from '../types';
import { DefesaCivilLogo } from './Logo';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, toggleSidebar }) => {
  const location = useLocation();

  return (
    <header className="bg-civil-blue text-white shadow-md sticky top-0 z-50 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-blue-800 focus:outline-none md:hidden"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="bg-white/10 p-1 rounded-full">
              <DefesaCivilLogo size="sm" />
            </div>
            <div className="leading-tight hidden sm:block">
              <h1 className="font-bold text-lg tracking-wide">DEFESA CIVIL</h1>
              <p className="text-xs text-orange-400 font-medium tracking-wider">BERTIOGA - SP</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              
              {/* Admin & Coordinator Menu */}
              {(user.role === UserRole.ADMIN || user.role === UserRole.COORDINATOR) && (
                <Link 
                  to="/users"
                  className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors mr-2 ${
                    location.pathname === '/users' 
                      ? 'bg-civil-orange text-white' 
                      : 'bg-blue-800/50 text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">group</span>
                  EQUIPE
                </Link>
              )}

              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-blue-200">{user.role}</p>
              </div>
              
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name} 
                  className="h-9 w-9 rounded-full border-2 border-civil-orange"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-civil-orange flex items-center justify-center text-white font-bold">
                   {user.name.charAt(0)}
                </div>
              )}

              <button 
                onClick={onLogout}
                className="p-2 rounded-full hover:bg-blue-800 transition-colors flex items-center justify-center ml-1"
                title="Sair"
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="h-1 bg-civil-orange w-full"></div>
    </header>
  );
};
