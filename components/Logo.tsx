
import React, { useState } from 'react';

// URL do Brasão.
// FORMATO IDEAL: PNG com fundo transparente.
const DEFAULT_CREST_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Bras%C3%A3o_de_Bertioga.svg/320px-Bras%C3%A3o_de_Bertioga.svg.png";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean; 
}

export const DefesaCivilLogo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  return (
    <div className={`relative flex items-center justify-center ${dimensions[size]} ${className}`}>
      {/* Orange Hexagon Background */}
      <div 
        className="absolute inset-0 bg-civil-orange shadow-sm" 
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          zIndex: 0
        }}
      ></div>
      
      {/* Blue Triangle */}
      <div 
        className="absolute inset-0 bg-civil-blue" 
        style={{
          clipPath: 'polygon(50% 10%, 90% 80%, 10% 80%)',
          zIndex: 10
        }}
      ></div>
      
      {/* City Crest / Logo - Centralizado no triângulo azul */}
      {!imgError ? (
        <img 
          src={DEFAULT_CREST_URL} 
          alt="Brasão Bertioga" 
          onError={() => setImgError(true)}
          className="relative z-20 h-[50%] w-auto object-contain mt-[10%] drop-shadow-sm transition-transform hover:scale-110"
        />
      ) : (
        // Fallback caso a imagem quebre
        <span 
          className="material-symbols-outlined text-white relative z-20 mt-[10%]"
          style={{ fontSize: size === 'sm' ? '1rem' : size === 'md' ? '1.5rem' : '2.5rem' }}
        >
          shield
        </span>
      )}
    </div>
  );
};
