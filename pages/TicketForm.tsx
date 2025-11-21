
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { StorageService } from '../services/storageService';
import { analyzeIncident } from '../services/geminiService';
import { DefesaCivilLogo } from '../components/Logo';

export const TicketForm: React.FC = () => {
  const navigate = useNavigate();
  
  // Form Fields
  const [requesterName, setRequesterName] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.LOW);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador.');
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoadingLocation(false);
      },
      (error) => {
        console.error(error);
        alert('Erro ao obter localização. Verifique as permissões.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotos(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (description.length < 10) {
      alert('Por favor, descreva o incidente com mais detalhes antes da análise.');
      return;
    }
    setIsAnalyzing(true);
    const result = await analyzeIncident(description);
    setPriority(result.priority);
    setAiSuggestion(result.summary);
    setIsAnalyzing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const user = StorageService.getCurrentUser();
    
    const newTicket: Ticket = {
      id: `CH-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      requesterName,
      phone,
      title,
      description,
      address,
      neighborhood,
      location: location ? { latitude: location.lat, longitude: location.lng } : undefined,
      status: TicketStatus.OPEN,
      priority,
      createdBy: user?.email || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photos,
      aiAnalysis: aiSuggestion || undefined
    };

    try {
      await StorageService.saveTicket(newTicket);
      setIsSaving(false);
      navigate('/');
    } catch (error) {
      console.error("Erro no fluxo de salvamento:", error);
      alert("O chamado foi salvo localmente, mas houve um erro ao enviar para o banco de dados. Verifique sua conexão.");
      setIsSaving(false);
      navigate('/');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <DefesaCivilLogo size="md" />
            <h2 className="text-2xl font-bold text-gray-800">Novo Chamado</h2>
        </div>
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6 border-t-4 border-civil-orange">
        
        {/* Requester Info */}
        <div className="space-y-4 border-b border-gray-100 pb-4">
           <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             <span className="material-symbols-outlined text-civil-blue">person</span>
             Dados do Solicitante
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Solicitante</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white text-gray-900 rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-civil-orange focus:border-transparent placeholder-gray-400"
                  placeholder="Nome completo"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Contato</label>
                <input
                  type="tel"
                  required
                  className="w-full bg-white text-gray-900 rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-civil-orange focus:border-transparent placeholder-gray-400"
                  placeholder="(13) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
             </div>
           </div>
        </div>

        {/* Incident Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             <span className="material-symbols-outlined text-civil-blue">warning</span>
             Dados da Ocorrência
           </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fato / Ocorrência (Título)</label>
            <input
              type="text"
              required
              className="w-full bg-white text-gray-900 rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-civil-orange focus:border-transparent placeholder-gray-400"
              placeholder="Ex: Queda de árvore, Alagamento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada</label>
            <textarea
              required
              rows={4}
              className="w-full bg-white text-gray-900 rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-civil-orange focus:border-transparent placeholder-gray-400"
              placeholder="Descreva a situação, riscos e danos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !description}
                className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <span className="animate-spin h-3 w-3 border-2 border-indigo-700 border-t-transparent rounded-full"></span>
                ) : (
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                )}
                Analisar Urgência com IA
              </button>
            </div>
            {aiSuggestion && (
              <div className="mt-2 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100 flex gap-2">
                 <span className="material-symbols-outlined text-lg">psychology</span>
                 <div>
                   <p className="font-bold text-xs uppercase">Sugestão Gemini</p>
                   <p>{aiSuggestion}</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-civil-blue">location_on</span>
            Localização
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white text-gray-900 rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-civil-orange focus:border-transparent placeholder-gray-400"
                  placeholder="Rua, Número"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white text-gray-900 rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-civil-orange focus:border-transparent placeholder-gray-400"
                  placeholder="Ex: Centro, Riviera"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
             </div>
          </div>

          <div className="flex items-center gap-4">
             <button
               type="button"
               onClick={handleGetLocation}
               disabled={loadingLocation}
               className={`flex-1 py-3 rounded-lg border border-dashed border-gray-400 text-gray-600 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-civil-blue hover:text-civil-blue transition-all ${location ? 'bg-green-50 border-green-500 text-green-700' : ''}`}
             >
               {loadingLocation ? (
                  <span className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></span>
               ) : location ? (
                 <>
                   <span className="material-symbols-outlined">my_location</span>
                   Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                 </>
               ) : (
                 <>
                   <span className="material-symbols-outlined">add_location_alt</span>
                   Capturar GPS Atual
                 </>
               )}
             </button>
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-civil-blue">photo_camera</span>
            Vistoria Fotográfica (Imagens)
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            {photos.map((p, idx) => (
              <div key={idx} className="aspect-square rounded-lg overflow-hidden relative shadow-md group">
                <img src={p} alt="Evidência" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-civil-orange hover:text-civil-orange hover:bg-orange-50 transition-all"
            >
              <span className="material-symbols-outlined text-3xl">add_a_photo</span>
              <span className="text-xs font-medium mt-1">Adicionar</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Classification */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-civil-blue">priority_high</span>
            Classificação (Urgência)
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nível de Prioridade</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.values(TicketPriority) as TicketPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-md text-sm font-medium transition-all ${
                    priority === p 
                      ? 'bg-civil-blue text-white shadow-md ring-2 ring-offset-1 ring-civil-blue' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-civil-orange hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
               <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
               <>
                 <span className="material-symbols-outlined">save</span>
                 Registrar Chamado
               </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
