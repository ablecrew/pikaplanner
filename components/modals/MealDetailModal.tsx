'use client'
import { useState } from 'react'
import Image from 'next/image'
import {
  X, Clock, Flame, ChefHat, Star, Truck, BookOpen,
  ShoppingCart, Users, BarChart3, CheckCircle2, MapPin, Phone, Loader2
} from 'lucide-react'
import { useMealDetail } from '@/hooks/useMeals'

interface MealDetailModalProps {
  mealId: string | null
  onClose: () => void
  onAddToPlan?: (meal: any) => void
}

const DIFF_CONFIG = {
  easy: { label: 'Easy', color: '#1A5C3A', bg: '#D1FAE5' },
  medium: { label: 'Medium', color: '#D97706', bg: '#FEF3C7' },
  hard: { label: 'Hard', color: '#DC2626', bg: '#FEE2E2' },
}

const CUISINE_EMOJI: Record<string, string> = {
  kenyan: '🇰🇪', swahili: '🌊', italian: '🇮🇹',
  american: '🇺🇸', healthy: '🥗', occasion: '🎉', other: '🌍',
}

export function MealDetailModal({ mealId, onClose, onAddToPlan }: MealDetailModalProps) {
  const { meal, loading, error } = useMealDetail(mealId)
  const [activeTab, setActiveTab] = useState<'recipe' | 'vendors'>('recipe')
  const [imgError, setImgError] = useState(false)

  if (!mealId) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.16)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {loading && (
          <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader2 size={28} color="#1A5C3A" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#888' }}>Loading meal details...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, color: '#EF4444' }}>Failed to load meal</p>
          </div>
        )}

        {meal && (
          <>
            {/* Hero Image */}
            <div style={{ position: 'relative', height: 220, background: '#F0FAF5', overflow: 'hidden', flexShrink: 0 }}>
              {meal.image_url && !imgError ? (
                <Image
                  src={meal.image_url}
                  alt={meal.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
                  {CUISINE_EMOJI[meal.cuisine] || '🍽️'}
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />

              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 34, height: 34, borderRadius: 10,
                  background: 'rgba(0,0,0,0.5)', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={17} color="white" />
              </button>

              {/* Bottom overlay info */}
              <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                  {meal.difficulty && (
                    <span style={{
                      ...DIFF_CONFIG[meal.difficulty as keyof typeof DIFF_CONFIG],
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 8,
                      fontFamily: "'Poppins', sans-serif",
                    }}>
                      {DIFF_CONFIG[meal.difficulty as keyof typeof DIFF_CONFIG]?.label}
                    </span>
                  )}
                  {meal.tags?.slice(0, 2).map((tag: string) => (
                    <span key={tag} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8, fontFamily: "'Poppins', sans-serif", backdropFilter: 'blur(4px)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: 'white', lineHeight: 1.2 }}>
                  {meal.name}
                </h2>
              </div>
            </div>

            {/* Nutrition strip */}
            <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', padding: '12px 16px', gap: 0 }}>
              {[
                { label: 'Calories', value: `${meal.calories_per_serving || '—'} kcal`, icon: Flame, color: '#DC2626' },
                { label: 'Prep time', value: `${(meal.prep_time_minutes || 0) + (meal.cook_time_minutes || 0)} min`, icon: Clock, color: '#D97706' },
                { label: 'Servings', value: `${meal.servings || 2}`, icon: Users, color: '#1E40AF' },
                { label: 'Protein', value: meal.protein_g ? `${Math.round(meal.protein_g)}g` : '—', icon: BarChart3, color: '#1A5C3A' },
              ].map((stat, i) => (
                <div key={stat.label} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', borderRight: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
                  <stat.icon size={14} color={stat.color} style={{ margin: '0 auto 3px' }} />
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, color: '#111' }}>{stat.value}</p>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 10, color: '#888' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {meal.description && (
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13.5, color: '#555', lineHeight: 1.6 }}>{meal.description}</p>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #F3F4F6', padding: '0 16px' }}>
              {[
                { id: 'recipe', label: 'Recipe', icon: BookOpen },
                { id: 'vendors', label: `Order (${meal.vendor_meals?.filter((vm: any) => vm.is_available).length || 0} vendors)`, icon: Truck },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '12px 16px',
                    border: 'none', background: 'none', cursor: 'pointer',
                    borderBottom: activeTab === tab.id ? '2px solid #1A5C3A' : '2px solid transparent',
                    marginBottom: -2,
                    color: activeTab === tab.id ? '#1A5C3A' : '#888',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontSize: 13.5,
                    transition: 'all 0.15s',
                  }}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: '16px' }}>
              {activeTab === 'recipe' && (
                <>
                  {/* Ingredients */}
                  {meal.recipe_ingredients?.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShoppingCart size={15} color="#1A5C3A" /> Ingredients
                      </h3>
                      <div style={{ background: '#F8FBF9', borderRadius: 12, overflow: 'hidden' }}>
                        {[...meal.recipe_ingredients]
                          .sort((a: any, b: any) => a.sort_order - b.sort_order)
                          .map((ing: any, i: number) => (
                            <div key={ing.id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '10px 14px',
                              borderBottom: i < meal.recipe_ingredients.length - 1 ? '1px solid #EDF7F2' : 'none',
                            }}>
                              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#333', display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#32CD32', flexShrink: 0 }} />
                                {ing.name}
                                {ing.is_optional && <span style={{ fontSize: 10, color: '#AAA', fontStyle: 'italic' }}>(optional)</span>}
                              </span>
                              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: '#1A5C3A', fontWeight: 600, background: '#E8F4EE', padding: '2px 8px', borderRadius: 6 }}>
                                {ing.quantity} {ing.unit || ''}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  {meal.recipe_steps?.length > 0 && (
                    <div>
                      <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ChefHat size={15} color="#1A5C3A" /> Instructions
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[...meal.recipe_steps]
                          .sort((a: any, b: any) => a.step_number - b.step_number)
                          .map((step: any) => (
                            <div key={step.id} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#F8FBF9', borderRadius: 12 }}>
                              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1A5C3A', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Poppins', sans-serif" }}>
                                {step.step_number}
                              </div>
                              <div>
                                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#333', lineHeight: 1.55 }}>{step.instruction}</p>
                                {step.tip && <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11.5, color: '#888', marginTop: 5, fontStyle: 'italic' }}>💡 {step.tip}</p>}
                                {step.duration_minutes && (
                                  <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: '#D97706', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Clock size={10} /> {step.duration_minutes} min
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {meal.recipe_steps?.length === 0 && meal.recipe_ingredients?.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#AAA' }}>Recipe details coming soon</p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'vendors' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {meal.vendor_meals?.filter((vm: any) => vm.is_available && vm.vendor?.is_accepting_orders).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32 }}>
                      <p style={{ fontSize: 36, marginBottom: 10 }}>🍽️</p>
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 6 }}>No vendors available right now</p>
                      <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: '#888' }}>Try cooking this meal yourself using the recipe!</p>
                    </div>
                  ) : (
                    meal.vendor_meals
                      ?.filter((vm: any) => vm.is_available)
                      .map((vm: any) => (
                        <div key={vm.id} style={{ border: '1px solid #E5E7EB', borderRadius: 14, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              {vm.vendor?.logo_url ? (
                                <Image src={vm.vendor.logo_url} alt={vm.vendor.business_name} width={40} height={40} style={{ borderRadius: 10, objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ChefHat size={18} color="#1A5C3A" />
                                </div>
                              )}
                              <div>
                                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: '#111' }}>{vm.vendor?.business_name}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <MapPin size={10} /> {vm.vendor?.location_city}
                                  </span>
                                  {vm.vendor?.average_rating && (
                                    <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: '#D97706', display: 'flex', alignItems: 'center', gap: 3 }}>
                                      <Star size={10} fill="#D97706" /> {Number(vm.vendor.average_rating).toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 17, color: '#1A5C3A' }}>KES {vm.price}</p>
                              {vm.preparation_time_minutes && (
                                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                                  <Clock size={10} /> {vm.preparation_time_minutes} min
                                </p>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: vm.vendor?.is_accepting_orders ? '#1A5C3A' : '#EF4444', fontFamily: "'Poppins', sans-serif" }}>
                              <CheckCircle2 size={11} color={vm.vendor?.is_accepting_orders ? '#1A5C3A' : '#EF4444'} />
                              {vm.vendor?.is_accepting_orders ? 'Accepting orders' : 'Closed'}
                            </div>
                          </div>
                          {vm.vendor?.is_accepting_orders && (
                            <button
                              style={{
                                width: '100%', marginTop: 12,
                                padding: '11px',
                                borderRadius: 10, border: 'none',
                                background: '#1A5C3A', color: 'white',
                                fontFamily: "'Poppins', sans-serif",
                                fontWeight: 700, fontSize: 13.5,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                              }}
                              onClick={() => window.location.href = `/order?vendor=${vm.vendor_id}&meal=${meal.id}&vm=${vm.id}`}
                            >
                              <Truck size={14} /> Order from {vm.vendor?.business_name}
                            </button>
                          )}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* Sticky bottom CTA */}
            {onAddToPlan && (
              <div style={{ position: 'sticky', bottom: 0, padding: '12px 16px', background: 'white', borderTop: '1px solid #F3F4F6' }}>
                <button
                  onClick={() => { onAddToPlan(meal); onClose() }}
                  style={{
                    width: '100%', padding: '13px',
                    borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #1A5C3A 0%, #0d3d26 100%)',
                    color: 'white',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 700, fontSize: 14.5,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <CheckCircle2 size={16} /> Add to Meal Plan
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}