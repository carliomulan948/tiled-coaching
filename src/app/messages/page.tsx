'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Send, Search, MessageSquare, Check, CheckCheck,
  ChevronLeft, MoreVertical, Phone, Video, Paperclip, Smile,
} from 'lucide-react';
import {
  getAuth, getConversationsForUser, getMessagesForConversation,
  sendMessage, markMessagesRead, getConversations,
} from '@/lib/storage';
import { Conversation, Message, AuthState } from '@/lib/types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  return `${days}j`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Aujourd\'hui';
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function uid() { return Math.random().toString(36).slice(2, 10); }

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(role: string) {
  if (role === 'coach') return 'from-blue-500 to-blue-700';
  if (role === 'admin') return 'from-purple-500 to-purple-700';
  return 'from-cyan-500 to-cyan-700';
}

// ─── Conversation List ────────────────────────────────────────────────────────

function ConversationList({
  conversations, selectedId, currentUserId, onSelect, search, setSearch,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  currentUserId: string;
  onSelect: (c: Conversation) => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const map: Record<string, number> = {};
    conversations.forEach(c => {
      const msgs = getMessagesForConversation(c.id);
      map[c.id] = msgs.filter(m => m.senderId !== currentUserId && !m.readBy.includes(currentUserId)).length;
    });
    setUnreadMap(map);
  }, [conversations, currentUserId]);

  const filtered = conversations.filter(c => {
    const otherName = Object.entries(c.participantNames)
      .find(([id]) => id !== currentUserId)?.[1] ?? '';
    return otherName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">Aucune conversation</div>
        ) : filtered.map(conv => {
          const otherId = conv.participantIds.find(id => id !== currentUserId) ?? '';
          const otherName = conv.participantNames[otherId] ?? 'Inconnu';
          const otherRole = conv.participantRoles[otherId] ?? 'client';
          const unread = unreadMap[conv.id] ?? 0;
          const isSelected = conv.id === selectedId;
          const isLastMine = conv.lastSenderId === currentUserId;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left border-b border-slate-800/50
                ${isSelected ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : 'hover:bg-slate-800/50'}`}
            >
              {/* Avatar */}
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(otherRole)} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
                {getInitials(otherName)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm font-semibold truncate ${unread > 0 ? 'text-white' : 'text-slate-200'}`}>
                    {otherName}
                  </span>
                  <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                    {conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs truncate flex-1 ${unread > 0 ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>
                    {isLastMine && <span className="text-slate-600 mr-1">Vous :</span>}
                    {conv.lastMessage ?? 'Démarrer la conversation'}
                  </p>
                  {unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chat Window ──────────────────────────────────────────────────────────────

function ChatWindow({
  conversation, currentUserId, currentUserName, currentUserRole, onBack,
}: {
  conversation: Conversation;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const otherId = conversation.participantIds.find(id => id !== currentUserId) ?? '';
  const otherName = conversation.participantNames[otherId] ?? 'Inconnu';
  const otherRole = conversation.participantRoles[otherId] ?? 'client';

  useEffect(() => {
    const msgs = getMessagesForConversation(conversation.id);
    setMessages(msgs);
    markMessagesRead(conversation.id, currentUserId);
  }, [conversation.id, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const msg: Message = {
      id: `msg-${uid()}`,
      conversationId: conversation.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole as any,
      content: text,
      createdAt: new Date().toISOString(),
      readBy: [currentUserId],
    };
    sendMessage(msg);
    setMessages(prev => [...prev, msg]);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by day
  const groups: { day: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const day = formatDay(msg.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.msgs.push(msg);
    else groups.push({ day, msgs: [msg] });
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <button onClick={onBack} className="lg:hidden text-slate-400 hover:text-white p-1 mr-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(otherRole)} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
          {getInitials(otherName)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{otherName}</p>
          <p className="text-xs text-slate-500 capitalize">{otherRole === 'coach' ? 'Coach' : otherRole === 'client' ? 'Client' : 'Admin'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors">
            <Phone className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors">
            <Video className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(otherRole)} flex items-center justify-center text-xl font-bold text-white`}>
              {getInitials(otherName)}
            </div>
            <p className="text-white font-semibold">{otherName}</p>
            <p className="text-sm text-slate-500">Démarrez la conversation</p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.day}>
            {/* Day separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-500 px-2">{group.day}</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {group.msgs.map((msg, i) => {
              const isMine = msg.senderId === currentUserId;
              const prev = group.msgs[i - 1];
              const isFirst = !prev || prev.senderId !== msg.senderId;
              const isRead = isMine && msg.readBy.includes(otherId);

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${isFirst ? 'mt-3' : 'mt-1'}`}
                >
                  {/* Avatar (only on first message of a group) */}
                  {!isMine && (
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(otherRole)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${!isFirst ? 'opacity-0' : ''}`}>
                      {getInitials(otherName)}
                    </div>
                  )}

                  <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                        ${isMine
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
                          : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/50'
                        }`}
                    >
                      {msg.content}
                    </div>
                    <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs text-slate-600">{formatTime(msg.createdAt)}</span>
                      {isMine && (
                        isRead
                          ? <CheckCheck className="w-3 h-3 text-blue-400" />
                          : <Check className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80">
        <div className="flex items-end gap-2 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 focus-within:border-blue-500 transition-colors">
          <button className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mb-1">
            <Paperclip className="w-4 h-4" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Écrivez un message... (Entrée pour envoyer)"
            rows={1}
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none resize-none max-h-32 py-1"
            style={{ lineHeight: '1.5' }}
          />
          <button className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mb-1">
            <Smile className="w-4 h-4" />
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-600 text-white flex items-center justify-center transition-all flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-1.5 text-center">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ user: null, role: null, isAuthenticated: false });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const a = getAuth();
    if (!a.isAuthenticated || !a.user) { router.push('/'); return; }
    setAuth(a);
    const convs = getConversationsForUser(a.user.id);
    setConversations(convs);
  }, [router]);

  // Poll for new messages every 2s
  useEffect(() => {
    if (!auth.user) return;
    const interval = setInterval(() => {
      const convs = getConversationsForUser(auth.user!.id);
      setConversations([...convs]);
      if (selected) {
        const fresh = convs.find(c => c.id === selected.id);
        if (fresh) setSelected(fresh);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [auth.user, selected]);

  const handleSelect = (conv: Conversation) => {
    setSelected(conv);
    setMobileView('chat');
    if (auth.user) markMessagesRead(conv.id, auth.user.id);
  };

  if (!mounted || !auth.user) return null;

  return (
    <div className="h-[calc(100vh-4rem)] -mt-6 -mx-6 flex overflow-hidden rounded-xl border border-slate-800">
      {/* Sidebar conversations */}
      <div className={`w-full lg:w-80 xl:w-96 flex-shrink-0 bg-slate-900 border-r border-slate-800
        ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'} flex-col`}>
        <ConversationList
          conversations={conversations}
          selectedId={selected?.id ?? null}
          currentUserId={auth.user.id}
          onSelect={handleSelect}
          search={search}
          setSearch={setSearch}
        />
      </div>

      {/* Chat area */}
      <div className={`flex-1 bg-slate-950 ${mobileView === 'list' && !selected ? 'hidden lg:flex' : 'flex'} flex-col`}>
        {selected ? (
          <ChatWindow
            conversation={selected}
            currentUserId={auth.user.id}
            currentUserName={auth.user.name}
            currentUserRole={auth.role ?? 'client'}
            onBack={() => { setSelected(null); setMobileView('list'); }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-8">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-slate-600" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Vos messages</p>
              <p className="text-slate-500 text-sm mt-1">Sélectionnez une conversation pour commencer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
