import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BrainCircuit, ShieldAlert, Award, FileClock, Check, Sparkles } from 'lucide-react';
import { Badge } from './Badge';
import { cn } from '../../utils';

interface NotifProps {
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export function AISmartNotifications({ onClose, onUnreadCountChange }: NotifProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'ai'>('ai');

  // Mock Notification Center entries
  const [notifications, setNotifications] = useState([
    {
      id: 'n-ai-01',
      type: 'ai_recommendation',
      title: 'Optimal Vendor Recommendation',
      desc: 'AI recommends Infra Supplies for RFQ-2025-001 (Furniture) with a 91/100 matching score.',
      priority: 'high',
      time: '5m ago',
      read: false,
      link: '/quotations/compare',
      icon: Award,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'n-ai-02',
      type: 'vendor_alert',
      title: 'Lead-Time Delivery Risk',
      desc: 'Office Depot (QT-003) delivery window (20d) poses a high schedule risk for RFQ completion.',
      priority: 'high',
      time: '1h ago',
      read: false,
      link: '/quotations/compare',
      icon: ShieldAlert,
      color: 'text-red-400 bg-red-500/10 border-red-500/20'
    },
    {
      id: 'n-ai-03',
      type: 'procurement_insight',
      title: 'Bulk Cost Saving Opportunity',
      desc: 'Consolidating Q3 IT Hardware orders can unlock a 12% bulk discount ($38,400 savings).',
      priority: 'medium',
      time: '3h ago',
      read: true,
      link: '/reports',
      icon: Sparkles,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'n-ai-04',
      type: 'approval_reminder',
      title: 'Critical Approval Required',
      desc: 'PO-2025-0043 ($177,920) has been pending Department Review for over 18 hours.',
      priority: 'medium',
      time: '5h ago',
      read: false,
      link: '/approvals',
      icon: FileClock,
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    },
    {
      id: 'n-std-01',
      type: 'standard',
      title: 'Quotation Submitted',
      desc: 'FastLog Solutions submitted pricing for Logistics Partner RFQ.',
      priority: 'low',
      time: '1d ago',
      read: true,
      link: '/quotations',
      icon: Bell,
      color: 'text-muted-foreground bg-muted border-border'
    }
  ]);

  const handleNotifClick = (n: any) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(item => (item.id === n.id ? { ...item, read: true } : item))
    );
    onClose();
    navigate(n.link);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(item => ({ ...item, read: true })));
  };

  const filteredNotifs = notifications.filter(n => {
    if (activeTab === 'ai') return n.type !== 'standard';
    return true;
  });

  // Sync back unread count to parent navbar header if available
  const totalUnreadCount = notifications.filter(n => !n.read).length;
  
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(totalUnreadCount);
    }
  }, [totalUnreadCount, onUnreadCountChange]);

  return (
    <div className="w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
      {/* Header */}
      <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BrainCircuit className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Smart Notification Center</h3>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 select-none"
        >
          <Check className="w-3 h-3" /> Mark all read
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60 bg-muted/20 text-[11px]">
        <button
          onClick={() => setActiveTab('ai')}
          className={cn(
            'flex-1 py-2 text-center font-bold transition-all border-b-2 flex items-center justify-center gap-1.5',
            activeTab === 'ai'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" /> AI Recommendations
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'flex-1 py-2 text-center font-bold transition-all border-b-2 flex items-center justify-center gap-1.5',
            activeTab === 'all'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Bell className="w-3.5 h-3.5" /> All System Alerts
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-border/60 max-h-[360px] overflow-y-auto">
        {filteredNotifs.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No active smart notifications in this category.
          </div>
        ) : (
          filteredNotifs.map(n => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                onClick={() => handleNotifClick(n)}
                className={cn(
                  'px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors relative flex items-start gap-3',
                  !n.read && 'bg-emerald-500/5'
                )}
              >
                {/* Glowing unread dot */}
                {!n.read && (
                  <span className="absolute left-1.5 top-[18px] w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-green shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}

                {/* Circular Icon representation */}
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center border shrink-0', n.color)}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                    {/* Glowing priority badges */}
                    <Badge
                      variant={n.priority === 'high' ? 'rejected' : n.priority === 'medium' ? 'pending' : 'outline'}
                      className={cn(
                        'text-[8px] px-1.5 py-0 uppercase font-black shrink-0 tracking-wider shadow-sm',
                        n.priority === 'high' && 'shadow-red-950/20 text-red-400 border-red-500/30 bg-red-500/10',
                        n.priority === 'medium' && 'shadow-yellow-950/20 text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
                        n.priority === 'low' && 'shadow-emerald-950/20 text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                      )}
                    >
                      {n.priority}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">{n.desc}</p>
                  <span className="text-[9px] text-muted-foreground/60 block mt-1">{n.time}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="px-4 py-2 border-t border-border bg-muted/20 text-center">
        <span className="text-[10px] text-muted-foreground font-semibold">
          AI Copilot Scan Completed 1m ago
        </span>
      </div>
    </div>
  );
}
