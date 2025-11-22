/**
 * DEFESA CIVIL BERTIOGA - VANILLA JS APP
 * --------------------------------------
 * Arquivo principal de lógica contendo:
 * 1. Configuração e Estado Global
 * 2. Serviços (API/Storage, Auth)
 * 3. Roteamento e Renderização
 * 4. Componentes (Templates HTML)
 */

// --- 1. CONFIGURAÇÃO E ESTADO GLOBAL ---

const APP_CONFIG = {
  // Se true, tenta usar a API do Postgres. Se false, usa LocalStorage.
  USE_API: false, 
  API_BASE_URL: 'https://api.seusite.com.br', // URL do seu Backend Node.js/Python ligado ao Postgres
  ADMIN_EMAIL: 'edgarcarolino.2022@gmail.com'
};

// Estado da Aplicação
const State = {
  user: null,
  tickets: [],
  users: [],
  currentRoute: '/login',
  params: {}
};

// --- 2. SERVIÇOS ---

/**
 * SERVICE: PostgresService (Futura Integração)
 * Este serviço substituirá o LocalStorage quando você criar seu backend.
 * O Frontend fará chamadas HTTP (fetch) para sua API, que falará com o Postgres.
 */
const PostgresService = {
  async login(email, password) {
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Falha no login');
    return await response.json(); // Espera { user: ..., token: ... }
  },

  async getTickets() {
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/tickets`);
    return await response.json();
  },

  async saveTicket(ticket) {
    // Se tem ID e já existe, é PUT (Update), senão POST (Create)
    // Aqui simplificado para POST
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    });
    return await response.json();
  }
  // ... outros métodos (getUsers, registerUser, etc) seriam implementados aqui
};

/**
 * SERVICE: LocalStorageService (Atual)
 * Mantém os dados salvos no navegador enquanto não há Backend.
 */
const LocalStorageService = {
  KEYS: {
    TICKETS: 'dc_bertioga_tickets',
    SESSION: 'dc_current_user',
    USERS: 'dc_users_db'
  },

  init() {
    // Seed Inicial de Tickets
    if (!localStorage.getItem(this.KEYS.TICKETS)) {
      const initialTickets = [{
        id: 'CH-LOCAL-001',
        title: 'Exemplo Inicial',
        description: 'Chamado de exemplo gerado localmente.',
        address: 'Rua Exemplo, 00',
        neighborhood: 'Centro',
        requesterName: 'Sistema',
        phone: '(13) 99999-9999',
        location: { latitude: -23.853, longitude: -46.142 },
        status: 'Aberto',
        priority: 'Baixa',
        createdBy: 'JcxBmDa5TrZtrrZm550Qj0nOynA3',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photos: []
      }];
      localStorage.setItem(this.KEYS.TICKETS, JSON.stringify(initialTickets));
    }

    // Seed Inicial de Usuários (Admin)
    let users = this.getUsersLocal();
    const adminExists = users.find(u => u.email === APP_CONFIG.ADMIN_EMAIL);
    
    if (!adminExists) {
      users.push({
        id: 'admin-uid',
        name: 'Edgar Carolino',
        email: APP_CONFIG.ADMIN_EMAIL,
        password: '11deJunho@',
        role: 'ADMIN',
        cpf: '000.000.000-00'
      });
      localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    }
  },

  getUsersLocal() {
    const data = localStorage.getItem(this.KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  async login(email, password) {
    // Simula delay de rede
    await new Promise(r => setTimeout(r, 500)); 
    
    const users = this.getUsersLocal();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) return { success: false, message: 'Credenciais inválidas' };
    
    const { password: _, ...safeUser } = user;
    this.saveSession(safeUser);
    return { success: true, user: safeUser };
  },

  async register(userData) {
    const users = this.getUsersLocal();
    if (users.find(u => u.email === userData.email)) {
      return { success: false, message: 'Email já cadastrado' };
    }
    
    const newUser = { 
      ...userData, 
      id: Math.random().toString(36).substr(2, 9),
      role: 'OPERATOR' 
    };
    users.push(newUser);
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    
    return { success: true, user: newUser };
  },

  async getTickets() {
    const data = localStorage.getItem(this.KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  },

  async getTicketById(id) {
    const tickets = await this.getTickets();
    return tickets.find(t => t.id === id);
  },

  async saveTicket(ticket) {
    const tickets = await this.getTickets();
    const idx = tickets.findIndex(t => t.id === ticket.id);
    
    if (idx >= 0) tickets[idx] = ticket;
    else tickets.unshift(ticket);
    
    localStorage.setItem(this.KEYS.TICKETS, JSON.stringify(tickets));
  },

  saveSession(user) {
    localStorage.setItem(this.KEYS.SESSION, JSON.stringify(user));
  },

  getSession() {
    const data = localStorage.getItem(this.KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },

  logout() {
    localStorage.removeItem(this.KEYS.SESSION);
  },
  
  getAllUsers() {
     return this.getUsersLocal().map(({password, ...u}) => u);
  },
  
  updateUserRole(email, newRole) {
      const users = this.getUsersLocal();
      const idx = users.findIndex(u => u.email === email);
      if (idx !== -1) {
          users[idx].role = newRole;
          localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
          return true;
      }
      return false;
  },

  updateUserPassword(email, newPassword) {
      const users = this.getUsersLocal();
      const idx = users.findIndex(u => u.email === email);
      if (idx !== -1) {
          users[idx].password = newPassword;
          localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
          return true;
      }
      return false;
  }
};

// Inicializa LocalStorage (Seed)
LocalStorageService.init();

/**
 * DataService: Camada de abstração.
 * O resto da aplicação chama DataService.metodo(), sem saber se vem do LocalStorage ou Postgres.
 */
const DataService = {
  async login(email, password) {
    if (APP_CONFIG.USE_API) return PostgresService.login(email, password);
    return LocalStorageService.login(email, password);
  },
  
  async getTickets() {
    if (APP_CONFIG.USE_API) return PostgresService.getTickets();
    return LocalStorageService.getTickets();
  },

  async getTicketById(id) {
    // PostgresService.getTicketById(id) seria necessário aqui se USE_API for true
    return LocalStorageService.getTicketById(id);
  },
  
  async saveTicket(ticket) {
    if (APP_CONFIG.USE_API) return PostgresService.saveTicket(ticket);
    return LocalStorageService.saveTicket(ticket);
  },

  logout: () => LocalStorageService.logout(),
  getCurrentUser: () => LocalStorageService.getSession(),
  saveCurrentUser: (u) => LocalStorageService.saveSession(u),
  registerUser: (d) => LocalStorageService.register(d),
  getAllUsers: () => LocalStorageService.getAllUsers(),
  updateUserRole: (e, r) => LocalStorageService.updateUserRole(e, r),
  updateUserPassword: (e, p) => LocalStorageService.updateUserPassword(e, p)
};

// --- 3. COMPONENTES (VIEWS) ---

const Components = {
  Logo(size = 'md') {
    const sizes = { sm: 'w-10 h-10', md: 'w-16 h-16', lg: 'w-24 h-24' };
    const iconSizes = { sm: '1rem', md: '1.5rem', lg: '2.5rem' };
    // URL do Brasão (Pode ser alterada aqui globalmente)
    const CREST_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Bras%C3%A3o_de_Bertioga.svg/320px-Bras%C3%A3o_de_Bertioga.svg.png";
    
    return `
      <div class="relative flex items-center justify-center ${sizes[size]} mx-auto">
        <div class="absolute inset-0 bg-orange-500 shadow-sm" style="clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); z-index:0;"></div>
        <div class="absolute inset-0 bg-blue-900" style="clip-path: polygon(50% 10%, 90% 80%, 10% 80%); z-index:10;"></div>
        
        <!-- Imagem do Brasão -->
        <img 
            src="${CREST_URL}" 
            alt="Brasão"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
            class="relative z-20 h-[50%] w-auto object-contain mt-[10%] drop-shadow-sm hover:scale-110 transition-transform"
        />
        
        <!-- Fallback Icon -->
        <span class="material-symbols-outlined text-white relative z-20 mt-[10%] hidden" style="font-size: ${iconSizes[size]}">shield</span>
      </div>
    `;
  },

  Header(user) {
    return `
      <header class="bg-blue-900 text-white shadow-md sticky top-0 z-50 print:hidden">
        <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div class="flex items-center gap-3 cursor-pointer" onclick="Router.navigate('/')">
            <div class="bg-white/10 p-1 rounded-full">${Components.Logo('sm')}</div>
            <div class="leading-tight hidden sm:block">
              <h1 class="font-bold text-lg tracking-wide">DEFESA CIVIL</h1>
              <p class="text-xs text-orange-400 font-medium tracking-wider">BERTIOGA - SP</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-medium">${user.name}</p>
              <p class="text-xs text-blue-200">${user.role}</p>
            </div>
            <button onclick="Handlers.logout()" class="p-2 rounded-full hover:bg-blue-800" title="Sair">
              <span class="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
        <div class="h-1 bg-orange-500 w-full"></div>
      </header>
    `;
  },

  Login() {
    return `
      <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 bg-[url('https://www.bertioga.sp.gov.br/wp-content/uploads/2021/05/defesa-civil-vtr.jpg')] bg-cover bg-center relative">
        <div class="absolute inset-0 bg-blue-900/90 backdrop-blur-sm z-0"></div>
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 relative border-t-4 border-orange-500 animate-fade-in-up">
          <div class="p-8 pb-6 flex flex-col items-center text-center">
            <div class="mb-4">${Components.Logo('lg')}</div>
            <h2 class="text-2xl font-bold text-blue-900">Defesa Civil</h2>
            <p class="text-orange-500 font-bold tracking-[0.2em] text-xs uppercase">Bertioga - SP</p>
          </div>
          <div class="px-8 pb-8">
            <form onsubmit="Handlers.login(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">E-mail</label>
                <input type="email" id="loginEmail" required class="w-full p-2 border rounded bg-white" placeholder="seu@email.com">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1 uppercase">Senha</label>
                <input type="password" id="loginPass" required class="w-full p-2 border rounded bg-white" placeholder="********">
              </div>
              <button type="submit" class="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded shadow-md mt-4 flex justify-center items-center gap-2">
                <span class="material-symbols-outlined">login</span> Acessar
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  Dashboard() {
    const tickets = State.tickets;
    
    // Stats
    const critical = tickets.filter(t => t.priority === 'Crítica').length;
    const open = tickets.filter(t => t.status === 'Aberto').length;
    
    // Helper para atraso
    const isOverdue = (t) => {
        if (t.status === 'Resolvido' || t.status === 'Cancelado') return false;
        const created = new Date(t.createdAt);
        const today = new Date();
        today.setHours(0,0,0,0);
        return created < today;
    };

    const ticketRows = tickets.map(t => {
        const overdue = isOverdue(t);
        const rowClass = overdue ? 'bg-red-50 border-l-4 border-red-500' : 'hover:bg-gray-50 border-l-4 border-transparent';
        const dateClass = overdue ? 'text-red-700 font-bold flex items-center gap-1' : 'text-gray-500';
        const alertIcon = overdue ? '<span class="material-symbols-outlined text-[14px]">event_busy</span>' : '';

        return `
      <tr class="cursor-pointer transition-colors ${rowClass}" onclick="Router.navigate('/ticket/${t.id}')">
        <td class="px-6 py-4">
          <div class="text-sm font-medium text-gray-900">${t.id}</div>
          <div class="text-xs ${dateClass}">${alertIcon} ${new Date(t.createdAt).toLocaleDateString('pt-BR')}</div>
        </td>
        <td class="px-6 py-4">
          <div class="text-sm font-medium text-gray-900">${t.title}</div>
          <div class="text-xs text-gray-500">${t.neighborhood || ''}</div>
        </td>
        <td class="px-6 py-4">
          <span class="px-2 py-1 text-xs rounded-full ${t.status === 'Resolvido' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">${t.status}</span>
        </td>
        <td class="px-6 py-4">
          <span class="px-2 py-1 text-xs rounded-full font-bold ${t.priority === 'Crítica' ? 'bg-red-100 text-red-800' : t.priority === 'Alta' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}">
            ${t.priority}
          </span>
        </td>
      </tr>
    `}).join('');

    return `
      ${Components.Header(State.user)}
      <div class="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        
        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div class="bg-white p-4 rounded shadow border-l-4 border-blue-900">
             <p class="text-xs text-gray-500 uppercase">Total</p>
             <p class="text-2xl font-bold">${tickets.length}</p>
           </div>
           <div class="bg-white p-4 rounded shadow border-l-4 border-red-500">
             <p class="text-xs text-gray-500 uppercase">Críticos</p>
             <p class="text-2xl font-bold">${critical}</p>
           </div>
           <div class="bg-white p-4 rounded shadow border-l-4 border-orange-500">
             <p class="text-xs text-gray-500 uppercase">Abertos</p>
             <p class="text-2xl font-bold">${open}</p>
           </div>
        </div>

        <div class="flex justify-between items-center">
           <h2 class="text-xl font-bold text-gray-800">Ocorrências Recentes</h2>
           <button onclick="Router.navigate('/new')" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow flex items-center gap-2">
             <span class="material-symbols-outlined">add</span> Novo Chamado
           </button>
        </div>

        <div class="bg-white rounded shadow overflow-hidden">
          <table class="min-w-full text-left">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Data</th>
                <th class="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Ocorrência</th>
                <th class="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Prioridade</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${ticketRows || '<tr><td colspan="4" class="p-6 text-center text-gray-400">Nenhum chamado.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  TicketForm() {
    return `
      ${Components.Header(State.user)}
      <div class="max-w-3xl mx-auto p-4">
        <div class="flex items-center gap-3 mb-6">
            <button onclick="Router.navigate('/')" class="text-gray-500 hover:text-blue-900"><span class="material-symbols-outlined">arrow_back</span></button>
            <h2 class="text-2xl font-bold text-gray-800">Novo Chamado</h2>
        </div>

        <form onsubmit="Handlers.submitTicket(event)" class="bg-white p-6 rounded shadow-md border-t-4 border-orange-500 space-y-6">
            
            <!-- Dados Solicitante -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Solicitante</label>
                    <input type="text" name="requesterName" required class="w-full border p-2 rounded mt-1 bg-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Telefone</label>
                    <input type="tel" name="phone" required class="w-full border p-2 rounded mt-1 bg-white">
                </div>
            </div>

            <!-- Ocorrência -->
            <div>
                <label class="block text-sm font-medium text-gray-700">Título da Ocorrência</label>
                <input type="text" name="title" required class="w-full border p-2 rounded mt-1 bg-white" placeholder="Ex: Queda de Árvore">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700">Descrição Detalhada</label>
                <textarea name="description" id="descInput" rows="4" required class="w-full border p-2 rounded mt-1 bg-white"></textarea>
            </div>

            <!-- Local -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Endereço</label>
                    <input type="text" name="address" required class="w-full border p-2 rounded mt-1 bg-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Bairro</label>
                    <input type="text" name="neighborhood" required class="w-full border p-2 rounded mt-1 bg-white">
                </div>
            </div>

            <!-- Botão GPS -->
             <button type="button" onclick="Handlers.getGPS()" id="btnGps" class="w-full py-3 border border-dashed border-gray-400 rounded text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50">
                <span class="material-symbols-outlined">my_location</span> Capturar Localização Atual
             </button>
             <input type="hidden" name="lat" id="lat">
             <input type="hidden" name="lng" id="lng">

             <!-- Prioridade -->
             <div class="border-t pt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                <select name="priority" id="priorityInput" class="w-full border p-2 rounded bg-white">
                    <option value="Baixa">Baixa</option>
                    <option value="Média" selected>Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                </select>
             </div>

            <button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded shadow">Salvar Chamado</button>
        </form>
      </div>
    `;
  },

  TicketDetails(id) {
    const ticket = State.tickets.find(t => t.id === id);
    if (!ticket) return `<div class="p-8 text-center">Chamado não encontrado. <button onclick="Router.navigate('/')">Voltar</button></div>`;

    return `
       ${Components.Header(State.user)}
       <div class="max-w-4xl mx-auto p-4 sm:p-8">
          <button onclick="Router.navigate('/')" class="mb-4 flex items-center text-gray-600 hover:text-blue-900">
             <span class="material-symbols-outlined mr-1">arrow_back</span> Voltar
          </button>

          <div class="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
             <div class="bg-gray-50 p-6 border-b flex justify-between items-start">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-sm font-mono text-gray-500">#${ticket.id}</span>
                        <span class="px-2 py-0.5 rounded text-xs font-bold uppercase border border-gray-300">${ticket.priority}</span>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900">${ticket.title}</h1>
                    <p class="text-sm text-gray-500">${new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
                <div class="text-right">
                    <div class="text-lg font-bold text-blue-900 uppercase">${ticket.status}</div>
                </div>
             </div>

             <div class="p-6 space-y-6">
                <div>
                    <h3 class="text-xs font-bold text-gray-500 uppercase mb-2">Descrição</h3>
                    <p class="text-gray-800 whitespace-pre-wrap">${ticket.description}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                        <h3 class="text-xs font-bold text-gray-500 uppercase mb-1">Solicitante</h3>
                        <p>${ticket.requesterName || '-'}</p>
                        <p class="text-sm text-gray-600">${ticket.phone || '-'}</p>
                    </div>
                    <div>
                        <h3 class="text-xs font-bold text-gray-500 uppercase mb-1">Localização</h3>
                        <p>${ticket.address}, ${ticket.neighborhood}</p>
                        ${ticket.location ? `
                          <a href="https://maps.google.com/?q=${ticket.location.latitude},${ticket.location.longitude}" target="_blank" class="text-blue-600 text-sm hover:underline flex items-center mt-1">
                            <span class="material-symbols-outlined text-sm mr-1">map</span> Ver no Mapa
                          </a>
                        ` : ''}
                    </div>
                </div>
             </div>
             
             <div class="bg-gray-50 p-4 border-t flex justify-end gap-2 print:hidden">
                <button onclick="window.print()" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-bold">Imprimir</button>
                ${ticket.status !== 'Resolvido' ? `
                  <button onclick="Handlers.updateStatus('${ticket.id}', 'Resolvido')" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-bold">Finalizar</button>
                ` : ''}
             </div>
          </div>
       </div>
    `;
  }
};

// --- 4. ROTEAMENTO E HANDLERS ---

const Handlers = {
  async login(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    
    try {
        const result = await DataService.login(email, pass);
        if (result.success) {
            State.user = result.user;
            Router.navigate('/');
        } else {
            alert(result.message);
        }
    } catch(err) {
        alert("Erro de conexão: " + err.message);
    }
  },

  logout() {
    DataService.logout();
    State.user = null;
    Router.navigate('/login');
  },

  async submitTicket(e) {
    e.preventDefault();
    const f = e.target;
    const user = State.user;
    
    const ticket = {
        id: `CH-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        requesterName: f.requesterName.value,
        phone: f.phone.value,
        title: f.title.value,
        description: f.description.value,
        address: f.address.value,
        neighborhood: f.neighborhood.value,
        priority: f.priority.value,
        status: 'Aberto',
        createdBy: user ? user.email : 'anon',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        location: f.lat.value ? { latitude: parseFloat(f.lat.value), longitude: parseFloat(f.lng.value) } : undefined,
        photos: []
    };

    await DataService.saveTicket(ticket);
    alert('Chamado criado com sucesso!');
    Router.navigate('/');
  },

  getGPS() {
    const btn = document.getElementById('btnGps');
    btn.innerText = 'Localizando...';
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            document.getElementById('lat').value = pos.coords.latitude;
            document.getElementById('lng').value = pos.coords.longitude;
            btn.className = "w-full py-3 border border-green-500 bg-green-50 text-green-700 rounded flex items-center justify-center gap-2";
            btn.innerHTML = '<span class="material-symbols-outlined">check</span> Localização Capturada';
        },
        (err) => {
            alert('Erro ao obter GPS: ' + err.message);
            btn.innerText = 'Tentar Novamente GPS';
        }
    );
  },
  
  async updateStatus(id, status) {
      const ticket = await DataService.getTicketById(id);
      if(ticket) {
          ticket.status = status;
          ticket.updatedAt = new Date().toISOString();
          await DataService.saveTicket(ticket);
          alert('Status atualizado!');
          Router.render(); // Re-render current page
      }
  }
};

const Router = {
  init() {
    window.addEventListener('popstate', () => this.render());
    const session = DataService.getCurrentUser();
    if (session) {
        State.user = session;
        this.navigate(window.location.hash.replace('#', '') || '/');
    } else {
        this.navigate('/login');
    }
  },

  navigate(path) {
    window.location.hash = path;
    State.currentRoute = path;
    this.render();
  },

  async render() {
    const app = document.getElementById('app');
    const route = State.currentRoute;

    // Guards
    if (!State.user && !route.includes('/login')) {
        this.navigate('/login');
        return;
    }

    // Route Matching
    if (route === '/login') {
        app.innerHTML = Components.Login();
    } else if (route === '/') {
        // Load Data
        State.tickets = await DataService.getTickets();
        app.innerHTML = Components.Dashboard();
    } else if (route === '/new') {
        app.innerHTML = Components.TicketForm();
    } else if (route.startsWith('/ticket/')) {
        const id = route.split('/ticket/')[1];
        app.innerHTML = Components.TicketDetails(id);
    } else {
        app.innerHTML = '<div class="p-10 text-center">Página não encontrada.</div>';
    }
  }
};

// Start App
document.addEventListener('DOMContentLoaded', () => Router.init());