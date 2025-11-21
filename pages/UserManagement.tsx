
import React, { useEffect, useState } from 'react';
import { User, UserRole, Ticket } from '../types';
import { StorageService } from '../services/storageService';
import { DefesaCivilLogo } from '../components/Logo';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Modal State for Adding User
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRecoveryEmail, setNewRecoveryEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.OPERATOR);

  // Modal State for Changing Password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [changePasswordValue, setChangePasswordValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allUsers = StorageService.getAllUsers();
    const current = StorageService.getCurrentUser();
    
    setUsers(allUsers);
    setCurrentUser(current);

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

  // Logic for Changing Password
  const openChangePasswordModal = (user: User) => {
    setSelectedUserForPassword(user);
    setChangePasswordValue('');
    setShowPasswordModal(true);
  };

  const handleSubmitPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;

    if (changePasswordValue.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const success = StorageService.updateUserPassword(selectedUserForPassword.email, changePasswordValue);
    
    if (success) {
      alert(`Senha de ${selectedUserForPassword.name} alterada com sucesso!`);
      setShowPasswordModal(false);
      setSelectedUserForPassword(null);
      setChangePasswordValue('');
    } else {
      alert("Erro ao alterar senha.");
    }
  };

  const countUserTickets = (userEmail: string) => {
    return tickets.filter(t => t.createdBy === userEmail).length;
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
                  ? 'Administração de Usuários e Senhas' 
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
                <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-civil-orange focus:border-transparent" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">CPF</label>
                  <input type="text" required value={newCpf} onChange={e => setNewCpf(e.target.value)} placeholder="000.000.000-00" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-civil-orange focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Cargo Inicial</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-civil-orange focus:border-transparent">
                    <option value={UserRole.OPERATOR}>Operador</option>
                    <option value={UserRole.COORDINATOR}>Coordenador</option>
                    <option value={UserRole.ADMIN}>Administrador</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">E-mail (Login)</label>
                  <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-civil-orange focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">E-mail Recuperação</label>
                  <input type="email" required value={newRecoveryEmail} onChange={e => setNewRecoveryEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-civil-orange focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Senha Temporária</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-civil-orange focus:border-transparent" placeholder="Defina a senha inicial" />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-civil-orange text-white font-bold rounded hover:bg-orange-600 text-sm">Criar Cadastro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUserForPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-civil-orange p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">lock_reset</span>
                Alterar Senha
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="hover:bg-orange-600 p-1 rounded">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmitPasswordChange} className="p-6 space-y-4">
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800 mb-4">
                Alterando senha para: <strong>{selectedUserForPassword.name}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nova Senha</label>
                <input 
                  type="password" 
                  required 
                  value={changePasswordValue} 
                  onChange={e => setChangePasswordValue(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-civil-orange focus:border-transparent" 
                  placeholder="Digite a nova senha" 
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-civil-blue text-white font-bold rounded hover:bg-blue-800 text-sm">Salvar Nova Senha</button>
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
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-center">Progresso</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Permissão (Cargo)</th>
                {canEditPermissions && (
                   <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-center">Ações</th>
                )}
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
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-sm border border-blue-100" title="Total de Chamados Criados">
                      {countUserTickets(user.email)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.email, e.target.value as UserRole)}
                      disabled={!canEditPermissions || user.email === currentUser?.email}
                      title={!canEditPermissions ? "Apenas administradores podem alterar permissões" : "Alterar cargo"}
                      className={`block w-full rounded-md border-gray-300 shadow-sm text-sm font-medium p-2 disabled:opacity-60 disabled:cursor-not-allowed bg-white text-gray-900
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
                  {canEditPermissions && (
                    <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openChangePasswordModal(user)}
                          className="p-2 bg-gray-100 hover:bg-civil-orange hover:text-white text-gray-600 rounded-lg transition-colors"
                          title="Alterar Senha do Usuário"
                        >
                           <span className="material-symbols-outlined text-lg">lock_reset</span>
                        </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
