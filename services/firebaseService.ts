import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, setDoc, query, orderBy, Firestore } from 'firebase/firestore';
import { Ticket } from '../types';

// Configuration Interface
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

const COLLECTION_NAME = 'tickets';

export const FirebaseService = {
  /**
   * Inicializa o Firebase com a configuração salva
   */
  init: (config: FirebaseConfig) => {
    try {
      // Evita reinicializar se já existe
      if (!app) {
        app = initializeApp(config);
        db = getFirestore(app);
        console.log("[Firebase] Inicializado com sucesso.");
      }
      return true;
    } catch (error) {
      console.error("[Firebase] Erro na inicialização:", error);
      return false;
    }
  },

  isInitialized: () => {
    return !!db;
  },

  /**
   * Busca todos os chamados do Firestore
   */
  fetchTickets: async (): Promise<Ticket[]> => {
    if (!db) throw new Error("Firebase não inicializado");

    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const tickets: Ticket[] = [];
    querySnapshot.forEach((doc) => {
      tickets.push(doc.data() as Ticket);
    });
    
    return tickets;
  },

  /**
   * Salva ou Atualiza um chamado no Firestore
   * Usamos o setDoc com o ID do ticket para garantir idempotência e atualização fácil
   */
  saveTicket: async (ticket: Ticket): Promise<void> => {
    if (!db) throw new Error("Firebase não inicializado");

    // Cria uma referência direta usando o ID do ticket
    // Isso permite que 'save' funcione tanto para Criar quanto para Editar
    const ticketRef = doc(db, COLLECTION_NAME, ticket.id);
    
    await setDoc(ticketRef, ticket, { merge: true });
  }
};