'use client';

import { User, Coach, Client, Session, Invoice, Payment, ProgressMeasurement, AuthState, CartItem, Order, Conversation, Message, WorkoutProgram } from './types';
import { mockCoaches, mockClients, mockSessions, mockInvoices, mockPayments, mockProgressData, mockConversations, mockMessages } from './mockData';

const STORAGE_KEYS = {
  AUTH: 'coachpro_auth',
  COACHES: 'coachpro_coaches',
  CLIENTS: 'coachpro_clients',
  SESSIONS: 'coachpro_sessions',
  INVOICES: 'coachpro_invoices',
  PAYMENTS: 'coachpro_payments',
  PROGRESS: 'coachpro_progress',
  CART: 'coachpro_cart',
  ORDERS: 'coachpro_orders',
  CONVERSATIONS: 'coachpro_conversations',
  MESSAGES: 'coachpro_messages',
  PROGRAMS: 'coachpro_programs',
};

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Failed to save to localStorage');
  }
}

export function initializeStorage(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.COACHES)) setItem(STORAGE_KEYS.COACHES, mockCoaches);
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) setItem(STORAGE_KEYS.CLIENTS, mockClients);
  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) setItem(STORAGE_KEYS.SESSIONS, mockSessions);
  if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) setItem(STORAGE_KEYS.INVOICES, mockInvoices);
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) setItem(STORAGE_KEYS.PAYMENTS, mockPayments);
  if (!localStorage.getItem(STORAGE_KEYS.PROGRESS)) setItem(STORAGE_KEYS.PROGRESS, mockProgressData);
  if (!localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) setItem(STORAGE_KEYS.CONVERSATIONS, mockConversations);
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) setItem(STORAGE_KEYS.MESSAGES, mockMessages);
}

// Auth
export function getAuth(): AuthState {
  return getItem<AuthState>(STORAGE_KEYS.AUTH, { user: null, role: null, isAuthenticated: false });
}

export function setAuth(auth: AuthState): void {
  setItem(STORAGE_KEYS.AUTH, auth);
}

export function clearAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }
}

// Coaches
export function getCoaches(): Coach[] {
  return getItem<Coach[]>(STORAGE_KEYS.COACHES, mockCoaches);
}

export function saveCoaches(coaches: Coach[]): void {
  setItem(STORAGE_KEYS.COACHES, coaches);
}

export function getCoachById(id: string): Coach | undefined {
  return getCoaches().find(c => c.id === id);
}

// Clients
export function getClients(): Client[] {
  return getItem<Client[]>(STORAGE_KEYS.CLIENTS, mockClients);
}

export function saveClients(clients: Client[]): void {
  setItem(STORAGE_KEYS.CLIENTS, clients);
}

export function getClientById(id: string): Client | undefined {
  return getClients().find(c => c.id === id);
}

export function addClient(client: Client): void {
  const clients = getClients();
  clients.push(client);
  saveClients(clients);
}

export function updateClient(updated: Client): void {
  const clients = getClients().map(c => c.id === updated.id ? updated : c);
  saveClients(clients);
}

export function deleteClient(id: string): void {
  const clients = getClients().filter(c => c.id !== id);
  saveClients(clients);
}

// Sessions
export function getSessions(): Session[] {
  return getItem<Session[]>(STORAGE_KEYS.SESSIONS, mockSessions);
}

export function saveSessions(sessions: Session[]): void {
  setItem(STORAGE_KEYS.SESSIONS, sessions);
}

export function addSession(session: Session): void {
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
}

export function updateSession(updated: Session): void {
  const sessions = getSessions().map(s => s.id === updated.id ? updated : s);
  saveSessions(sessions);
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter(s => s.id !== id);
  saveSessions(sessions);
}

// Invoices
export function getInvoices(): Invoice[] {
  return getItem<Invoice[]>(STORAGE_KEYS.INVOICES, mockInvoices);
}

export function saveInvoices(invoices: Invoice[]): void {
  setItem(STORAGE_KEYS.INVOICES, invoices);
}

export function addInvoice(invoice: Invoice): void {
  const invoices = getInvoices();
  invoices.push(invoice);
  saveInvoices(invoices);
}

export function updateInvoice(updated: Invoice): void {
  const invoices = getInvoices().map(i => i.id === updated.id ? updated : i);
  saveInvoices(invoices);
}

export function deleteInvoice(id: string): void {
  const invoices = getInvoices().filter(i => i.id !== id);
  saveInvoices(invoices);
}

// Payments
export function getPayments(): Payment[] {
  return getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, mockPayments);
}

export function savePayments(payments: Payment[]): void {
  setItem(STORAGE_KEYS.PAYMENTS, payments);
}

export function addPayment(payment: Payment): void {
  const payments = getPayments();
  payments.push(payment);
  savePayments(payments);
}

// Progress
export function getProgressData(): ProgressMeasurement[] {
  return getItem<ProgressMeasurement[]>(STORAGE_KEYS.PROGRESS, mockProgressData);
}

