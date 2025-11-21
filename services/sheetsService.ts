
import { Ticket, TicketPriority, TicketStatus } from '../types';

// ID da planilha pode ser sobrescrito pelo StorageService, mas mantemos a constante como fallback/referência
const DEFAULT_SPREADSHEET_ID = '1jx6w0zTpGUSCxahIx985EU-rxLlIx5z8jEU5gYjpT9A';
const SHEET_NAME = 'Página1'; 

export const SheetsService = {
  /**
   * Valida se o objeto Ticket tem os dados mínimos necessários para ser salvo
   */
  validateTicketPayload: (ticket: Ticket): string | null => {
    if (!ticket.id) return "ID do chamado é obrigatório.";
    if (!ticket.title) return "Título da ocorrência é obrigatório.";
    if (!ticket.createdAt) return "Data de criação inválida.";
    if (!ticket.status) return "Status do chamado inválido.";
    return null; // Sem erros
  },

  /**
   * Converte um objeto Ticket para uma linha (array) do Google Sheets
   * Garante que NULL ou UNDEFINED virem strings vazias para não quebrar a API
   * Ordem: Nome, Data, Telefone, Endereço, Bairro, Fato/Ocorrência, Urgência, Status, Localização, Observação, Imagem
   */
  mapTicketToRow: (ticket: Ticket): any[] => {
    // Helper para garantir string segura
    const safeStr = (val: any) => (val === null || val === undefined) ? '' : String(val);

    // Formatar localização como string legível
    const locationStr = ticket.location 
      ? `${ticket.location.latitude}, ${ticket.location.longitude}` 
      : '';

    // Pegar a primeira foto como principal, ou string vazia
    // NOTA: Células do Sheets tem limite de 50k caracteres. Base64 grandes podem falhar.
    // Idealmente enviariamos para o Google Drive e colocariamos o Link, mas para este scopo, tentamos colocar o dado.
    const mainPhoto = ticket.photos && ticket.photos.length > 0 ? ticket.photos[0] : '';
    const photoDisplay = mainPhoto.length > 40000 ? "Imagem muito grande para exibição direta" : mainPhoto;

    return [
      safeStr(ticket.requesterName),           // A: Nome do Solicitante
      safeStr(ticket.createdAt),               // B: Data
      safeStr(ticket.phone),                   // C: Telefone
      safeStr(ticket.address),                 // D: Endereço
      safeStr(ticket.neighborhood),            // E: Bairro
      safeStr(ticket.title),                   // F: Fato/Ocorrência
      safeStr(ticket.priority),                // G: Urgência
      safeStr(ticket.status),                  // H: Status
      safeStr(locationStr),                    // I: Localização
      safeStr(ticket.aiAnalysis || ticket.description), // J: Observação
      safeStr(photoDisplay),                   // K: Imagem (Visual)
      
      // Campos Técnicos/Extras (ficam no final)
      safeStr(ticket.id),                            // L: ID
      safeStr(ticket.description),                   // M: Descrição Completa
      JSON.stringify(ticket.photos || []),           // N: Todas as fotos (JSON Array Seguro)
      safeStr(ticket.createdBy)                      // O: Criado Por
    ];
  },

  /**
   * Converte uma linha (array) do Google Sheets para um objeto Ticket
   */
  mapRowToTicket: (row: any[]): Ticket => {
    // Garante que row é um array
    if (!Array.isArray(row)) return {} as Ticket;

    // Tenta recuperar todas as fotos do JSON na coluna N (índice 13)
    let photos: string[] = [];
    try {
      if (row[13]) {
        photos = JSON.parse(row[13]);
      } else if (row[10] && !row[10].startsWith("Imagem muito grande")) {
        photos = [row[10]];
      }
    } catch (e) {
      photos = [];
    }

    // Reconstruir objeto de localização
    let location = undefined;
    if (row[8] && typeof row[8] === 'string' && row[8].includes(',')) {
      const parts = row[8].split(',');
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        location = { latitude: lat, longitude: lng };
      }
    }

    // Mapeamento reverso seguro dos Enums
    const statusMap: Record<string, TicketStatus> = {
      'Aberto': TicketStatus.OPEN,
      'Em Andamento': TicketStatus.IN_PROGRESS,
      'Resolvido': TicketStatus.RESOLVED,
      'Cancelado': TicketStatus.CANCELLED
    };

    const priorityMap: Record<string, TicketPriority> = {
      'Baixa': TicketPriority.LOW,
      'Média': TicketPriority.MEDIUM,
      'Alta': TicketPriority.HIGH,
      'Crítica': TicketPriority.CRITICAL
    };

    return {
      requesterName: row[0] || '',
      createdAt: row[1] || new Date().toISOString(),
      updatedAt: row[1] || new Date().toISOString(),
      phone: row[2] || '',
      address: row[3] || '',
      neighborhood: row[4] || '',
      title: row[5] || 'Sem Título',
      priority: priorityMap[row[6]] || TicketPriority.MEDIUM,
      status: statusMap[row[7]] || TicketStatus.OPEN,
      location: location,
      aiAnalysis: row[9] || '',
      
      // Campos técnicos
      id: row[11] || 'unknown',
      description: row[12] || row[5] || '', 
      photos: photos,
      createdBy: row[14] || 'system'
    };
  },

  /**
   * Busca todos os chamados da planilha
   */
  fetchTickets: async (accessToken: string, spreadsheetId: string = DEFAULT_SPREADSHEET_ID): Promise<Ticket[]> => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A2:O?majorDimension=ROWS`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
         if (response.status === 403) throw new Error("Permissão negada. Verifique se o e-mail tem acesso à planilha.");
         if (response.status === 404) throw new Error("Planilha não encontrada. Verifique o ID.");
         throw new Error(`Erro Google Sheets API: ${response.statusText}`);
      }

      const result = await response.json();
      const rows = result.values || [];
      
      return rows
        .filter((r: any[]) => r.length > 0 && r[11]) // Filtra linhas vazias e garante que tenha ID (coluna L/11)
        .map(SheetsService.mapRowToTicket);
    } catch (error) {
      console.error('Falha ao buscar dados da planilha:', error);
      throw error;
    }
  },

  /**
   * Adiciona um novo chamado na planilha
   */
  appendTicket: async (accessToken: string, spreadsheetId: string = DEFAULT_SPREADSHEET_ID, ticket: Ticket): Promise<void> => {
    // 1. Validação
    const validationError = SheetsService.validateTicketPayload(ticket);
    if (validationError) {
      throw new Error(`Validação falhou: ${validationError}`);
    }

    try {
      const row = SheetsService.mapTicketToRow(ticket);
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A1:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [row] }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        const errorMessage = err.error?.message || response.statusText;
        console.error("Erro detalhado API Sheets:", err);
        throw new Error(`Falha ao salvar na planilha: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erro ao enviar dados para planilha:', error);
      throw error;
    }
  },

  /**
   * Atualiza um chamado existente na planilha
   */
  updateTicket: async (accessToken: string, spreadsheetId: string = DEFAULT_SPREADSHEET_ID, ticket: Ticket): Promise<void> => {
    // 1. Validação
    const validationError = SheetsService.validateTicketPayload(ticket);
    if (validationError) throw new Error(validationError);

    try {
      // 2. Busca a coluna de IDs para encontrar a linha correta
      const idResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!L:L?majorDimension=COLUMNS`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      if (!idResponse.ok) throw new Error("Não foi possível ler a coluna de IDs para atualização.");

      const idData = await idResponse.json();
      const ids = idData.values ? idData.values[0] : [];
      
      // Encontra o índice
      const rowIndex = ids.indexOf(ticket.id);
      
      if (rowIndex === -1) {
        // Se não achou o ID, tenta adicionar como novo (fallback)
        console.warn("ID não encontrado para atualização, tentando adicionar como novo...");
        return SheetsService.appendTicket(accessToken, spreadsheetId, ticket);
      }
      
      const sheetRow = rowIndex + 1;
      const rowData = SheetsService.mapTicketToRow(ticket);

      // 3. Atualiza a linha específica
      const updateResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_NAME}!A${sheetRow}:O${sheetRow}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [rowData] }),
        }
      );

      if (!updateResponse.ok) throw new Error('Falha ao atualizar linha na planilha');

    } catch (error) {
      console.error('Erro ao atualizar dados na planilha:', error);
      throw error;
    }
  }
};
