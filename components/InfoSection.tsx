import React from 'react';
import { MapPin, Users, Info, MessageCircle } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';

const InfoSection: React.FC = () => {
  const { config } = useConfig();

  return (
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
          
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto md:mx-0">
              <Users className="text-blue-600 w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{config.infoTargetTitle}</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
              {config.infoTargetDescription}
            </p>
          </div>

          <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
             <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto md:mx-0">
              <Info className="text-blue-600 w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{config.infoRequirementsTitle}</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
              {config.infoRequirementsDescription}
            </p>
          </div>

          <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
             <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto md:mx-0">
              <MapPin className="text-blue-600 w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{config.infoLocationTitle}</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
              {config.infoLocationDescription}
            </p>
          </div>

        </div>
        
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <MessageCircle className="text-amber-600 w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">
            <strong>Importante:</strong> Mantente atento a tu WhatsApp. Toda la comunicación oficial se realizará por ese medio digital.
          </p>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;