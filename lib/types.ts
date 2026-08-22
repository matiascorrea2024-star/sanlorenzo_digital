// ============================================
// TIPOS TYPESCRIPT PARA SUPABASE
// ============================================

export type UserRole = 'user' | 'admin';

// Coincide con la tabla real "user_profiles". El puntaje/nivel del vecino
// se calcula en el cliente a partir de la actividad real (ver app/perfil),
// no se persiste como columna.
export interface UserProfile {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  last_seen_at?: string;
}

export interface Business {
  id: string;
  owner_id?: string;
  name: string;
  slug: string;
  category: string;
  type: string;
  description?: string;
  address?: string;
  schedule?: string;
  whatsapp?: string;
  instagram?: string;
  accent?: string;
  status: 'reclamado' | 'verificado' | 'no_reclamado';
  demo: boolean;
  open: boolean;
  tags?: string[];
  rating?: number;
  reviews?: number;
  promotions?: any[];
  items?: any[];
  professionals?: string[];
  latitude?: number;
  longitude?: number;
  city?: string;
  province?: string;
  country?: string;
  website?: string;
  cover_url?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  views?: number;
  favorites_count?: number;
  portada_url?: string;
  activo?: boolean;
  plan?: string;
  destacado?: boolean;
  created_at?: string;
  updated_at?: string;
  hace_envios?: boolean;
  retiro_en_local?: boolean;
  envio_gratis?: boolean;
  costo_envio?: number;
  zona_cobertura?: string;
}

export interface Offer {
  id: string;
  business_id: string;
  title: string;
  product?: string;
  old_price?: number;
  offer_price?: number;
  discount_percent?: number;
  image_url?: string;
  whatsapp?: string;
  valid_until?: string;
  active: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  business_id?: string;
  name: string;
  price?: string;
  note?: string;
}

export interface Event {
  id: string;
  business_id?: string;
  title: string;
  description?: string;
  image_url?: string;
  starts_at: string;
  ends_at?: string;
  address?: string;
  active: boolean;
  created_at: string;
  type?: string;
}

export interface Post {
  id: string;
  business_id: string;
  title: string;
  body?: string;
  image_url?: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  business_id: string;
  created_at: string;
}

export interface Follower {
  id: number;
  user_id?: string;
  business_id?: string;
  created_at: string;
}

export interface AnalyticsEvent {
  id: number;
  business_id?: string;
  event_name: string;
  path?: string;
  metadata: any;
  user_id?: string;
  created_at: string;
}

export interface BusinessMedia {
  id: string;
  business_id: string;
  url: string;
  kind: string;
  alt?: string;
  sort_order: number;
  created_at: string;
}

export interface Metric {
  id: number;
  business_id?: string;
  type: string;
  created_at: string;
}

// ============================================
// TIPOS COMPUESTOS PARA LA APP
// ============================================


export interface OfferCard {
  id: string;
  negocio: string;
  slug: string;
  producto: string;
  cat: string;
  vence?: string;
  descuento?: number;
  discountTxt?: string;
  antes?: number;
  ahora?: number;
  real?: boolean;
  portada_url?: string;
  logo_url?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
export interface FullBusiness extends Business {
  offers?: Offer[];
  items_list?: Item[];
  media?: BusinessMedia[];
  location_source?: "auto" | "manual" | "error";
  location_verified?: boolean;
  location_updated_at?: string;
  promotions?: any[];
  portada_url?: string;
  logo_url?: string;
  destacado?: boolean;
  plan?: string;
  views?: number;
  favorites_count?: number;
  phone?: string;
  email?: string;
  website?: string;
  cover_url?: string;
  professionals?: string[];
}
