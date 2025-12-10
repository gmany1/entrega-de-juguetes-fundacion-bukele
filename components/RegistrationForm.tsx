import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, MapPin, Lock, Loader2, Contact } from 'lucide-react';
import { getRemainingSlots, saveRegistration } from '../services/storageService';
import { useConfig } from '../contexts/ConfigContext';

const RegistrationForm: React.FC = () => {
  const { config } = useConfig();

  const downloadVCard = () => {
    // Construct vCard 3.0 string
    const vCardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${config.vCardName}`,
      `TEL;TYPE=CELL,VOICE:${config.vCardPhone}`,
      'END:VCARD'
    ].join('\n');

    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'contacto_fundacion.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [remainingSlots, setRemainingSlots] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ name: string, count: number } | null>(null);

  // New state for children list
  const [children, setChildren] = useState([{ id: crypto.randomUUID(), inviteNumber: '', gender: 'Niño' }]);

  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    department: config.defaultDepartment,
    municipality: config.defaultMunicipality,
    district: config.defaultDistrict,
    addressDetails: ''
  });

  // Update form defaults when config changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      department: config.defaultDepartment,
      municipality: config.defaultMunicipality,
      district: config.defaultDistrict,
    }));
  }, [config.defaultDepartment, config.defaultMunicipality, config.defaultDistrict]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      const slots = await getRemainingSlots(config.maxRegistrations);
      setRemainingSlots(slots);
    };
    fetchSlots();
  }, [config.maxRegistrations]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleChildChange = (id: string, field: 'inviteNumber' | 'gender', value: string) => {
    setChildren(prev => prev.map(child => {
      if (child.id === id) {
        return {
          ...child,
          [field]: field === 'inviteNumber' ? value.toUpperCase() : value
        };
      }
      return child;
    }));
    if (error) setError(null);
  };

  const addChild = () => {
    setChildren(prev => [...prev, { id: crypto.randomUUID(), inviteNumber: '', gender: 'Niño' }]);
  };

  const removeChild = (id: string) => {
    if (children.length > 1) {
      setChildren(prev => prev.filter(c => c.id !== id));
    }
  };

  const validate = (): boolean => {
    if (!formData.fullName.trim()) {
      setError("El nombre completo es obligatorio.");
      return false;
    }

    if (!formData.whatsapp.trim()) {
      setError("El número de WhatsApp es obligatorio.");
      return false;
    }
    if (!/^\d{8,}$/.test(formData.whatsapp.replace(/\D/g, ''))) {
      setError("Ingresa un número de teléfono válido (mínimo 8 dígitos).");
      return false;
    }

    if (!formData.addressDetails.trim()) {
      setError("Debes especificar tu colonia, caserío o cantón.");
      return false;
    }

    // Validate Children
    const inviteRegex = /^NI(\d{4})$/i;
    const usedInvites = new Set();

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child.inviteNumber.trim()) {
        setError(`El número de invitación es obligatorio para el niño #${i + 1}.`);
        return false;
      }

      const match = child.inviteNumber.trim().match(inviteRegex);
      if (!match) {
        setError(`La invitación "${child.inviteNumber}" (Niño #${i + 1}) debe tener el formato NIxxxx (ej. NI0001).`);
        return false;
      }

      const inviteNum = parseInt(match[1], 10);
      if (inviteNum < 1 || inviteNum > 1000) {
        setError(`La invitación "${child.inviteNumber}" debe estar entre NI0001 y NI1000.`);
        return false;
      }

      if (usedInvites.has(child.inviteNumber.trim())) {
        setError(`La invitación "${child.inviteNumber}" está duplicada en este formulario.`);
        return false;
      }
      usedInvites.add(child.inviteNumber.trim());
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Sequential submission
      for (const child of children) {
        const result = await saveRegistration({
          fullName: formData.fullName,
          inviteNumber: child.inviteNumber,
          whatsapp: formData.whatsapp,
          childCount: 1, // Logic remains 1 entry per invite
          genderSelection: child.gender,
          department: formData.department,
          municipality: formData.municipality,
          district: formData.district,
          addressDetails: formData.addressDetails
        }, config.maxRegistrations);

        if (!result.success) {
          throw new Error(`Error con la invitación ${child.inviteNumber}: ${result.message}`);
        }
      }

      // Handle success
      setSubmittedData({
        name: formData.fullName,
        count: children.length
      });

      // Refresh slots
      const slots = await getRemainingSlots(config.maxRegistrations);
      setRemainingSlots(slots);

      // Open WhatsApp for the first child (or generic)
      // Using the logic: we just need one contact point.
      const firstChild = children[0];
      const message = config.whatsappTemplate
        .replace('{name}', formData.fullName)
        .replace('{count}', children.length.toString())
        .replace('{invites}', children.map(c => c.inviteNumber).join(', '))
        // Contact variables
        .replace('{phone}', config.vCardPhone)
        .replace('{contactName}', config.vCardName)
        // Fallback for old templates
        .replace('{gender}', children.length > 1 ? 'niños' : 'niño/a')
        .replace('{date}', config.eventDate);

      const link = `https://wa.me/${config.orgPhoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(link, '_blank');

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedData) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-green-50 border border-green-200 rounded-xl text-center shadow-lg animate-fade-in-up">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-green-800 mb-4">¡Registro Exitoso!</h2>
        <p className="text-green-700 text-lg mb-6">
          Gracias <strong>{submittedData.name}</strong>. Hemos procesado el registro de {submittedData.count} niño(s).
          Se ha abierto una ventana de WhatsApp para confirmar tu asistencia.
        </p>

        <div className="flex flex-col gap-3 justify-center items-center mb-6">
          <button
            onClick={downloadVCard}
            className="flex items-center gap-2 bg-white border border-green-300 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Contact className="w-4 h-4" />
            Guardar Contacto de la Fundación
          </button>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="text-green-800 underline hover:text-green-900"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const isClosed = !config.isRegistrationOpen || remainingSlots <= 0;

  if (isClosed) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-50 border border-slate-200 rounded-xl text-center shadow-lg">
        <div className="flex justify-center mb-4">
          {remainingSlots <= 0 ? (
            <AlertCircle className="w-16 h-16 text-red-500" />
          ) : (
            <Lock className="w-16 h-16 text-slate-500" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          {remainingSlots <= 0 ? "Cupos Agotados" : "Registro Cerrado"}
        </h2>
        <p className="text-slate-600 text-lg">
          {remainingSlots <= 0
            ? "Hemos alcanzado el límite máximo de registros para esta entrega."
            : "El formulario de registro no está disponible en este momento."}
        </p>
      </div>
    );
  }

  if (submittedData) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-green-50 border border-green-200 rounded-xl text-center shadow-lg animate-fade-in-up">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-green-800 mb-4">¡Registro Exitoso!</h2>
        <p className="text-green-700 text-lg mb-6">
          Gracias <strong>{submittedData.name}</strong>. Hemos procesado el registro de {submittedData.count} niño(s).
          Se ha abierto una ventana de WhatsApp para confirmar tu asistencia.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-green-800 underline hover:text-green-900"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto -mt-10 mb-20 relative z-20 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700">Formulario de Registro</h3>
          {/* Removed specific slot count as requested */}
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Responsible Info */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo del Responsable</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Juan Pérez"
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número de WhatsApp</label>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="7000-0000"
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50"
            />
          </div>

          {/* Children List */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="font-semibold text-slate-700 mb-3">Información de los niños</h4>
            <div className="space-y-4">
              {children.map((child, index) => (
                <div key={child.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">N° Invitación (Niño #{index + 1})</label>
                      <input
                        type="text"
                        value={child.inviteNumber}
                        onChange={(e) => handleChildChange(child.id, 'inviteNumber', e.target.value)}
                        placeholder="NI0001"
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Género</label>
                      <div className="flex gap-3 mt-2">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`gender-${child.id}`}
                            value="Niño"
                            checked={child.gender === 'Niño'}
                            onChange={(e) => handleChildChange(child.id, 'gender', e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="ml-1 text-sm text-slate-700">Niño</span>
                        </label>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`gender-${child.id}`}
                            value="Niña"
                            checked={child.gender === 'Niña'}
                            onChange={(e) => handleChildChange(child.id, 'gender', e.target.value)}
                            className="w-4 h-4 text-pink-500"
                          />
                          <span className="ml-1 text-sm text-slate-700">Niña</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  {children.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChild(child.id)}
                      className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 hover:bg-red-200"
                      title="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addChild}
              className="mt-3 text-sm text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1"
            >
              + Agregar otro niño/a y invitación
            </button>
          </div>

          {/* Fixed Location Section - Now reads from config defaults */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-slate-700">Ubicación Asignada</h4>
                <p className="text-xs text-slate-500">Este evento está localizado para la siguiente zona:</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-2 rounded border border-slate-200">
                <label className="block text-[10px] uppercase text-slate-400 font-bold">Departamento</label>
                <div className="text-sm font-medium text-slate-800">{formData.department}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <label className="block text-[10px] uppercase text-slate-400 font-bold">Municipio</label>
                <div className="text-sm font-medium text-slate-800">{formData.municipality}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <label className="block text-[10px] uppercase text-slate-400 font-bold">Distrito</label>
                <div className="text-sm font-medium text-slate-800">{formData.district}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Colonia / Caserío / Cantón <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="addressDetails"
                value={formData.addressDetails}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Ej. Colonia La Esperanza, Polígono A, Casa #5"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50"
              />
              <p className="text-xs text-slate-400 mt-1">Especifica tu ubicación exacta dentro de {formData.district}.</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${isSubmitting
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'
                }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Registrarme para la entrega de juguetes
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4">
              Al registrarte aceptas ser contactado vía WhatsApp para la logística del evento.
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;