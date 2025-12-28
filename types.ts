export interface Companion {
  id: string; // Unique ID for the companion
  fullName: string;
  age?: number; // Optional now, unless for kids menu
  gender?: string; // Optional
  mealPreference?: string; // Meat, Fish, Veggie, Kids
  ticketCode: string; // Unique ticket per guest
  status: 'pending' | 'checked_in'; // Check-in status at the door
  rsvpStatus?: 'confirmed' | 'declined' | 'pending'; // RSVP status from website
  checkedInAt?: string; // ISO string
}

export interface GuestGroup {
  id: string;
  primaryGuestName: string; // Was parentName
  whatsapp: string;
  email?: string; // New: Optional email contact
  address?: string; // Was addressDetails
  tableAssignment?: string; // Was ticketDistributor

  companions: Companion[]; // Was children
  timestamp: string; // Creation timestamp
  rsvpLastModified?: string; // ISO string for sync conflict resolution

  // Wedding Specifics
  dietaryRestrictions?: string;
  songRequest?: string;
  messageToCouple?: string;

  // Legacy/Compatibility mapping (to avoid immediate breakages before full refactor)
  // These will be computed getters or optional fields in the future
  ticketDistributor?: string; // Mapped to tableAssignment
  parentName?: string; // Mapped to primaryGuestName
}

export interface StorageResult {
  success: boolean;
  message?: string;
  data?: GuestGroup;
}

export interface SystemUser {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'scanner' | 'planner'; // 'verifier' -> 'scanner', 'whatsapp_sender' -> 'planner'
  name: string;
  whatsapp?: string;
}

export interface TableAssignment { // Was TicketDistributor
  id?: string;
  tableName: string; // Was name
  capacity: number; // Was ranges (implied)
  // Legacy range support for compat if needed, but we should move to direct assignment
  startRange?: number;
  endRange?: number;
}

export interface AppConfig {
  // Event Details
  eventDate: string;
  venueName: string;
  venueAddress: string;
  maxGuests: number; // Was maxRegistrations
  isRsvpOpen: boolean; // Was isRegistrationOpen

  tables: TableAssignment[]; // Was ticketDistributors

  // Hero / Branding
  heroTitle: string;
  heroSubtitle: string;
  heroBackgroundImage: string; // URL

  // Info Cards (FAQ)
  infoDressCodeTitle: string;
  infoDressCodeDesc: string;
  infoGiftTitle: string;
  infoGiftDesc: string;
  infoLocationTitle: string;
  infoLocationDesc: string;

  // Default Location (Maybe less relevant for weddings unless destination)
  defaultRegion?: string;

  // Contact
  plannerPhoneNumber: string; // Was orgPhoneNumber
  whatsappTemplate: string;

  // vCard Info
  vCardName: string;
  vCardOrg: string;
  vCardPhone: string;
  vCardUrl: string;
}

export const MEAL_OPTIONS = [
  "Pollo", "Res", "Pescado", "Vegetariano", "Menú Infantil"
];

export const DEFAULT_CONFIG: AppConfig = {
  eventDate: "14 de Febrero, 2026",
  venueName: "Jardín de los Sueños",
  venueAddress: "Km 12 Carretera a El Boquerón",
  maxGuests: 200,
  isRsvpOpen: true,
  tables: [
    { tableName: "Mesa Principal", capacity: 10 },
    { tableName: "Familia Novio", capacity: 20 },
    { tableName: "Familia Novia", capacity: 20 },
    { tableName: "Amigos", capacity: 30 }
  ],
  heroTitle: "Nuestra Boda",
  heroSubtitle: "Acompáñanos a celebrar nuestro amor",
  heroBackgroundImage: "/hero-wedding.jpg", // Placeholder

  infoDressCodeTitle: "Código de Vestimenta",
  infoDressCodeDesc: "Formal / Etiqueta Rigurosa. Nos encantaría verte elegante para la ocasión.",

  infoGiftTitle: "Regalos",
  infoGiftDesc: "Su presencia es nuestro mejor regalo. Si desean tener un detalle, tendremos buzón de sobres.",

  infoLocationTitle: "Ceremonia y Recepción",
  infoLocationDesc: "Ambas se llevarán a cabo en el mismo lugar para su comodidad.",

  plannerPhoneNumber: "50370000000",
  whatsappTemplate: "*Hola, soy {name}.*\nConfirmo mi asistencia a la Boda de *Fulanita & Menganito*.\nAsistiremos *{count} personas*:\n• {invites}\n\n👉 *Espero los detalles finales y mi ubicación de mesa.*\n\n¡Gracias por la invitación!",

  // Default vCard
  vCardName: "Wedding Planner",
  vCardOrg: "Eventos Exclusivos",
  vCardPhone: "50370000000",
  vCardUrl: "https://miboda.com"
};