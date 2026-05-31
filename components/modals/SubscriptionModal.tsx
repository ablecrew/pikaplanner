'use client'
import { useState } from 'react'
import { X, Crown, Check, Sparkles, Zap, Star, Loader2 } from 'lucide-react'
import { useSubscriptionPlans } from '@/hooks/useMeals'
import { useAuth } from '@/contexts/AuthContext'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
}

const TIER_CONFIG: Record<string, { icon: any; color: string; bg: string; gradient: string; popular?: boolean }> = {
  free:    { icon: Star,     color: '#6B7280', bg: '#F3F4F6', gradient: '#F3F4F6, #E5E7EB' },
  daily:   { icon: Zap,      color: '#1E40AF', bg: '#DBEAFE', gradient: '#EFF6FF, #DBEAFE' },
  weekly:  { icon: Sparkles, color: '#1A5C3A', bg: '#D1FAE5', gradient: '#F0FDF4, #D1FAE5', popular: true },
  monthly: { icon: Crown,    color: '#D97706', bg: '#FEF3C7', gradient: '#FFFBEB, #FEF3C7' },
  yearly:  { icon: Crown,    color: '#7C3AED', bg: '#EDE9FE', gradient: '#F5F3FF, #EDE9FE' },
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { plans, loading } = useSubscriptionPlans()
  const { profile } = useAuth()
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  if (!isOpen) return null

  const handleSubscribe = async (tier: string, priceKes: number) => {
    if (tier === 'free') return
    setSelectedTier(tier)
    setProcessing(true)
    // M-Pesa integration point — you'll wire this to your Daraja API
    // For now: route to checkout
    setTimeout(() => {
      window.location.href = `/checkout?tier=${tier}&amount=${priceKes}`
    }, 800)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 20,
          width: '100%', maxWidth: 640,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 20px',
          background: 'linear-gradient(135deg, #1A5C3A 0%, #0d3d26 100%)',
          borderRadius: '20px 20px 0 0',
          position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color="white" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Crown size={22} color="#F4A535" />
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: 'white' }}>
              Choose Your Plan
            </h2>
          </div>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
            Unlock AI meal planning, premium recipes, and more.
          </p>
        </div>

        {/* Plans grid */}
        <div style={{ padding: '20px 20px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Loader2 size={28} color="#1A5C3A" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {plans.map(plan => {
                const cfg = TIER_CONFIG[plan.tier] || TIER_CONFIG.free
                const IconComp = cfg.icon
                const isCurrent = profile?.subscription_tier === plan.tier
                const isPopular = cfg.popular

                return (
                  <div
                    key={plan.tier}
                    onClick={() => !isCurrent && handleSubscribe(plan.tier, plan.price_kes)}
                    style={{
                      borderRadius: 14,
                      border: isPopular ? '2px solid #1A5C3A' : isCurrent ? '2px solid #32CD32' : '1.5px solid #E5E7EB',
                      padding: '16px 18px',
                      cursor: isCurrent || plan.tier === 'free' ? 'default' : 'pointer',
                      background: isPopular ? 'linear-gradient(135deg, #F0FDF4 0%, #D1FAE5 100%)' : 'white',
                      position: 'relative',
                      transition: 'all 0.15s',
                      opacity: processing && selectedTier !== plan.tier ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { if (!isCurrent && plan.tier !== 'free') (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                  >
                    {isPopular && (
                      <div style={{
                        position: 'absolute', top: -11, left: 18,
                        background: '#1A5C3A', color: 'white',
                        fontSize: 10, fontWeight: 700,
                        padding: '2px 10px', borderRadius: 10,
                        fontFamily: "'Poppins', sans-serif",
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        Most Popular
                      </div>
                    )}
                    {isCurrent && (
                      <div style={{
                        position: 'absolute', top: -11, right: 18,
                        background: '#32CD32', color: 'white',
                        fontSize: 10, fontWeight: 700,
                        padding: '2px 10px', borderRadius: 10,
                        fontFamily: "'Poppins', sans-serif",
                      }}>
                        Current Plan
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconComp size={19} color={cfg.color} />
                        </div>
                        <div>
                          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: '#111' }}>{plan.display_name}</p>
                          <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: '#888' }}>
                            {plan.duration_days ? `${plan.duration_days} day${plan.duration_days > 1 ? 's' : ''}` : 'Forever free'}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 20, color: plan.tier === 'free' ? '#888' : '#1A5C3A' }}>
                          {plan.price_kes === 0 ? 'Free' : `KES ${plan.price_kes}`}
                        </p>
                        {plan.tier === 'yearly' && (
                          <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: '#1A5C3A', fontWeight: 600 }}>Save 33% vs monthly</p>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {plan.features?.map((f: string, i: number) => (
                        <span
                          key={i}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 11.5, color: '#555',
                            fontFamily: "'Poppins', sans-serif",
                            background: 'rgba(0,0,0,0.04)',
                            padding: '3px 8px', borderRadius: 6,
                          }}
                        >
                          <Check size={10} color="#1A5C3A" />
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    {!isCurrent && plan.tier !== 'free' && (
                      <button
                        style={{
                          width: '100%', marginTop: 14,
                          padding: '10px',
                          borderRadius: 10,
                          border: 'none',
                          background: isPopular ? '#1A5C3A' : cfg.bg,
                          color: isPopular ? 'white' : cfg.color,
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 700, fontSize: 13.5,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        }}
                      >
                        {processing && selectedTier === plan.tier ? (
                          <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Redirecting to M-Pesa...</>
                        ) : (
                          <>Pay with M-Pesa · KES {plan.price_kes}</>
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 11.5, color: '#AAA', fontFamily: "'Poppins', sans-serif" }}>
            Secure payments via M-Pesa Daraja API · Cancel anytime
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}