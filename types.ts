export interface Registration {
  id: string;
  fullName: string;
  inviteNumber: string;
  whatsapp: string;
  childCount: number;
  genderSelection: string;
  department: string;
  municipality: string;
  district: string;
  addressDetails: string;
  timestamp: string;
}

export interface StorageResult {
  success: boolean;
  message?: string;
  data?: Registration;
}

export interface AppConfig {
  // General
  eventDate: string;
  maxRegistrations: number;
  isRegistrationOpen: boolean;

  // Hero
  heroTitle: string;
  heroSubtitle: string;
  heroBackgroundImage: string; // URL

  // Info Cards
  infoTargetTitle: string;
  infoTargetDescription: string;
  infoRequirementsTitle: string;
  infoRequirementsDescription: string;
  infoLocationTitle: string;
  infoLocationDescription: string;

  // Location Defaults
  defaultDepartment: string;
  defaultMunicipality: string;
  defaultDistrict: string;

  // WhatsApp
  orgPhoneNumber: string;
  whatsappTemplate: string;

  // vCard Info
  vCardName: string;
  vCardOrg: string;
  vCardPhone: string;
  vCardUrl: string;
}

export const DEPARTMENTS = [
  "Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán",
  "La Libertad", "La Paz", "La Unión", "Morazán",
  "San Miguel", "San Salvador", "San Vicente", "Santa Ana",
  "Sonsonate", "Usulután"
];

export const DEFAULT_CONFIG: AppConfig = {
  eventDate: "23 de Diciembre",
  maxRegistrations: 1000,
  isRegistrationOpen: true,
  heroTitle: "Llevando Sonrisas a El Salvador",
  heroSubtitle: "Gran Entrega de Juguetes 2025 - Fundación Bukele",
  heroBackgroundImage: "", // Empty means use default gradient
  infoTargetTitle: "¿Para quién es?",
  infoTargetDescription: "Exclusivo para niños y niñas salvadoreños de 0 a 10 años de edad. Queremos que los más pequeños disfruten la magia de la Navidad.",
  infoRequirementsTitle: "Requisitos",
  infoRequirementsDescription: "Es indispensable contar con tu Número de Invitación válido y registrar un número de WhatsApp activo para recibir la confirmación.",
  infoLocationTitle: "Lugar y Hora",
  infoLocationDescription: "Por seguridad y orden, la ubicación exacta y la hora de tu turno serán enviadas exclusivamente a tu WhatsApp registrado.",
  defaultDepartment: "Santa Ana",
  defaultMunicipality: "Santa Ana Este",
  defaultDistrict: "El Congo",
  orgPhoneNumber: "50360605555",
  whatsappTemplate: "Hola {name}, hemos recibido tu registro para la entrega de juguetes de la Fundación Bukele. Has inscrito {count} {gender}. El evento se realizará el día {date}. Los detalles de lugar y hora te los enviaremos por este mismo medio. Te sugerimos guardar este número para futuras comunicaciones. ¡Bendiciones para tu familia!",

  // Default vCard
  vCardName: "Fundación Bukele",
  vCardOrg: "Fundación Armando Bukele",
  vCardPhone: "50360605555",
  vCardUrl: "https://www.fundacionbukele.org"
};