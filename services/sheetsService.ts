
// DEPRECATED: This service has been replaced by FirebaseService.
// Keeping this file with minimal exports to prevent immediate build errors during transition
// if referenced elsewhere, though references should be removed.

import { Ticket } from '../types';

export const SheetsService = {
  fetchTickets: async (accessToken: string, spreadsheetId: string): Promise<Ticket[]> => {
    console.warn("SheetsService is deprecated. Use FirebaseService instead.");
    return [];
  },
  appendTicket: async (accessToken: string, spreadsheetId: string, ticket: Ticket): Promise<void> => {
    console.warn("SheetsService is deprecated. Use FirebaseService instead.");
  },
  updateTicket: async (accessToken: string, spreadsheetId: string, ticket: Ticket): Promise<void> => {
    console.warn("SheetsService is deprecated. Use FirebaseService instead.");
  }
};