export function saveProgressData(data: ProgressMeasurement[]): void {
  setItem(STORAGE_KEYS.PROGRESS, data);
}

export function addProgressMeasurement(measurement: ProgressMeasurement): void {
  const data = getProgressData();
  data.push(measurement);
  saveProgressData(data);
}

export function getClientProgress(clientId: string): ProgressMeasurement[] {
  return getProgressData()
    .filter(p => p.clientId === clientId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Update coach IBAN
export function updateCoachIban(coachId: string, iban: string): void {
  const coaches = getCoaches().map(c => c.id === coachId ? { ...c, iban } : c);
  saveCoaches(coaches);
}

// Conversations
export function getConversations(): Conversation[] {
  return getItem<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, mockConversations);
}

export function saveConversations(convs: Conversation[]): void {
  setItem(STORAGE_KEYS.CONVERSATIONS, convs);
}

export function getConversationsForUser(userId: string): Conversation[] {
  return getConversations().filter(c => c.participantIds.includes(userId));
}

export function getOrCreateConversation(userA: string, nameA: string, roleA: string, userB: string, nameB: string, roleB: string): Conversation {
  const existing = getConversations().find(
    c => c.participantIds.includes(userA) && c.participantIds.includes(userB)
  );
  if (existing) return existing;
  const conv: Conversation = {
    id: `conv-${Date.now()}`,
    participantIds: [userA, userB],
    participantNames: { [userA]: nameA, [userB]: nameB },
    participantRoles: { [userA]: roleA as any, [userB]: roleB as any },
    createdAt: new Date().toISOString(),
  };
  const convs = getConversations();
  convs.unshift(conv);
  saveConversations(convs);
  return conv;
}

// Messages
export function getMessages(): Message[] {
  return getItem<Message[]>(STORAGE_KEYS.MESSAGES, mockMessages);
}

export function getMessagesForConversation(convId: string): Message[] {
  return getMessages()
    .filter(m => m.conversationId === convId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function sendMessage(msg: Message): void {
  const messages = getMessages();
  messages.push(msg);
  setItem(STORAGE_KEYS.MESSAGES, messages);
  // update conversation lastMessage
  const convs = getConversations().map(c =>
    c.id === msg.conversationId
      ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt, lastSenderId: msg.senderId }
      : c
  );
  saveConversations(convs);
}

export function markMessagesRead(convId: string, userId: string): void {
  const messages = getMessages().map(m =>
    m.conversationId === convId && !m.readBy.includes(userId)
      ? { ...m, readBy: [...m.readBy, userId] }
      : m
  );
  setItem(STORAGE_KEYS.MESSAGES, messages);
}

export function getUnreadCount(userId: string): number {
  const convIds = getConversationsForUser(userId).map(c => c.id);
  return getMessages().filter(
    m => convIds.includes(m.conversationId) && m.senderId !== userId && !m.readBy.includes(userId)
  ).length;
}

// Programs
export function getPrograms(): WorkoutProgram[] {
  return getItem<WorkoutProgram[]>(STORAGE_KEYS.PROGRAMS, []);
}

export function saveProgram(program: WorkoutProgram): void {
  const programs = getPrograms().filter(p => p.id !== program.id);
  programs.unshift(program);
  setItem(STORAGE_KEYS.PROGRAMS, programs);
}

export function deleteProgram(id: string): void {
  setItem(STORAGE_KEYS.PROGRAMS, getPrograms().filter(p => p.id !== id));
}

export function getProgramsForCoach(coachId: string): WorkoutProgram[] {
  return getPrograms().filter(p => p.coachId === coachId);
}

// Cart
export function getCart(): CartItem[] {
  return getItem<CartItem[]>(STORAGE_KEYS.CART, []);
}

export function saveCart(cart: CartItem[]): void {
  setItem(STORAGE_KEYS.CART, cart);
}

export function addToCart(item: CartItem): void {
  const cart = getCart();
  const existing = cart.find(
    c => c.productId === item.productId && c.size === item.size && c.color === item.color && c.withDiet === item.withDiet
  );
  if (existing) {
    existing.quantity += item.quantity;
    saveCart(cart);
  } else {
    cart.push(item);
    saveCart(cart);
  }
}

export function removeFromCart(id: string): void {
  saveCart(getCart().filter(c => c.id !== id));
}

export function updateCartQuantity(id: string, quantity: number): void {
  if (quantity <= 0) { removeFromCart(id); return; }
  saveCart(getCart().map(c => c.id === id ? { ...c, quantity } : c));
}

export function clearCart(): void {
  setItem(STORAGE_KEYS.CART, []);
}

// Orders
export function getOrders(): Order[] {
  return getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
}

export function addOrder(order: Order): void {
  const orders = getOrders();
  orders.unshift(order);
  setItem(STORAGE_KEYS.ORDERS, orders);
}
