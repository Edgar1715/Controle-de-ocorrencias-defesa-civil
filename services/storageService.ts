
import { Ticket, TicketStatus, TicketPriority, User, UserRole } from '../types';

// Constants for LocalStorage keys
const TICKETS_KEY = 'dc_bertioga_tickets';
const USER_SESSION_KEY = 'dc_current_user';
const USERS_DB_KEY = 'dc_users_db';

// Admin Credentials
const ADMIN_CREDENTIALS = {
  id: 'JcxBmDa5TrZtrrZm550Qj0nOynA3', // UID Solicitado
  name: 'Edgar Carolino',
  email: 'edgarcarolino.2022@gmail.com',
  password: '11deJunho@',
  cpf: '000.000.000-00',
  recoveryEmail: 'edgarcarolino.2022@gmail.com',
  role: UserRole.ADMIN
};

// Interface interna para armazenar senha
interface StoredUser extends User {
  password?: string;
}

// --- INICIALIZAÇÃO ---

// Seed initial data if empty
const seedLocalData = () => {
  if (!localStorage.getItem(TICKETS_KEY)) {
    const tickets: Ticket[] = [
      {
        id: 'CH-LOCAL-001',
        title: 'Exemplo Inicial',
        description: 'Chamado de exemplo gerado localmente.',
        address: 'Rua Exemplo, 00',
        neighborhood: 'Centro',
        requesterName: 'Sistema',
        phone: '(13) 99999-9999',
        location: { latitude: -23.853, longitude: -46.142 },
        status: TicketStatus.OPEN,
        priority: TicketPriority.LOW,
        createdBy: 'JcxBmDa5TrZtrrZm550Qj0nOynA3',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photos: [],
        aiAnalysis: 'Análise automática.'
      }
    ];
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  }

  // Seed Admin User
  let usersDb: StoredUser[] = [];
  const usersStr = localStorage.getItem(USERS_DB_KEY);
  if (usersStr) {
    usersDb = JSON.parse(usersStr);
  }

  // Verifica se o Admin existe, se não ou se senha mudou, atualiza/cria
  const adminIndex = usersDb.findIndex(u => u.email === ADMIN_CREDENTIALS.email);
  const adminUser: StoredUser = {
    id: ADMIN_CREDENTIALS.id,
    name: ADMIN_CREDENTIALS.name,
    email: ADMIN_CREDENTIALS.email,
    role: ADMIN_CREDENTIALS.role,
    cpf: ADMIN_CREDENTIALS.cpf,
    recoveryEmail: ADMIN_CREDENTIALS.recoveryEmail,
    password: ADMIN_CREDENTIALS.password
  };

  if (adminIndex >= 0) {
    // Preserva a senha se o admin já mudou localmente, caso contrário reseta para a default do código
    // Para garantir que o login funcione com a senha fornecida no código, vamos forçar a atualização aqui neste caso
    usersDb[adminIndex] = { ...usersDb[adminIndex], ...adminUser, password: usersDb[adminIndex].password || ADMIN_CREDENTIALS.password };
  } else {
    usersDb.push(adminUser);
  }
  
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersDb));
};

seedLocalData();

export const StorageService = {
  // --- AUTHENTICATION ---

  registerUser: (data: { name: string, cpf: string, email: string, recoveryEmail: string, password: string }): { success: boolean, message?: string, user?: User } => {
    const usersStr = localStorage.getItem(USERS_DB_KEY);
    const users: StoredUser[] = usersStr ? JSON.parse(usersStr) : [];

    if (users.find(u => u.email === data.email)) {
      return { success: false, message: 'E-mail já cadastrado.' };
    }

    const newUser: StoredUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      email: data.email,
      password: data.password,
      cpf: data.cpf,
      recoveryEmail: data.recoveryEmail,
      role: UserRole.OPERATOR,
      avatarUrl: undefined
    };

    users.push(newUser);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    const { password, ...safeUser } = newUser;
    return { success: true, user: safeUser };
  },

  loginUser: (email: string, password: string): { success: boolean, message?: string, user?: User } => {
    const usersStr = localStorage.getItem(USERS_DB_KEY);
    const users: StoredUser[] = usersStr ? JSON.parse(usersStr) : [];

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return { success: false, message: 'E-mail ou senha inválidos.' };
    }

    const { password: _, ...safeUser } = user;
    StorageService.saveCurrentUser(safeUser);
    return { success: true, user: safeUser };
  },

  // --- USER MANAGEMENT ---

  getAllUsers: (): User[] => {
    const usersStr = localStorage.getItem(USERS_DB_KEY);
    const users: StoredUser[] = usersStr ? JSON.parse(usersStr) : [];
    return users.map(({ password, ...u }) => u);
  },

  updateUserRole: (targetEmail: string, newRole: UserRole): boolean => {
    const usersStr = localStorage.getItem(USERS_DB_KEY);
    if (!usersStr) return false;
    
    const users: StoredUser[] = JSON.parse(usersStr);
    const index = users.findIndex(u => u.email === targetEmail);
    
    if (index === -1) return false;
    
    users[index].role = newRole;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    return true;
  },

  updateUserPassword: (targetEmail: string, newPassword: string): boolean => {
    const usersStr = localStorage.getItem(USERS_DB_KEY);
    if (!usersStr) return false;

    const users: StoredUser[] = JSON.parse(usersStr);
    const index = users.findIndex(u => u.email === targetEmail);

    if (index === -1) return false;

    users[index].password = newPassword;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    return true;
  },

  // --- DATA OPERATIONS ---

  getTickets: async (): Promise<Ticket[]> => {
    const data = localStorage.getItem(TICKETS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getTicketsLocal: (): Ticket[] => {
    const data = localStorage.getItem(TICKETS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getTicketById: async (id: string): Promise<Ticket | undefined> => {
    const tickets = await StorageService.getTickets();
    return tickets.find(t => t.id === id);
  },

  saveTicket: async (ticket: Ticket): Promise<void> => {
    const tickets = StorageService.getTicketsLocal();
    const existingIndex = tickets.findIndex(t => t.id === ticket.id);
    
    if (existingIndex >= 0) {
      tickets[existingIndex] = ticket;
    } else {
      tickets.unshift(ticket);
    }
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
    console.log("[Storage] Salvo localmente.");
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(USER_SESSION_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  saveCurrentUser: (user: User): void => {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  },

  logout: (): void => {
    localStorage.removeItem(USER_SESSION_KEY);
  }
};
