import { Bell, Search, Menu, ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Breadcrumb } from '../ui/Breadcrumb';
import { useNavigate } from 'react-router-dom';
import { AISmartNotifications } from '../ui/AISmartNotifications';

interface NavbarProps {
  onMobileMenuOpen: () => void;
}

export function Navbar({ onMobileMenuOpen }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(3);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
      if (notifsRef.current && !notifsRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-4 shrink-0 sticky top-0 z-40">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuOpen}
        className="md:hidden p-2 rounded-md hover:bg-muted text-muted-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 hidden sm:block">
        <Breadcrumb />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          {showSearch && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl p-3 animate-fade-in">
              <input
                autoFocus
                placeholder="Search vendors, RFQs, orders..."
                className="input-field text-sm"
                onBlur={() => setTimeout(() => setShowSearch(false), 150)}
              />
              <div className="mt-2 space-y-1">
                {['Office Furniture RFQ', 'Infra Supplies Pvt Ltd', 'PO-2025-0043'].map(item => (
                  <div key={item} className="px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-md cursor-pointer">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
            className="relative p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="w-4 h-4" />
            {localUnreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-green shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 z-50">
              <AISmartNotifications onClose={() => setShowNotifs(false)} onUnreadCountChange={setLocalUnreadCount} />
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-400">
                {user?.firstName[0]}{user?.lastName[0]}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-foreground leading-none">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-muted-foreground">{user?.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-2xl animate-fade-in z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <div className="p-2">
                <button onClick={() => { setShowProfile(false); navigate('/profile'); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors">
                  <UserIcon className="w-4 h-4" /> My Profile
                </button>
                <button onClick={() => { setShowProfile(false); navigate('/settings'); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors">
                  <Settings className="w-4 h-4" /> Settings
                </button>
              </div>
              <div className="p-2 border-t border-border">
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
