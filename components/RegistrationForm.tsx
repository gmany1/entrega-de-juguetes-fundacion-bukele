import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, MapPin, Lock, Loader2 } from 'lucide-react';
import { getRemainingSlots, saveRegistration } from '../services/storageService';
import { useConfig } from '../contexts/ConfigContext';

const RegistrationForm: React.FC = () => {
  const { config } = useConfig();
  const [remainingSlots, setRemainingSlots] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ name: string, count: number, gender: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    inviteNumber: '',
    whatsapp: '',
    childCount: 1,
    genderSelection: 'Niño',
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
    // Force uppercase for inviteNumber
    const val = name === 'inviteNumber' ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (error) setError(null);
  };

  const validate = (): boolean => {
    if (!formData.fullName.trim()) {
      setError("El nombre completo es obligatorio.");
      return false;
    }

    // Validate Invite Number Format: NI0001 - NI1000
    const inviteRegex = /^NI(\d{4})$/i; // Case insensitive
    if (!formData.inviteNumber.trim()) {
      setError("El número de invitación es obligatorio.");
      return false;
    }
    const match = formData.inviteNumber.trim().match(inviteRegex);

    if (!match) {
      setError("El número de invitación debe tener el formato NI seguido de 4 dígitos (ej. NI0001).");
      return false;
    }

    const inviteNum = parseInt(match[1], 10);
    if (inviteNum < 1 || inviteNum > 1000) {
      setError("El número de invitación debe estar entre NI0001 y NI1000.");
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

    // childCount is fixed to 1

    if (!formData.addressDetails.trim()) {
      setError("Debes especificar tu colonia, caserío o cantón.");
      return false;
    }

    return true;
  };

  const handleRegisterAnother = () => {
    setSubmittedData(null);
    setFormData(prev => ({
      ...prev,
      inviteNumber: '', // Clear invite number for new child
      genderSelection: 'Niño', // Reset gender
      // Keep Name, WhatsApp, Address for faster flow
    }));
    setError(null);
  };

  const generateWhatsAppLink = (name: string, count: number, gender: string) => {
    // Use template from config
    let message = config.whatsappTemplate;
    message = message.replace('{name}', name);
    message = message.replace('{count}', count.toString());
    message = message.replace('{gender}', gender);
    message = message.replace('{date}', config.eventDate);

    return `https://wa.me/${config.orgPhoneNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const result = await saveRegistration({
        ...formData,
        childCount: 1 // Always 1 per invite
      }, config.maxRegistrations);

      if (result.success && result.data) {
        setSubmittedData({
          name: result.data.fullName,
          count: result.data.childCount,
          gender: result.data.genderSelection
        });

        const slots = await getRemainingSlots(config.maxRegistrations);
        setRemainingSlots(slots);

        const link = generateWhatsAppLink(
          result.data.fullName,
          result.data.childCount,
          result.data.genderSelection
        );

        window.open(link, '_blank');
      } else {
        setError(result.message || "Ocurrió un error al guardar el registro.");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if registration is explicitly closed or full
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
          Gracias <strong>{submittedData.name}</strong>. Hemos procesado tu solicitud.
          Se ha abierto una ventana de WhatsApp para confirmar tu asistencia.
        </p>

        <div className="flex flex-col gap-3 justify-center items-center">
          <button
            onClick={handleRegisterAnother}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-blue-700 transition-colors w-full md:w-auto flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Registrar otro niño/a (Nueva Invitación)
          </button>

          <button
            onClick={() => window.location.reload()}
            className="text-green-800 underline hover:text-green-900 mt-2"
          >
            Terminar y volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto -mt-10 mb-20 relative z-20 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700">Formulario de Registro</h3>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${remainingSlots < 50 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
            {remainingSlots} cupos disponibles
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número de Invitación</label>
              <input
                type="text"
                name="inviteNumber"
                value={formData.inviteNumber}
                onChange={handleChange}
                placeholder="Ej. 1045"
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50"
              />
              <p className="text-xs text-slate-400 mt-1">Debe ser un número único.</p>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Género del niño/a</label>
              <div className="flex gap-4 mt-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="genderSelection"
                    value="Niño"
                    checked={formData.genderSelection === 'Niño'}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-slate-700">Niño</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="genderSelection"
                    value="Niña"
                    checked={formData.genderSelection === 'Niña'}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-5 h-5 text-pink-500 border-gray-300 focus:ring-pink-500"
                  />
                  <span className="ml-2 text-slate-700">Niña</span>
                </label>
              </div>
            </div>
            {/* Hidden input for childCount to keep compatibility standard */}
            <input type="hidden" name="childCount" value="1" />
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