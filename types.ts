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
  childAge?: number;
  ticketDistributor: string; // New field
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
  ticketDistributors: string[]; // List of available distributors

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
  ticketDistributors: [
    "Adilton Hernandez",
    "Ingrid Flores",
    "Adriana Linares",
    "Medardo Salinas",
    "Selene Roman",
    "Judith Aldana",
    "Yancy Grismery Flores",
    "Emerson Hernandez",
    "Noe Alvarado",
    "Ingrid Alvarado",
    "Seño Domi",
    "Maritza Chevez",
    "Veronica Flores",
    "Roxana Miron",
    "Vladimir Mendoza",
    "Miguel Lazo"
  ], // Default value
  heroTitle: "Compartiendo Sonrisas",
  heroSubtitle: "Gran Entrega de Juguetes 2025 - de la Fundación Armando Bukele",
  heroBackgroundImage: "/hero-christmas.png",
  infoTargetTitle: "¿Para quién es?",
  infoTargetDescription: "Exclusivo para niños y niñas salvadoreños de 0 a 12 años de edad. Queremos que los más pequeños disfruten la magia de la Navidad.",
  infoRequirementsTitle: "Requisitos",
  infoRequirementsDescription: "Es indispensable contar con tu Número de Invitación válido y registrar un número de WhatsApp activo para recibir la confirmación.",
  infoLocationTitle: "Lugar y Hora",
  infoLocationDescription: "Por seguridad y orden, la ubicación exacta y la hora de tu turno serán enviadas exclusivamente a tu WhatsApp registrado.",
  defaultDepartment: "Santa Ana",
  defaultMunicipality: "Santa Ana Este",
  defaultDistrict: "El Congo",
  orgPhoneNumber: "50379017014",
  whatsappTemplate: "*Hola, soy {name}.*\nConfirmo mi asistencia al evento *“Compartiendo Sonrisas”*.\nHe registrado *{count} invitaciones*:\n• {invites}\n\n👉 *Solicito que me envíen los detalles de lugar y hora por este mismo medio.*\n\n📲 Guardaré este número en mis contactos para futuras comunicaciones.\n\n🙏 *¡Que Dios me los bendiga!*",

  // Default vCard
  vCardName: "Medardo Linares",
  vCardOrg: "Fundación Armando Bukele",
  vCardPhone: "50379017014",
  vCardUrl: "https://www.fundacionbukele.org"
};