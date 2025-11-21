
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { DefesaCivilLogo } from '../components/Logo';
import { StorageService } from '../services/storageService';

interface LoginProps {
  onLogin: (email: string, role: UserRole, photoUrl?: string, name?: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [error, setError] = useState('');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const result = StorageService.loginUser(email, password);
    
    if (result.success && result.user) {
      onLogin(
        result.user.email,
        result.user.role,
        result.user.avatarUrl,
        result.user.name
      );
    } else {
      setError(result.message || 'Erro ao efetuar login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 bg-[url('https://www.bertioga.sp.gov.br/wp-content/uploads/2021/05/defesa-civil-vtr.jpg')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-civil-blue/90 backdrop-blur-sm z-0"></div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 relative animate-fade-in-up border-t-4 border-civil-orange">
        <div className="p-8 pb-6 flex flex-col items-center text-center">
          <div className="mb-4 drop-shadow-lg">
            <DefesaCivilLogo size="lg" showText={true} />
          </div>
          
          <h2 className="text-2xl font-bold text-civil-blue">Defesa Civil</h2>
          <p className="text-civil-orange font-bold tracking-[0.2em] text-xs uppercase">Bertioga - SP</p>
          <p className="text-gray-400 text-xs mt-2">Acesso Restrito - Gestão de Ocorrências</p>
        </div>

        <div className="px-8 pb-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">E-mail (Login)</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-500 text-lg z-10">mail</span>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civil-orange focus:border-transparent text-sm placeholder-gray-400"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Senha</label>
              <div className="relative">
                 <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-500 text-lg z-10">lock</span>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-civil-orange focus:border-transparent text-sm placeholder-gray-400"
                  placeholder="********"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-civil-blue hover:bg-blue-900 text-white font-bold py-3 rounded-lg shadow-md transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
              <span className="material-symbols-outlined">login</span>
              Acessar Sistema
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">Não possui acesso? Contate o Administrador.</p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-white/60 text-xs text-center w-full">
         Sistema de Gestão de Ocorrências &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
};
