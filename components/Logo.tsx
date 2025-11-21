
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';

// URL estável da Wikimedia para o Brasão de Bertioga (Fallback)
const DEFAULT_CREST_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Bras%C3%A3o_de_Bertioga.svg/320px-Bras%C3%A3o_de_Bertioga.svg.png";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const DefesaCivilLogo: React.FC<LogoProps> = ({ size = 'md', className = '', showText = false }) => {
  const [logoSrc, setLogoSrc] = useState<string>(DEFAULT_CREST_URL);

  useEffect(() => {
    // Verifica se existe um logo customizado salvo
    const customLogo = StorageService.getCustomLogo();
    if (customLogo) {
      setLogoSrc(customLogo);
    }
  }, []);

  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const textSize = {
    sm: 'text-[0.4rem]',
    md: 'text-[0.6rem]',
    lg: 'text-[0.8rem]',
    xl: 'text-xs',
  };

  return (
    <div className={`relative flex items-center justify-center ${dimensions[size]} ${className}`}>
      {/* Orange Hexagon Background */}
      <div 
        className="absolute inset-0 bg-civil-orange shadow-sm" 
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
        }}
      ></div>
      
      {/* Blue Triangle */}
      <div 
        className="absolute inset-0 bg-civil-blue" 
        style={{
          clipPath: 'polygon(50% 10%, 90% 80%, 10% 80%)' 
        }}
      ></div>
      
      {/* City Crest / Logo */}
      <img 
        src={logoSrc} 
        alt="Brasão Bertioga" 
        className="relative z-10 h-[40%] w-auto object-contain mb-1 drop-shadow-md transition-opacity"
        onError={(e) => {
          // Se falhar, tenta voltar para o default se não for ele, ou esconde
          if (logoSrc !== DEFAULT_CREST_URL) {
             setLogoSrc(DEFAULT_CREST_URL);
          } else {
             (e.target as HTMLImageElement).style.display = 'none';
          }
        }}
      />
      
      {/* Text Overlay */}
      <div className={`absolute bottom-[15%] z-10 font-bold text-white/90 tracking-widest ${textSize[size]} w-full text-center drop-shadow-sm`}>
        DEFESA CIVIL
      </div>
    </div>
  );
};
