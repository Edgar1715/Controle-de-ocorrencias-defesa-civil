
import { Ticket, TicketStatus, TicketPriority, User, UserRole } from '../types';
import { SheetsService } from './sheetsService';

// Constants for LocalStorage keys
const TICKETS_KEY = 'dc_bertioga_tickets';
const USER_SESSION_KEY = 'dc_current_user';
const USERS_DB_KEY = 'dc_users_db'; // "Banco de dados" de usuários
const SPREADSHEET_ID_KEY = 'dc_sheet_id';
const CLIENT_ID_KEY = 'dc_client_id';

// Admin Credentials (Hardcoded conforme solicitado)
const ADMIN_CREDENTIALS = {
  name: 'Edgar Carolino',
  email: 'edgarcarolino.2022@gmail.com',
  password: '11deJunho@',
  cpf: '000.000.000-00', // Placeholder
  recoveryEmail: 'edgarcarolino.2022@gmail.com',
  role: UserRole.ADMIN
};

// ID padrão fornecido pelo usuário
const DEFAULT_SHEET_ID = '1jx6w0zTpGUSCxahIx985EU-rxLlIx5z8jEU5gYjpT9A';

// Interface interna para armazenar senha (não exposta no type User)
interface StoredUser extends User {
  password?: string;
}

// Seed initial data if empty
const seedLocalData = () => {
  if (!localStorage.getItem(TICKETS_KEY)) {
    const tickets: Ticket[] = [
      {
        id: 'CH-LOCAL-001',
        title: 'Exemplo Local (Sem Planilha)',
        description: 'Este dado existe apenas no navegador local.',
        address: 'Rua Exemplo, 00',
        neighborhood: 'Centro',
        requesterName: 'João da Silva',
        phone: '(13) 99999-9999',
        location: { latitude: -23.853, longitude: -46.142 },
        status: TicketStatus.OPEN,
        priority: TicketPriority.LOW,
        createdBy: '1',
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
    id: 'admin-edgar',
    name: ADMIN_CREDENTIALS.name,
    email: ADMIN_CREDENTIALS.email,
    role: ADMIN_CREDENTIALS.role,
    cpf: ADMIN_CREDENTIALS.cpf,
    recoveryEmail: ADMIN_CREDENTIALS.recoveryEmail,
    password: ADMIN_CREDENTIALS.password
  };

  if (adminIndex >= 0) {
    // Garante que a senha esteja correta conforme hardcode
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
      role: UserRole.OPERATOR, // Padrão para novos cadastros
      avatarUrl: undefined
    };

    users.push(newUser);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    // Retorna usuário sem a senha
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

  updateCurrentUserToken: (accessToken: string) => {
    const user = StorageService.getCurrentUser();
    if (user) {
      user.accessToken = accessToken;
      StorageService.saveCurrentUser(user);
    }
  },

  // --- USER MANAGEMENT (ADMIN ONLY) ---

  getAllUsers: (): User[] => {
    const usersStr = localStorage.getItem(USERS_DB_KEY);
    const users: StoredUser[] = usersStr ? JSON.parse(usersStr) : [];
    // Return users without password
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
  
  getSpreadsheetId: (): string => {
    // Prioriza o que está no LocalStorage (configurado pelo usuário)
    const storedId = localStorage.getItem(SPREADSHEET_ID_KEY);
    return storedId && storedId.trim() !== '' ? storedId : DEFAULT_SHEET_ID;
  },

  setSpreadsheetId: (id: string) => {
    let cleanId = id;
    if (id.includes('/spreadsheets/d/')) {
      const match = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) cleanId = match[1];
    }
    localStorage.setItem(SPREADSHEET_ID_KEY, cleanId);
  },

  getClientId: (): string => {
    return localStorage.getItem(CLIENT_ID_KEY) || '';
  },

  setClientId: (id: string) => {
    localStorage.setItem(CLIENT_ID_KEY, id);
  },

  // --- DATA OPERATIONS ---

  getTickets: async (): Promise<Ticket[]> => {
    const user = StorageService.getCurrentUser();
    const sheetId = StorageService.getSpreadsheetId();
    
    // If user has a Google Access Token
    if (user && user.accessToken) {
      try {
        console.log(`[Sync] Buscando dados da Planilha (${sheetId})...`);
        const sheetTickets = await SheetsService.fetchTickets(user.accessToken, sheetId);
        
        // Atualiza cache local com dados da planilha
        localStorage.setItem(TICKETS_KEY, JSON.stringify(sheetTickets));
        return sheetTickets;
      } catch (error) {
        console.error("[Sync] Erro ao acessar Planilha (usando cache local):", error);
        // Fallback para local
        const data = localStorage.getItem(TICKETS_KEY);
        return data ? JSON.parse(data) : [];
      }
    }

    // Local Storage Mode
    const data = localStorage.getItem(TICKETS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getTicketsLocal: (): Ticket[] => {
    const data = localStorage.getItem(TICKETS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getTicketById: async (id: string): Promise<Ticket | undefined> => {
    const tickets = await StorageService.getTickets(); // Tenta pegar atualizado
    const localTicket = tickets.find(t => t.id === id);
    return localTicket;
  },

  saveTicket: async (ticket: Ticket): Promise<void> => {
    // 1. Save Locally First (Always safe)
    const tickets = StorageService.getTicketsLocal();
    const existingIndex = tickets.findIndex(t => t.id === ticket.id);
    
    if (existingIndex >= 0) {
      tickets[existingIndex] = ticket;
    } else {
      tickets.unshift(ticket);
    }
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
    console.log("[Sync] Salvo localmente com sucesso.");

    // 2. Try to sync with Google Sheets if token exists
    const user = StorageService.getCurrentUser();
    const sheetId = StorageService.getSpreadsheetId();

    if (user && user.accessToken) {
      try {
        console.log(`[Sync] Iniciando envio para Planilha ID: ${sheetId}...`);
        if (existingIndex === -1) {
            await SheetsService.appendTicket(user.accessToken, sheetId, ticket);
        } else {
            await SheetsService.updateTicket(user.accessToken, sheetId, ticket);
        }
        console.log("[Sync] Sincronizado com Google Sheets com sucesso!");
      } catch (error: any) {
        console.error("[Sync] CRÍTICO: Erro ao salvar na planilha:", error);
        // Lança erro para que a UI possa avisar o usuário, se necessário
        // Mas o dado já está salvo localmente.
        throw error; 
      }
    } else {
      console.warn("[Sync] Token de acesso Google não encontrado. Dados salvos apenas localmente.");
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
