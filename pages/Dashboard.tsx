
import React, { useEffect, useState } from 'react';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { StorageService } from '../services/storageService';
import { Link } from 'react-router-dom';

interface DashboardProps {
  //
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTickets = async () => {
      // Se for a primeira carga e estivermos vazios, mostra loading
      if (tickets.length === 0) setLoading(true);
      try {
        const data = await StorageService.getTickets();
        setTickets(data);
      } catch (error) {
        console.error("Erro ao carregar tickets", error);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
    // Poll for updates every 30 seconds to avoid hitting API rate limits too hard
    const interval = setInterval(loadTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.CRITICAL: return 'bg-red-100 text-red-800 border-red-200';
      case TicketPriority.HIGH: return 'bg-orange-100 text-orange-800 border-orange-200';
      case TicketPriority.MEDIUM: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case TicketPriority.LOW: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch(status) {
      case TicketStatus.OPEN: return 'fiber_new';
      case TicketStatus.IN_PROGRESS: return 'pending';
      case TicketStatus.RESOLVED: return 'check_circle';
      case TicketStatus.CANCELLED: return 'cancel';
      default: return 'help';
    }
  };

  const filteredTickets = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-civil-blue">
          <p className="text-gray-500 text-xs font-medium uppercase">Total de Chamados</p>
          <p className="text-2xl font-bold text-gray-800">{tickets.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500">
          <p className="text-gray-500 text-xs font-medium uppercase">Críticos</p>
          <p className="text-2xl font-bold text-gray-800">{tickets.filter(t => t.priority === TicketPriority.CRITICAL).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-gray-500 text-xs font-medium uppercase">Resolvidos</p>
          <p className="text-2xl font-bold text-gray-800">{tickets.filter(t => t.status === TicketStatus.RESOLVED).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-civil-orange">
          <p className="text-gray-500 text-xs font-medium uppercase">Em Aberto</p>
          <p className="text-2xl font-bold text-gray-800">{tickets.filter(t => t.status === TicketStatus.OPEN).length}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex bg-white rounded-lg p-1 shadow-sm w-full sm:w-auto overflow-x-auto">
          {(['ALL', TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                filter === s 
                  ? 'bg-civil-blue text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s === 'ALL' ? 'Todos' : s}
            </button>
          ))}
        </div>
        
        <Link 
          to="/new" 
          className="w-full sm:w-auto bg-civil-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg shadow-md flex items-center justify-center gap-2 font-medium transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          Novo Chamado
        </Link>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <span className="animate-spin inline-block h-8 w-8 border-4 border-gray-300 border-t-civil-blue rounded-full mb-2"></span>
            <p>Sincronizando com a base de dados...</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">ID / Data</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Ocorrência / Bairro</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Prioridade</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ticket.id}</div>
                    <div className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 line-clamp-1">{ticket.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">
                      {ticket.neighborhood ? `${ticket.neighborhood} - ` : ''}{ticket.address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <span className={`material-symbols-outlined text-lg ${
                        ticket.status === TicketStatus.RESOLVED ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {getStatusIcon(ticket.status)}
                      </span>
                      {ticket.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/ticket/${ticket.id}`} className="text-civil-blue hover:text-blue-900 bg-blue-50 p-2 rounded-full inline-flex group-hover:bg-blue-100 transition-colors">
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                    <p>Nenhum chamado encontrado.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};
