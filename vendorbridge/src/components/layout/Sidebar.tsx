import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  CheckSquare,
  ShoppingCart,
  Receipt,
  BarChart3,
  Activity,
  ChevronLeft,
  Zap,
  X,
} from 'lucide-react';
import { cn } from '../../utils';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/vendors', icon: Users, label: 'Vendors' },
  { path: '/rfqs', icon: FileText, label: 'RFQs' },
  { path: '/quotations', icon: MessageSquare, label: 'Quotations' },
  { path: '/approvals', icon: CheckSquare, label: 'Approvals' },
  { path: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders' },
  { path: '/invoices', icon: Receipt, label: 'Invoices' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/activity-logs', icon: Activity, label: 'Activity Logs' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center px-4 py-5 border-b border-sidebar-border',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-base font-bold text-foreground">VendorBridge</span>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">ERP Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase text-muted-foreground/60 tracking-wider px-2 mb-3">
            Main Menu
          </p>
        )}
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path ||
            (path !== '/dashboard' && location.pathname.startsWith(path));
          return (
            <NavLink
              key={path}
              to={path}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              {isActive && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-500 rounded-r-full" />
              )}
              <Icon className={cn('shrink-0 transition-transform group-hover:scale-110', isActive ? 'w-4 h-4' : 'w-4 h-4')} />
              {!collapsed && <span>{label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded-md text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="bg-emerald-500/10 rounded-lg p-3">
            <p className="text-xs font-semibold text-emerald-400 mb-1">VendorBridge Pro</p>
            <p className="text-[10px] text-muted-foreground">v2.5.1 · Enterprise Edition</p>
          </div>
        </div>
      )}

      {/* Toggle button (desktop) */}
      <button
        onClick={onToggle}
        className="hidden md:flex items-center justify-center w-full py-3 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col bg-sidebar-background border-r border-sidebar-border transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <aside className="relative w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col animate-slide-in">
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
