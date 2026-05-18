export type UserRole = 'admin' | 'coach' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Coach extends User {
  role: 'coach';
  speciality: string;
  iban?: string;
  clientIds: string[];
  phone?: string;
  bio?: string;
  rating?: number;
  sessionPrice?: number;
}

export interface Client extends User {
  role: 'client';
  coachId: string;
  phone?: string;
  dateOfBirth?: string;
  goal?: string;
  status: 'active' | 'inactive' | 'pending';
  address?: string;
  emergencyContact?: string;
  medicalNotes?: string;
  startDate: string;
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type SessionType = 'individual' | 'group' | 'online';

export interface Session {
  id: string;
  coachId: string;
  clientId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: SessionType;
  status: SessionStatus;
  notes?: string;
  location?: string;
  price?: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  coachId: string;
  clientId: string;
  clientName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  coachId: string;
  amount: number;
  date: string;
  method: 'bank_transfer' | 'card' | 'cash' | 'check';
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
}

export interface ProgressMeasurement {
  id: string;
  clientId: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  notes?: string;
}

export interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
}

export interface DashboardStats {
  totalClients: number;
  revenue: number;
  sessionsThisWeek: number;
  pendingInvoices: number;
}

// ─── Boutique ───────────────────────────────────────────────────────────────

export type ProductCategory =
  | 'ensemble'
  | 'haut_femme'
  | 'bas_femme'
  | 'haut_homme'
  | 'bas_homme'
  | 'pack_coaching'
  | 'seance';

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface ProductVariant {
  color: string;
  colorHex: string;
  stock: Record<ProductSize, number>;
}

export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  imageColor: string; // gradient CSS for placeholder
  variants?: ProductVariant[];
  badge?: string; // "Nouveau", "Promo", etc.
  brand?: 'ariesfitwear' | 'coachpro';
  externalUrl?: string;
}

export interface CoachingPack {
  id: string;
  name: string;
  description: string;
  sessions: number;
  sessionType: 'présentiel' | 'en ligne' | 'mixte';
  includesDiet: boolean;
  dietDetails?: string;
  price: number;
  originalPrice?: number;
  priceWithDiet?: number;
  durationWeeks: number;
  features: string[];
  badge?: string;
  popular?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  type: 'clothing' | 'coaching_pack' | 'session';
  name: string;
  price: number;
  quantity: number;
  size?: ProductSize;
  color?: string;
  withDiet?: boolean;
  imageColor: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod2 = 'card' | 'bank_transfer' | 'paypal';

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod2;
  createdAt: string;
  shippingAddress?: string;
  notes?: string;
}
