import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';

const WhatsAppFloat: React.FC = () => {
  const { config } = useConfig();
  
  return (
    <a
      href={`https://wa.me/${config.orgPhoneNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-xl hover:bg-green-600 transition-transform hover:scale-110 flex items-center justify-center"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-8 h-8 fill-current" />
    </a>
  );
};

export default WhatsAppFloat;