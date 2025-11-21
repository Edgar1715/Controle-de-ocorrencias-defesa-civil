
import { Ticket, TicketStatus, TicketPriority, User, UserRole } from '../types';
import { FirebaseService, FirebaseConfig } from './firebaseService';

// Constants for LocalStorage keys
const TICKETS_KEY = 'dc_bertioga_tickets';
const USER_SESSION_KEY = 'dc_current_user';
const USERS_DB_KEY = 'dc_users_db';
const FIREBASE_CONFIG_KEY = 'dc_firebase_config';
const CUSTOM_LOGO_KEY = 'dc_custom_logo';

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

// Tenta inicializar o Firebase ao carregar o script se houver config
const storedConfig = localStorage.getItem(FIREBASE_CONFIG_KEY);
if (storedConfig) {
  try {
    const config = JSON.parse(storedConfig);
    FirebaseService.init(config);
  } catch (e) {
    console.error("Configuração inválida do Firebase no Storage.");
  }
}

// Seed initial data if empty
const seedLocalData = () => {
  if (!localStorage.getItem(TICKETS_KEY)) {
    const tickets: Ticket[] = [
      {
        id: 'CH-LOCAL-001',
        title: 'Exemplo Local (Offline)',
        description: 'Este dado existe apenas no navegador local enquanto o banco de dados não é conectado.',
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
        aiAnalysis: 'Análise local.'
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
    usersDb[adminIndex] = adminUser;
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

  // --- USER MANAGEMENT (ADMIN ONLY) ---

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

  // --- CONFIG MANAGEMENT ---

  getFirebaseConfig: (): string => {
    return localStorage.getItem(FIREBASE_CONFIG_KEY) || '';
  },

  setFirebaseConfig: (configJson: string) => {
    // Tenta validar JSON
    try {
      const config = JSON.parse(configJson);
      if (!config.projectId) throw new Error("Config inválida");
      
      localStorage.setItem(FIREBASE_CONFIG_KEY, configJson);
      
      // Tenta inicializar
      const success = FirebaseService.init(config);
      return success;
    } catch (e) {
      console.error("Erro ao salvar config:", e);
      return false;
    }
  },

  getCustomLogo: (): string | null => {
    return localStorage.getItem(CUSTOM_LOGO_KEY);
  },

  setCustomLogo: (base64Image: string) => {
    localStorage.setItem(CUSTOM_LOGO_KEY, base64Image);
  },

  removeCustomLogo: () => {
    localStorage.removeItem(CUSTOM_LOGO_KEY);
  },

  // --- DATA OPERATIONS ---

  getTickets: async (): Promise<Ticket[]> => {
    // Se Firebase estiver conectado, usa ele
    if (FirebaseService.isInitialized()) {
      try {
        console.log("[Sync] Buscando dados do Firebase...");
        const fbTickets = await FirebaseService.fetchTickets();
        
        // Atualiza cache local para backup
        localStorage.setItem(TICKETS_KEY, JSON.stringify(fbTickets));
        return fbTickets;
      } catch (error) {
        console.error("[Sync] Erro ao acessar Firebase (usando cache local):", error);
      }
    } else {
      console.log("[Sync] Firebase não configurado. Usando modo offline.");
    }

    // Fallback para Local Storage
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
    // 1. Save Locally First (Optimistic UI)
    const tickets = StorageService.getTicketsLocal();
    const existingIndex = tickets.findIndex(t => t.id === ticket.id);
    
    if (existingIndex >= 0) {
      tickets[existingIndex] = ticket;
    } else {
      tickets.unshift(ticket);
    }
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
    console.log("[Sync] Salvo localmente.");

    // 2. Try to sync with Firebase
    if (FirebaseService.isInitialized()) {
      try {
        console.log("[Sync] Enviando para Firebase...");
        await FirebaseService.saveTicket(ticket);
        console.log("[Sync] Sincronizado com sucesso!");
      } catch (error) {
        console.error("[Sync] Erro ao enviar para Firebase:", error);
        throw error;
      }
    }
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
