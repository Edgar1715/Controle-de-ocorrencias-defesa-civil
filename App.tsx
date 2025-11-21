
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TicketForm } from './pages/TicketForm';
import { TicketDetails } from './pages/TicketDetails';
import { UserManagement } from './pages/UserManagement';
import { Header } from './components/Header';
import { User, UserRole } from './types';
import { StorageService } from './services/storageService';

// Protected Route Component Update to support multiple allowed roles
const ProtectedRoute = ({ 
  user, 
  children, 
  allowedRoles 
}: { 
  user: User | null; 
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) => {
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check existing session
    const storedUser = StorageService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleLogin = (email: string, role: UserRole, photoUrl?: string, name?: string) => {
    const newUser: User = {
      id: Math.random().toString(),
      name: name || email.split('@')[0], // Use Google name or fallback to email part
      email,
      role,
      avatarUrl: photoUrl
    };
    StorageService.saveCurrentUser(newUser);
    setUser(newUser);
  };

  const handleLogout = () => {
    StorageService.logout();
    setUser(null);
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        {user && (
          <Header 
            user={user} 
            onLogout={handleLogout} 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        
        <main className={`max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 transition-all duration-300`}>
          <Routes>
            <Route path="/login" element={
              user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            } />
            
            <Route path="/" element={
              <ProtectedRoute user={user}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/new" element={
              <ProtectedRoute user={user}>
                <TicketForm />
              </ProtectedRoute>
            } />
            
            <Route path="/ticket/:id" element={
              <ProtectedRoute user={user}>
                <TicketDetails />
              </ProtectedRoute>
            } />

            {/* Admin & Coordinator Route (View only for Coord, Edit for Admin handled in component) */}
            <Route path="/users" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.COORDINATOR]}>
                <UserManagement />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
