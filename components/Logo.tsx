import React from 'react';

const BERTIOGA_CREST_URL = "https://share.google/images/7aLm6muU7brLIzSV3";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const DefesaCivilLogo: React.FC<LogoProps> = ({ size = 'md', className = '', showText = false }) => {
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
      
      {/* City Crest - Com tratamento de erro para não ficar 'feio' se o link quebrar */}
      <img 
        src={BERTIOGA_CREST_URL} 
        alt="Brasão Bertioga" 
        className="relative z-10 h-[45%] w-auto object-contain mb-1"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none'; // Oculta se quebrar, mantendo o logo geométrico limpo
        }}
      />
      
      {/* Text Overlay */}
      <div className={`absolute bottom-[18%] z-10 font-bold text-civil-blue tracking-widest ${textSize[size]} w-full text-center`}>
        DEFESA CIVIL
      </div>
    </div>
  );
};