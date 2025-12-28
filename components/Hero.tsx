import React from 'react';
import { Calendar, Heart, MapPin } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';

const Hero: React.FC = () => {
  const { config } = useConfig();

  const containerStyle = config.heroBackgroundImage
    ? {
      backgroundImage: `linear-gradient(rgba(30, 41, 59, 0.4), rgba(30, 41, 59, 0.6)), url(${config.heroBackgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
    : {
      background: `
          linear-gradient(135deg, #1e293b 0%, #0f172a 100%)
        `
    };

  return (
    <div className="relative text-[#fcfbf9] overflow-hidden min-h-[500px] flex items-center" style={containerStyle}>
      <div className="container mx-auto px-4 py-16 relative z-10 text-center">

        <div className="inline-block border-y border-[#c5a059] py-2 px-8 mb-6 animate-fade-in-up">
          <span className="uppercase tracking-[0.3em] text-sm font-medium text-[#e6cfa3]">Nos Casamos</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 font-serif leading-none drop-shadow-lg animate-fade-in-up delay-100">
          {config.heroTitle}
        </h1>
        <h2 className="text-xl md:text-2xl font-light text-[#e6cfa3] mb-10 max-w-2xl mx-auto font-serif italic animate-fade-in-up delay-200">
          {config.heroSubtitle}
        </h2>

        <div className="flex flex-col md:flex-row justify-center gap-8 items-center text-white/90 animate-fade-in-up delay-300">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#c5a059]" />
            <span className="font-medium tracking-wide border-r border-white/20 pr-8">{config.eventDate}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#c5a059]" />
            <span className="font-medium tracking-wide">{config.venueName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
