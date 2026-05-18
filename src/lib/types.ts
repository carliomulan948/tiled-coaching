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
