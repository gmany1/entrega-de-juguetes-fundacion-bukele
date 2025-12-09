import React from 'react';
import { Gift, Calendar, Heart } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';

const Hero: React.FC = () => {
  const { config } = useConfig();

  const containerStyle = config.heroBackgroundImage
    ? { 
        backgroundImage: `linear-gradient(rgba(30, 58, 138, 0.8), rgba(30, 58, 138, 0.9)), url(${config.heroBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : {
        background: `
          linear-gradient(135deg, rgba(30, 58, 138, 1) 0%, rgba(30, 64, 175, 1) 100%),
          url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
        `
    };

  const bgClasses = "relative text-white overflow-hidden";

  return (
    <div className={bgClasses} style={containerStyle}>
      {/* Decorative large circle if no image to add depth */}
      {!config.heroBackgroundImage && (
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
      )}

      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10 text-center">
        <div className="flex justify-center mb-6">
           <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm shadow-xl animate-fade-in-up">
             <Gift className="w-12 h-12 md:w-16 md:h-16 text-yellow-300" />
           </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight drop-shadow-md animate-fade-in-up delay-100">
          {config.heroTitle}
        </h1>
        <h2 className="text-xl md:text-2xl font-light text-blue-100 mb-8 max-w-3xl mx-auto drop-shadow-sm animate-fade-in-up delay-200">
          {config.heroSubtitle}
        </h2>

        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8 items-center text-blue-50 animate-fade-in-up delay-300">
          <div className="flex items-center gap-2 bg-blue-800/50 px-6 py-2 rounded-full backdrop-blur-md border border-blue-400/30 shadow-sm">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">{config.eventDate}</span>
          </div>
          <div className="flex items-center gap-2 drop-shadow-sm">
            <Heart className="w-5 h-5 text-red-400 fill-current" />
            <span>Un compromiso con nuestra niñez</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;