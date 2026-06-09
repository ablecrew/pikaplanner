'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Heart, Clock, Flame, Users, ChefHat, ArrowLeft, ShoppingCart, BookOpen,
  CheckCircle2, AlertCircle, Sparkles, Lightbulb, Package, Calendar, Globe,
  ChevronRight, Printer, Share2, Eye, Loader2,
} from 'lucide-react'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import { Recipe, toggleSaveRecipeAction } from '../actions'

export default function RecipeDetailClient({ recipe: initialRecipe }: { recipe: Recipe }) {
  const [recipe, setRecipe] = useState(initialRecipe)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [servingsMultiplier, setServingsMultiplier] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [, startTransition] = useTransition()

  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)
  const baseServings = recipe.servings ?? 4
  const adjustedServings = baseServings * servingsMultiplier

  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleStep = (stepNum: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      next.has(stepNum) ? next.delete(stepNum) : next.add(stepNum)
      return next
    })
  }

  const handleSave = () => {
    setIsSaving(true)
    startTransition(async () => {
      const result = await toggleSaveRecipeAction(recipe.id)
      if (result.success) {
        setRecipe((prev) => ({ ...prev, is_saved: result.saved }))
      }
      setIsSaving(false)
    })
  }

  const totalEstimatedCost = (recipe.ingredients ?? []).reduce(
    (sum, ing) => sum + (Number(ing.estimated_price) || 0) * servingsMultiplier,
    0
  )

  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : []

  return (
    <div className="min-h-screen bg-[#f8faf8] font-poppins">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link href="/recipes" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#126e3d] mb-6">
          <ArrowLeft size={14} /> Back to recipes
        </Link>

        {/* Hero */}
        <section className="mb-8 overflow-hidden rounded-[32px] bg-white shadow-xl border border-gray-100">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative h-64 lg:h-auto min-h-[400px] bg-gradient-to-br from-emerald-100 to-amber-100">
              {recipe.image_url ? (
                <img src={recipe.image_url} alt={recipe.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ChefHat size={96} className="text-emerald-600/30" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-6 sm:p-8 flex flex-col">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {recipe.cuisine && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                    <Globe size={10} /> {recipe.cuisine.replace(/_/g, ' ')}
                  </span>
                )}
                {recipe.category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black uppercase tracking-wider capitalize">
                    {recipe.category}
                  </span>
                )}
                {recipe.difficulty_level && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-[10px] font-black uppercase tracking-wider capitalize">
                    {recipe.difficulty_level}
                  </span>
                )}
                {recipe.is_premium && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">
                    Premium
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-3">
                {recipe.name}
              </h1>

              {recipe.description && (
                <p className="text-slate-600 leading-relaxed mb-6">{recipe.description}</p>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <Clock size={16} className="text-[#126e3d] mx-auto mb-1" />
                  <p className="text-xl font-black text-slate-900">{totalTime || '—'}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">min total</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <Flame size={16} className="text-orange-600 mx-auto mb-1" />
                  <p className="text-xl font-black text-slate-900">{recipe.calories_per_serving ?? '—'}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">kcal/serving</p>
                </div>
                <div className="bg-violet-50 rounded-xl p-3 text-center">
                  <Users size={16} className="text-violet-600 mx-auto mb-1" />
                  <p className="text-xl font-black text-slate-900">{adjustedServings}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">servings</p>
                </div>
              </div>

              {/* Servings adjuster */}
              <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Adjust servings
                </p>
                <div className="flex items-center gap-2">
                  {[0.5, 1, 1.5, 2, 3].map((mult) => (
                    <button
                      key={mult}
                      onClick={() => setServingsMultiplier(mult)}
                      className={`flex-1 py-2 rounded-lg text-xs font-black transition ${
                        servingsMultiplier === mult
                          ? 'bg-[#1A5C3A] text-white shadow-md'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black uppercase transition ${
                    recipe.is_saved
                      ? 'bg-red-50 text-red-700 border-2 border-red-200'
                      : 'bg-[#1A5C3A] text-white shadow-md hover:bg-[#0d3d26]'
                  }`}
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Heart size={14} className={recipe.is_saved ? 'fill-red-500 text-red-500' : ''} />
                  )}
                  {recipe.is_saved ? 'Saved' : 'Save Recipe'}
                </button>
                <Link
                  href="/shopping"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-50 text-orange-700 border-2 border-orange-200 px-4 py-3 text-sm font-black uppercase hover:bg-orange-100 transition"
                >
                  <ShoppingCart size={14} /> Shop
                </Link>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-700 border-2 border-slate-200 px-3 py-3 text-sm font-black hover:bg-slate-200 transition"
                  aria-label="Print"
                >
                  <Printer size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
          {/* Ingredients */}
          <aside className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm h-fit lg:sticky lg:top-24">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-4">
              <Package size={18} className="text-emerald-600" /> Ingredients
              <span className="ml-auto text-xs font-bold text-slate-500">
                KES ~{totalEstimatedCost.toFixed(0)}
              </span>
            </h2>

            <ul className="space-y-2">
              {(recipe.ingredients ?? []).map((ing) => {
                const isChecked = checkedIngredients.has(ing.id)
                const adjustedQty = ing.quantity
                  ? typeof Number(ing.quantity) === 'number' && !isNaN(Number(ing.quantity))
                    ? (Number(ing.quantity) * servingsMultiplier).toString()
                    : ing.quantity
                  : ''

                return (
                  <li key={ing.id}>
                    <button
                      onClick={() => toggleIngredient(ing.id)}
                      className={`w-full text-left flex items-start gap-3 rounded-xl border p-3 transition ${
                        isChecked
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 mt-0.5 transition ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-bold ${
                            isChecked ? 'text-emerald-700 line-through' : 'text-slate-900'
                          }`}
                        >
                          {adjustedQty && <span className="text-slate-600">{adjustedQty} {ing.unit ?? ''} </span>}
                          {ing.name}
                          {ing.is_optional && (
                            <span className="ml-1 text-[10px] font-bold text-slate-400">(optional)</span>
                          )}
                        </p>
                        {ing.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{ing.notes}</p>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{checkedIngredients.size} / {(recipe.ingredients ?? []).length} ready</span>
                <button
                  onClick={() => setCheckedIngredients(new Set())}
                  className="font-bold hover:text-slate-700"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Equipment */}
            {recipe.equipment_needed && recipe.equipment_needed.length > 0 && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Equipment needed
                </p>
                <ul className="space-y-1">
                  {recipe.equipment_needed.map((eq, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-center gap-2">
                      <CheckCircle2 size={11} className="text-emerald-600" />
                      {eq}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* Instructions */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-4">
                <BookOpen size={18} className="text-[#126e3d]" /> Instructions
                <span className="ml-auto text-xs font-bold text-slate-500">
                  {completedSteps.size} / {instructions.length} complete
                </span>
              </h2>

              <ol className="space-y-4">
                {instructions.map((step: any, idx: number) => {
                  const stepNum = step.step ?? idx + 1
                  const isCompleted = completedSteps.has(stepNum)

                  return (
                    <li
                      key={stepNum}
                      className={`relative rounded-2xl border p-4 transition ${
                        isCompleted
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStep(stepNum)}
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-black text-sm transition ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 size={16} /> : stepNum}
                        </button>
                        <div className="flex-1 min-w-0">
                          {step.title && (
                            <h3 className="font-black text-slate-900 mb-1">{step.title}</h3>
                          )}
                          <p
                            className={`text-sm leading-relaxed ${
                              isCompleted ? 'text-slate-500 line-through' : 'text-slate-700'
                            }`}
                          >
                            {step.description}
                          </p>

                          {step.duration_minutes && (
                            <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#126e3d]">
                              <Clock size={11} /> ~{step.duration_minutes} min
                            </p>
                          )}

                          {step.tip && (
                            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                              <Lightbulb size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-900 leading-relaxed">
                                <strong>Tip:</strong> {step.tip}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>

            {/* Pro tips */}
            {recipe.tips && recipe.tips.length > 0 && (
              <section className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-4">
                  <Sparkles size={18} className="text-amber-600" /> Pro Tips
                </h2>
                <ul className="space-y-2">
                  {recipe.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                      <Lightbulb size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Storage + notes */}
            {(recipe.storage_instructions || recipe.nutrition_notes || recipe.prep_notes) && (
              <section className="grid sm:grid-cols-2 gap-4">
                {recipe.storage_instructions && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
                      <Package size={12} /> Storage
                    </h3>
                    <p className="text-sm text-blue-900 leading-relaxed">{recipe.storage_instructions}</p>
                  </div>
                )}
                {recipe.nutrition_notes && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1.5">
                      <Sparkles size={12} /> Nutrition
                    </h3>
                    <p className="text-sm text-emerald-900 leading-relaxed">{recipe.nutrition_notes}</p>
                  </div>
                )}
                {recipe.prep_notes && (
                  <div className="rounded-2xl border border-violet-100 bg-violet-50/30 p-5 sm:col-span-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-violet-700 mb-2 flex items-center gap-1.5">
                      <Calendar size={12} /> Prep Notes
                    </h3>
                    <p className="text-sm text-violet-900 leading-relaxed">{recipe.prep_notes}</p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}