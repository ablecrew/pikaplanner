'use client'
import { Bell, Check, Package, ChefHat, CreditCard, Info, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface NotifsPanelProps {
  notifications: any[]
  onMarkAllRead: () => void
  onClose: () => void
}

const NOTIF_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  order: { icon: Package, color: '#1A5C3A', bg: '#D1FAE5' },
  payment: { icon: CreditCard, color: '#1E40AF', bg: '#DBEAFE' },
  vendor: { icon: ChefHat, color: '#D97706', bg: '#FEF3C7' },
  default: { icon: Info, color: '#6B7280', bg: '#F3F4F6' },
}

export function NotificationsPanel({ notifications, onMarkAllRead, onClose }: NotifsPanelProps) {
  const unread = notifications.filter(n => !n.is_read).length

  const getIcon = (notif: any) => {
    const type = notif.metadata?.type || 'default'
    return NOTIF_ICONS[type] || NOTIF_ICONS.default
  }

  return (
    <div
      style={{
        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
        width: 340, maxHeight: 420,
        background: 'white',
        borderRadius: 16,
        border: '1px solid #E8EAE8',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} color="#1A5C3A" />
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#111' }}>Notifications</span>
          {unread > 0 && (
            <span style={{ background: '#EF4444', color: 'white', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px', fontFamily: "'Poppins', sans-serif" }}>{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={onMarkAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#1A5C3A', fontFamily: "'Poppins', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={12} /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
            <p style={{ fontSize: 13, color: '#888', fontFamily: "'Poppins', sans-serif" }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif, i) => {
            const cfg = getIcon(notif)
            const IconComp = cfg.icon
            return (
              <div
                key={notif.id || i}
                style={{
                  display: 'flex', gap: 12, padding: '12px 16px',
                  background: notif.is_read ? 'white' : 'rgba(50,205,50,0.04)',
                  borderBottom: '1px solid #F3F4F6',
                  borderLeft: notif.is_read ? '3px solid transparent' : '3px solid #32CD32',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconComp size={16} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', fontFamily: "'Poppins', sans-serif", marginBottom: 2 }}>{notif.title}</p>
                  <p style={{ fontSize: 12, color: '#666', fontFamily: "'Poppins', sans-serif", lineHeight: 1.4 }}>{notif.body}</p>
                  <p style={{ fontSize: 10, color: '#AAA', fontFamily: "'Poppins', sans-serif", marginTop: 4 }}>
                    {notif.sent_at ? formatDistanceToNow(new Date(notif.sent_at), { addSuffix: true }) : ''}
                  </p>
                </div>
                {!notif.is_read && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#32CD32', flexShrink: 0, marginTop: 5 }} />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}