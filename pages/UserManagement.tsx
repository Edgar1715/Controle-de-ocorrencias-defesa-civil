
import React, { useEffect, useState } from 'react';
import { User, UserRole, Ticket } from '../types';
import { StorageService } from '../services/storageService';
import { DefesaCivilLogo } from '../components/Logo';

// Declare Google GIS Type
declare var google: any;

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Config States
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [clientId, setClientId] = useState('');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Modal State for Adding User
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRecoveryEmail, setNewRecoveryEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.OPERATOR);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allUsers = StorageService.getAllUsers();
    const current = StorageService.getCurrentUser();
    
    // Configs
    setSpreadsheetId(StorageService.getSpreadsheetId());
    setClientId(StorageService.getClientId());
    setIsGoogleConnected(!!current?.accessToken);

    setUsers(allUsers);
    setCurrentUser(current);

    // Load tickets (allows checking if connection works)
    const allTickets = await StorageService.getTickets();
    setTickets(allTickets);
  };

  const handleRoleChange = (email: string, newRole: UserRole) => {
    if (currentUser?.role !== UserRole.ADMIN) {
      alert("Apenas Administradores podem alterar permissões.");
      return;
    }

    if (email === currentUser?.email) {
      alert("Você não pode alterar seu próprio nível de permissão nesta tela.");
      return;
    }

    const success = StorageService.updateUserRole(email, newRole);
    if (success) {
      const updatedUsers = StorageService.getAllUsers();
      setUsers(updatedUsers);
    } else {
      alert("Erro ao atualizar permissão.");
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== UserRole.ADMIN) return;

    const result = StorageService.registerUser({
      name: newName,
      cpf: newCpf,
      email: newEmail,
      recoveryEmail: newRecoveryEmail,
      password: newPassword
    });

    if (result.success) {
      if (newRole !== UserRole.OPERATOR && result.user) {
        StorageService.updateUserRole(result.user.email, newRole);
      }
      alert("Usuário criado com sucesso!");
      setShowAddModal(false);
      resetForm();
      loadData();
    } else {
      alert(result.message || "Erro ao criar usuário.");
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewCpf('');
    setNewEmail('');
    setNewRecoveryEmail('');
    setNewPassword('');
    setNewRole(UserRole.OPERATOR);
  };

  const countUserTickets = (userEmail: string) => {
    return tickets.filter(t => t.createdBy === userEmail).length;
  };

  const handleSaveConfig = () => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    StorageService.setSpreadsheetId(spreadsheetId);
    StorageService.setClientId(clientId);
    alert('Configurações salvas!');
  };

  const handleGoogleAuth = () => {
    if (!clientId) {
      alert('Por favor, insira o Client ID do Google Cloud antes de conectar.');
      return;
    }

    if (typeof google === 'undefined') {
        alert('Google Identity Services não carregado. Verifique sua conexão.');
        return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: (response: any) => {
        if (response.access_token) {
          StorageService.updateCurrentUserToken(response.access_token);
          setIsGoogleConnected(true);
          alert('Conectado com Google Drive com sucesso! Os chamados agora serão salvos na planilha.');
          loadData(); // Refresh to test connection
        }
      },
    });

    client.requestAccessToken();
  };

  const canEditPermissions = currentUser?.role === UserRole.ADMIN;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full shadow-sm">
              <DefesaCivilLogo size="md" />
          </div>
          <div>
              <h1 className="text-2xl font-bold text-gray-800">Gestão de Equipe</h1>
              <p className="text-gray-500 text-sm">
                {canEditPermissions 
                  ? 'Administração de Usuários e Configurações' 
                  : 'Visualização de Equipe e Progresso'}
              </p>
          </div>
        </div>

        {canEditPermissions && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-civil-blue hover:bg-blue-800 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 font-medium text-sm"
          >
            <span className="material-symbols-outlined">person_add</span>
            Adicionar Usuário
          </button>
        )}
      </div>

      {/* Google Sheets Configuration Panel (Admin Only) */}
      {canEditPermissions && (
        <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden mb-8">
          <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex items-center gap-2">
             <span className="material-symbols-outlined text-green-700">table_view</span>
             <h2 className="font-bold text-green-900">Integração Google Sheets (Drive)</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  Para salvar os dados no seu Drive, crie um projeto no <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-600 underline">Google Cloud Console</a>, ative a API do Sheets e crie um ID do Cliente OAuth 2.0.
                </p>
                <div>
                   <label className="block text-xs font-bold text-gray-600 mb-1">Google Cloud Client ID (OAuth)</label>
                   <input 
                      type="text" 
                      value={clientId} 
                      onChange={e => setClientId(e.target.value)}
                      className="w-full border rounded p-2 text-sm" 
                      placeholder="Ex: 123456-abcde.apps.googleusercontent.com"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-600 mb-1">ID da Planilha (Spreadsheet ID)</label>
                   <input 
                      type="text" 
                      value={spreadsheetId} 
                      onChange={e => setSpreadsheetId(e.target.value)}
                      className="w-full border rounded p-2 text-sm" 
                      placeholder="ID da URL da Planilha"
                   />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveConfig}
                    className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded hover:bg-gray-200 text-sm"
                  >
                    Salvar IDs
                  </button>
                </div>
            </div>
            
            <div className="flex flex-col justify-center items-center border-l border-gray-100 pl-8">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${isGoogleConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                   <span className="material-symbols-outlined text-3xl">cloud_sync</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-1">Status da Conexão</h3>
                <p className={`text-sm mb-4 ${isGoogleConnected ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                  {isGoogleConnected ? 'Conectado e Sincronizando' : 'Desconectado'}
                </p>
                <button 
                  onClick={handleGoogleAuth}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 font-medium text-sm transition-all"
                >
                  <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                  {isGoogleConnected ? 'Renovar Acesso Google' : 'Conectar Google Drive'}
                </button>
                <p className="text-[10px] text-gray-400 mt-2 text-center max-w-xs">
                   Isso abrirá um popup do Google pedindo permissão para editar suas planilhas.
                </p>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-civil-blue p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">person_add</span>
                Novo Cadastro
              </h3>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-blue-800 p-1 rounded">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nome Completo</label>
                <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="w-full border rounded p-2 text-sm" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">CPF</label>
                  <input type="text" required value={newCpf} onChange={e => setNewCpf(e.target.value)} placeholder="000.000.000-00" className="w-full border rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Cargo Inicial</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} className="w-full border rounded p-2 text-sm">
                    <option value={UserRole.OPERATOR}>Operador</option>
                    <option value={UserRole.COORDINATOR}>Coordenador</option>
                    <option value={UserRole.ADMIN}>Administrador</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">E-mail (Login)</label>
                  <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full border rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">E-mail Recuperação</label>
                  <input type="email" required value={newRecoveryEmail} onChange={e => setNewRecoveryEmail(e.target.value)} className="w-full border rounded p-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Senha Temporária</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Defina a senha inicial" />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-civil-orange text-white font-bold rounded hover:bg-orange-600 text-sm">Criar Cadastro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
           <h3 className="font-bold text-gray-700">Membros da Equipe</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Dados Pessoais</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-center">Progresso (Chamados)</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Permissão (Cargo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.email} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-civil-blue text-white flex items-center justify-center font-bold text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                        <p><span className="font-bold text-xs text-gray-400 uppercase">CPF:</span> {user.cpf || '-'}</p>
                        <p><span className="font-bold text-xs text-gray-400 uppercase">Recuperação:</span> {user.recoveryEmail || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100">
                      {countUserTickets(user.email)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.email, e.target.value as UserRole)}
                      disabled={!canEditPermissions || user.email === currentUser?.email}
                      title={!canEditPermissions ? "Apenas administradores podem alterar permissões" : "Alterar cargo"}
                      className={`block w-full rounded-md border-gray-300 shadow-sm text-sm font-medium p-2 disabled:opacity-60 disabled:cursor-not-allowed
                        ${user.role === UserRole.ADMIN ? 'text-red-700 bg-red-50' : 
                          user.role === UserRole.COORDINATOR ? 'text-purple-700 bg-purple-50' : 'text-green-700 bg-green-50'}
                        ${canEditPermissions ? 'focus:border-civil-orange focus:ring focus:ring-civil-orange focus:ring-opacity-50' : ''}
                      `}
                    >
                      <option value={UserRole.OPERATOR}>Operador</option>
                      <option value={UserRole.COORDINATOR}>Coordenador</option>
                      <option value={UserRole.ADMIN}>Administrador</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
