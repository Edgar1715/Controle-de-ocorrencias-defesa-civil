
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ticket, TicketPriority, TicketStatus, UserRole } from '../types';
import { StorageService } from '../services/storageService';
import { DefesaCivilLogo } from '../components/Logo';

export const TicketDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState(StorageService.getCurrentUser());

  useEffect(() => {
    const loadTicket = async () => {
      if (!id) return;
      const t = await StorageService.getTicketById(id);
      setTicket(t || null);
      setLoading(false);
    };
    loadTicket();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Carregando detalhes...</div>;
  if (!ticket) return <div className="p-8 text-center text-red-600">Chamado não encontrado.</div>;

  // Permissions Logic (RBAC)
  const isOwner = user?.email === ticket.createdBy;
  const isAdmin = user?.role === UserRole.ADMIN;
  const isCoordinator = user?.role === UserRole.COORDINATOR;
  const isOperator = user?.role === UserRole.OPERATOR;

  const isCoordOrAdmin = isAdmin || isCoordinator;

  // Permissão Geral de Edição (Todos podem editar/assumir/resolver, se não estiver cancelado)
  const canEdit = isOwner || isCoordOrAdmin || isOperator;
  
  // Operadores, Coords e Admins podem Resolver
  const canResolve = canEdit;

  // SOMENTE Coordenadores e Admins podem Cancelar
  const canCancel = isCoordOrAdmin;

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    setIsSaving(true);
    
    const updatedTicket = { ...ticket, status: newStatus, updatedAt: new Date().toISOString() };
    await StorageService.saveTicket(updatedTicket);
    
    setTicket(updatedTicket);
    setIsSaving(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const getPriorityColor = (p: TicketPriority) => {
    switch (p) {
      case TicketPriority.CRITICAL: return 'bg-red-600 text-white';
      case TicketPriority.HIGH: return 'bg-orange-500 text-white';
      case TicketPriority.MEDIUM: return 'bg-yellow-500 text-white';
      case TicketPriority.LOW: return 'bg-green-600 text-white';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Print Header (Visible only when printing) */}
      <div className="hidden print:flex flex-col items-center mb-8 border-b-2 border-black pb-4">
        <DefesaCivilLogo size="lg" showText={true} className="mb-4" />
        <h1 className="text-2xl font-bold uppercase text-center">Defesa Civil de Bertioga - SP</h1>
        <h2 className="text-xl font-semibold mt-1">Relatório de Ocorrência</h2>
        <p className="text-sm mt-2">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
      </div>

      {/* Screen Header */}
      <div className="print:hidden flex justify-between items-center mb-6">
        <button onClick={() => navigate('/')} className="flex items-center text-gray-600 hover:text-civil-blue">
          <span className="material-symbols-outlined mr-1">arrow_back</span> Voltar
        </button>
        
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">print</span>
            Imprimir PDF
          </button>
          
          {canEdit && (
            <div className="flex gap-1">
               {/* Status Actions */}
               {ticket.status !== TicketStatus.IN_PROGRESS && ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CANCELLED && (
                 <button 
                   onClick={() => handleStatusChange(TicketStatus.IN_PROGRESS)}
                   disabled={isSaving}
                   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                 >
                   Assumir
                 </button>
               )}
               
               {canResolve && ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CANCELLED && (
                 <button 
                   onClick={() => handleStatusChange(TicketStatus.RESOLVED)}
                   disabled={isSaving}
                   className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                 >
                   Finalizar
                 </button>
               )}

              {canCancel && ticket.status !== TicketStatus.CANCELLED && (
                 <button 
                   onClick={() => handleStatusChange(TicketStatus.CANCELLED)}
                   disabled={isSaving}
                   className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                 >
                   Cancelar
                 </button>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden print:shadow-none print:border print:border-gray-300">
        {/* Status Banner */}
        <div className="bg-gray-50 p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4 print:bg-white print:border-b-2 print:border-black relative overflow-hidden">
          {/* Decorative Logo watermark */}
          <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none print:hidden">
            <DefesaCivilLogo size="xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-gray-500">#{ticket.id}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getPriorityColor(ticket.priority)} print:border print:border-black print:text-black print:bg-transparent`}>
                Urgência: {ticket.priority}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{ticket.title}</h1>
            <p className="text-sm text-gray-500">Data: {new Date(ticket.createdAt).toLocaleString('pt-BR')}</p>
          </div>
          <div className="text-right sm:text-right relative z-10">
             <p className="text-sm text-gray-500">Status Atual</p>
             <p className="text-lg font-bold text-civil-blue uppercase">{ticket.status}</p>
             <p className="text-xs text-gray-400 mt-1">Atendente: {ticket.createdBy}</p>
          </div>
        </div>

        {/* Requester Info Row (New) */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-200 print:border-black print:border-b">
           <div className="p-4 border-b md:border-b-0 md:border-r border-gray-200 print:border-black">
              <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Solicitante</span>
              <span className="text-gray-900 font-medium">{ticket.requesterName || 'Não informado'}</span>
           </div>
           <div className="p-4">
              <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone / Contato</span>
              <span className="text-gray-900 font-medium">{ticket.phone || 'Não informado'}</span>
           </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="md:col-span-2 space-y-8">
            
            <section>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-b pb-1 border-gray-200 print:border-black">Fato / Ocorrência (Descrição)</h3>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </section>

            <section className={`${ticket.aiAnalysis ? '' : 'hidden'}`}>
               <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-b pb-1 border-gray-200 print:border-black">Observação / Análise</h3>
               <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 print:bg-white print:border-0 print:p-0">
                 <p className="text-sm text-blue-900 print:text-black">{ticket.aiAnalysis}</p>
               </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 border-b pb-1 border-gray-200 print:border-black">Imagens (Evidências)</h3>
              {ticket.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {ticket.photos.map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-200 print:border-black">
                      <img src={photo} alt={`Evidência ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">Nenhuma foto registrada.</p>
              )}
            </section>
          </div>

          {/* Right Column: Location & Meta */}
          <div className="space-y-6">
            <section className="bg-gray-50 p-4 rounded-lg border border-gray-200 print:bg-white print:border print:border-black">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-civil-orange">location_on</span>
                Localização
              </h3>
              
              <div className="mb-3">
                 <span className="block text-xs text-gray-500 uppercase">Endereço</span>
                 <p className="text-gray-800 font-medium">{ticket.address}</p>
              </div>
              
              <div className="mb-3">
                 <span className="block text-xs text-gray-500 uppercase">Bairro</span>
                 <p className="text-gray-800 font-medium">{ticket.neighborhood || 'Não informado'}</p>
              </div>

              {ticket.location && (
                <div className="text-sm text-gray-600 space-y-2 border-t border-gray-200 pt-2 print:border-black">
                  <div className="flex justify-between">
                    <span>Latitude:</span>
                    <span className="font-mono">{ticket.location.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longitude:</span>
                    <span className="font-mono">{ticket.location.longitude.toFixed(6)}</span>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${ticket.location.latitude},${ticket.location.longitude}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block mt-3 text-center bg-white border border-gray-300 text-civil-blue py-2 rounded hover:bg-gray-50 text-xs font-bold print:hidden"
                  >
                    ABRIR NO MAPS
                  </a>
                </div>
              )}
            </section>

            <section className="bg-gray-50 p-4 rounded-lg border border-gray-200 print:hidden">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Histórico</h3>
              <div className="space-y-4">
                <div className="relative pl-4 border-l-2 border-civil-blue">
                  <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-civil-blue"></div>
                  <p className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleString()}</p>
                  <p className="text-sm font-medium">Chamado Aberto</p>
                </div>
                <div className="relative pl-4 border-l-2 border-gray-300">
                  <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                  <p className="text-xs text-gray-500">{new Date(ticket.updatedAt).toLocaleString()}</p>
                  <p className="text-sm font-medium">Última Atualização</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block mt-12 pt-8 border-t-2 border-black mx-8 mb-8">
           <div className="flex justify-between text-xs">
             <div className="text-center w-1/3">
               <div className="border-b border-black h-8 mb-2"></div>
               <p>Responsável Defesa Civil</p>
             </div>
             <div className="text-center w-1/3">
               <div className="border-b border-black h-8 mb-2"></div>
               <p>Visto Coordenação</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
