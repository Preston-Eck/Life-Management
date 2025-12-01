
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, CheckSquare, Users, ShoppingCart, Truck, BookOpen, Menu, Bell, X, Check, Clock, Pin, ExternalLink, Cloud } from 'lucide-react';
import { useAppStore } from '../store/AppContext';
import { GoogleIntegrationModal } from './GoogleIntegration';

const NavItem = ({ to, icon: Icon, label, active }: any) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Mentions'>('All');
  const { notifications, markNotificationRead, clearNotifications, snoozeNotification, pinNotification } = useAppStore();

  const visibleNotifications = notifications
    .filter(n => !n.snoozedUntil || new Date(n.snoozedUntil) < new Date())
    .sort((a, b) => (b.isPinned === a.isPinned ? 0 : b.isPinned ? 1 : -1));

  const displayedNotifications = activeTab === 'All' 
    ? visibleNotifications 
    : visibleNotifications.filter(n => n.type === 'Mention');

  const unreadCount = visibleNotifications.filter(n => !n.isRead).length;

  const handleSnooze = (id: string) => {
    // Snooze for 1 hour
    const date = new Date();
    date.setHours(date.getHours() + 1);
    snoozeNotification(id, date);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">Nexus</h1>
             <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-slate-400"><Menu/></button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <NavItem to="/" icon={Home} label="Dashboard" active={location.pathname === '/'} />
            <NavItem to="/tasks" icon={CheckSquare} label="Tasks" active={location.pathname.startsWith('/tasks')} />
            <NavItem to="/people" icon={Users} label="People & Family" active={location.pathname.startsWith('/people')} />
            <NavItem to="/assets" icon={Truck} label="Assets" active={location.pathname.startsWith('/assets')} />
            <NavItem to="/shopping" icon={ShoppingCart} label="Shopping" active={location.pathname.startsWith('/shopping')} />
            <NavItem to="/library" icon={BookOpen} label="Library (WIP)" active={location.pathname.startsWith('/library')} />
          </nav>
          <div className="p-4 border-t border-slate-800">
             <div className="flex items-center space-x-3">
               <img src="https://picsum.photos/40" alt="User" className="w-10 h-10 rounded-full border-2 border-indigo-500" />
               <div>
                 <p className="text-sm font-semibold">Alex Mercer</p>
                 <p className="text-xs text-slate-400">Head of Household</p>
               </div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center lg:hidden">
              <button onClick={() => setMobileMenuOpen(true)} className="text-white mr-4"><Menu/></button>
              <span className="font-bold text-lg">Nexus</span>
            </div>
            
            <div className="flex-1"></div>

            <div className="flex items-center space-x-4">
               <button 
                onClick={() => setShowGoogleModal(true)}
                className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
                title="Google Sync & Integrations"
               >
                 <Cloud size={20} />
               </button>

              <div className="relative">
                <button 
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-slate-900"></span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
                      <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-sm">Notifications</h3>
                          <button onClick={clearNotifications} className="text-xs text-indigo-400 hover:text-indigo-300">Clear All</button>
                      </div>
                      <div className="flex space-x-2">
                          <button 
                              onClick={() => setActiveTab('All')}
                              className={`flex-1 py-1 text-xs rounded transition-colors ${activeTab === 'All' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                          >
                              All
                          </button>
                          <button 
                              onClick={() => setActiveTab('Mentions')}
                              className={`flex-1 py-1 text-xs rounded transition-colors ${activeTab === 'Mentions' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                          >
                              Mentions Inbox
                          </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {displayedNotifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No new {activeTab === 'Mentions' ? 'mentions' : 'notifications'}</div>
                      ) : (
                        displayedNotifications.map(n => (
                          <div key={n.id} className={`p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors ${!n.isRead ? 'bg-indigo-500/5' : ''} ${n.isPinned ? 'border-l-4 border-l-amber-500' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                               <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                 n.type === 'Alert' ? 'bg-red-500/20 text-red-400' : 
                                 n.type === 'Assignment' ? 'bg-blue-500/20 text-blue-400' : 
                                 n.type === 'Mention' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-300'
                               }`}>{n.type}</span>
                               <div className="flex space-x-1">
                                  {n.type === 'Mention' && (
                                      <>
                                          <button onClick={() => pinNotification(n.id)} title={n.isPinned ? "Unpin" : "Pin"} className={`p-1 rounded hover:bg-slate-700 ${n.isPinned ? 'text-amber-400' : 'text-slate-500'}`}>
                                              <Pin size={12} />
                                          </button>
                                          <button onClick={() => handleSnooze(n.id)} title="Snooze 1h" className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white">
                                              <Clock size={12} />
                                          </button>
                                          {n.linkTo && (
                                              <button 
                                                  onClick={() => {
                                                      markNotificationRead(n.id);
                                                      setNotifOpen(false);
                                                      navigate(n.linkTo!);
                                                  }} 
                                                  title="Go to Task" 
                                                  className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-indigo-400"
                                              >
                                                  <ExternalLink size={12} />
                                              </button>
                                          )}
                                      </>
                                  )}
                                  <button onClick={() => markNotificationRead(n.id)} title="Mark Read" className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-emerald-400">
                                      <Check size={12}/>
                                  </button>
                               </div>
                            </div>
                            <p className="text-sm text-slate-200 mb-1">{n.message}</p>
                            <span className="text-xs text-slate-500">{new Date(n.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {children}
        </div>
      </main>

      {showGoogleModal && <GoogleIntegrationModal onClose={() => setShowGoogleModal(false)} />}
    </div>
  );
};
