
export enum UserRole {
  ADMIN = 'ADMIN',
  COORDINATOR = 'COORDINATOR',
  OPERATOR = 'OPERATOR'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cpf?: string; // Novo campo
  recoveryEmail?: string; // Novo campo
  avatarUrl?: string;
  accessToken?: string; // Token OAuth2 para API do Google Sheets (Opcional agora)
}

export enum TicketStatus {
  OPEN = 'Aberto',
  IN_PROGRESS = 'Em Andamento',
  RESOLVED = 'Resolvido',
  CANCELLED = 'Cancelado'
}

export enum TicketPriority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  
  // Novos campos solicitados
  requesterName?: string; // Nome do Solicitante
  phone?: string;         // Telefone
  neighborhood?: string;  // Bairro

  address: string;
  location?: GeoLocation;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: string; // User ID
  assignedTo?: string; // User ID
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
  photos: string[]; // Base64 strings or URLs
  aiAnalysis?: string; // Gemini analysis / Observação
}

// Mock Auth Response
export interface AuthResponse {
  user: User;
  token: string;
}