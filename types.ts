
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
  cpf?: string;
  recoveryEmail?: string;
  avatarUrl?: string;
  // accessToken removed (Sheets replaced by Firebase)
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
  
  requesterName?: string; 
  phone?: string;         
  neighborhood?: string;  

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

export interface AuthResponse {
  user: User;
  token: string;
}
