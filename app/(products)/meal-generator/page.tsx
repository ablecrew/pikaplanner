'use client';

import React, { useState } from 'react';
import { 
  Sparkles, Calendar, Utensils, Zap, Edit3, ArrowRight, 
  Clock, Users, Flame, ChefHat, ListChecks, CookingPot,
  ChevronDown, ChevronUp, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'

type DietaryPreference = 'balanced' | 'low-carb' | 'vegetarian' | 'keto' | 'vegan' | 'high-protein';

interface Meal {
  id: string;
  name: string;
  description: string;
  servings: number;
  calories: number;
  prepTime: number;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  image?: string;
}

interface GeneratedPlan {
  days: number;
  diet: DietaryPreference;
  meals: Meal[];
}

const DIETARY_OPTIONS: { value: DietaryPreference; label: string; icon: string }[] = [
  { value: 'balanced', label: 'Balanced', icon: '🥗' },
  { value: 'low-carb', label: 'Low Carb', icon: '🥑' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { value: 'keto', label: 'Keto', icon: '🥓' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'high-protein', label: 'High Protein', icon: '🍗' },
];

const SAMPLE_MEALS: Meal[] = [
  {
    id: '1',
    name: 'Grilled Chicken with Quinoa',
    description: 'Tender grilled chicken breast served with fluffy quinoa and roasted vegetables',
    servings: 4,
    calories: 450,
    prepTime: 35,
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Chicken breast', amount: '500g' },
      { name: 'Quinoa', amount: '1 cup' },
      { name: 'Bell peppers', amount: '2 medium' },
      { name: 'Olive oil', amount: '2 tbsp' },
      { name: 'Garlic', amount: '3 cloves' },
      { name: 'Lemon', amount: '1 whole' },
      { name: 'Salt & pepper', amount: 'to taste' },
    ],
    steps: [
      'Rinse quinoa under cold water and cook according to package instructions.',
      'Season chicken breasts with salt, pepper, and minced garlic.',
      'Heat olive oil in a grill pan over medium-high heat.',
      'Grill chicken for 6-7 minutes per side until cooked through.',
      'Roast bell peppers in the oven at 200°C for 15 minutes.',
      'Let chicken rest for 5 minutes, then slice.',
      'Serve chicken over quinoa with roasted peppers and lemon wedges.',
    ],
  },
  {
    id: '2',
    name: 'Vegetable Stir-Fry with Tofu',
    description: 'Crispy tofu tossed with fresh vegetables in a savory ginger-soy sauce',
    servings: 3,
    calories: 380,
    prepTime: 25,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Firm tofu', amount: '400g' },
      { name: 'Broccoli florets', amount: '2 cups' },
      { name: 'Carrots', amount: '2 medium' },
      { name: 'Snow peas', amount: '1 cup' },
      { name: 'Soy sauce', amount: '3 tbsp' },
      { name: 'Ginger', amount: '1 inch piece' },
      { name: 'Sesame oil', amount: '1 tbsp' },
      { name: 'Cornstarch', amount: '1 tbsp' },
    ],
    steps: [
      'Press tofu to remove excess water, then cut into cubes.',
      'Toss tofu with cornstarch and pan-fry until golden and crispy.',
      'Remove tofu and set aside.',
      'Stir-fry vegetables in sesame oil for 3-4 minutes.',
      'Add minced ginger and soy sauce, toss to combine.',
      'Return tofu to the pan and mix well.',
      'Serve hot over steamed rice or noodles.',
    ],
  },
  {
    id: '3',
    name: 'Salmon with Roasted Sweet Potato',
    description: 'Omega-rich salmon fillet with caramelized sweet potato wedges',
    servings: 2,
    calories: 520,
    prepTime: 30,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Salmon fillets', amount: '2 pieces (150g each)' },
      { name: 'Sweet potato', amount: '2 large' },
      { name: 'Olive oil', amount: '2 tbsp' },
      { name: 'Paprika', amount: '1 tsp' },
      { name: 'Dill', amount: '1 tbsp fresh' },
      { name: 'Lemon', amount: '1 whole' },
      { name: 'Salt & pepper', amount: 'to taste' },
    ],
    steps: [
      'Preheat oven to 200°C (400°F).',
      'Cut sweet potatoes into wedges and toss with olive oil, salt, and paprika.',
      'Arrange on a baking sheet and roast for 20 minutes.',
      'Season salmon with salt, pepper, and dill.',
      'Add salmon to the baking sheet and cook for another 12-15 minutes.',
      'Serve with lemon wedges and fresh dill garnish.',
    ],
  },
];

export default function MealGeneratorPage() {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [days, setDays] = useState(7);
  const [diet, setDiet] = useState<DietaryPreference>('balanced');
  const [servings, setServings] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Simulate AI generation with sample data
    setTimeout(() => {
      const plan: GeneratedPlan = {
        days,
        diet,
        meals: SAMPLE_MEALS.map(meal => ({
          ...meal,
          servings,
          calories: Math.round(meal.calories * (servings / meal.servings)),
        })),
      };
      setGeneratedPlan(plan);
      setIsGenerating(false);
      setShowResult(true);
    }, 2500);
  };

  const toggleMealExpand = (mealId: string) => {
    setExpandedMeal(expandedMeal === mealId ? null : mealId);
  };

  return (
    <>
       <Navbar />
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8faf8]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] px-6 py-16 lg:py-24">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2332CD32' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Sparkles size={16} className="text-[#32CD32]" />
            <span className="text-sm font-medium text-white/90">AI-Powered Meal Planning</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Generate Your Desired Meal
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/80 mx-auto">
            Create your perfect meal plan in seconds. Use our AI assistant or select your meals manually based on your preferences.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-6 py-12 lg:py-16 -mt-8">
        <div className="mx-auto max-w-5xl">
          {!showResult ? (
            /* Generation Form */
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 lg:p-10 overflow-hidden relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#f97316]/10 to-transparent rounded-bl-full -z-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#32CD32]/10 to-transparent rounded-tr-full -z-10"></div>

              <form onSubmit={handleGenerate}>
                {/* Mode Toggle */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                  <button
                    type="button"
                    onClick={() => setMode('ai')}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                      mode === 'ai' 
                        ? 'bg-white text-[#126e3d] shadow-md' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    AI Auto-Generate
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                      mode === 'manual' 
                        ? 'bg-white text-[#126e3d] shadow-md' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    Manual Selection
                  </button>
                </div>

                <div className="space-y-7">
                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#126e3d]" />
                      Plan Duration
                    </label>
                    <select
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      className="w-full bg-white border-2 border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] transition-all cursor-pointer"
                    >
                      <option value={3}>3 Days (Weekend Prep)</option>
                      <option value={5}>5 Days (Work Week)</option>
                      <option value={7}>7 Days (Full Week)</option>
                      <option value={14}>14 Days (Bi-weekly)</option>
                    </select>
                  </div>

                  {/* Servings */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#126e3d]" />
                      Number of Servings
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={servings}
                        onChange={(e) => setServings(Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#32CD32]"
                      />
                      <div className="w-16 h-12 bg-[#126e3d] text-white rounded-xl flex items-center justify-center font-bold text-lg min-w-[4rem]">
                        {servings}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Adjust for individuals or families</p>
                  </div>

                  {/* Dietary Preference */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-[#126e3d]" />
                      Dietary Preference
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {DIETARY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDiet(option.value)}
                          className={`py-3.5 px-4 border-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            diet === option.value
                              ? 'border-[#32CD32] bg-[#32CD32]/10 text-[#126e3d]'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span>{option.icon}</span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Mode Info */}
                  {mode === 'manual' && (
                    <div className="bg-[#fff7ed] border-2 border-[#f97316]/20 p-5 rounded-2xl text-[#92400e] text-sm flex gap-3 items-start">
                      <div className="mt-0.5"><Edit3 className="w-5 h-5 text-[#f97316]" /></div>
                      <div>
                        <strong className="block font-semibold mb-1 text-[#ea580c]">Manual Mode Active</strong>
                        You will be taken to a selection screen to pick exactly which meals you want for each day of your plan.
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] hover:from-[#22c55e] hover:to-[#16a34a] text-white font-bold py-4.5 rounded-xl shadow-lg hover:shadow-xl hover:shadow-[#32CD32]/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Generating Your Plan...
                      </>
                    ) : (
                      <>
                        {mode === 'ai' ? (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Generate My Plan
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-5 h-5" />
                            Start Selecting Meals
                          </>
                        )}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : generatedPlan ? (
            /* Generated Results */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Success Header */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Your Plan is Ready!
                </h2>
                <p className="text-slate-600 text-lg">
                  We've created a personalized <span className="font-bold text-[#126e3d]">{generatedPlan.days}-day</span> {' '}
                  <span className="font-bold text-[#126e3d] capitalize">{generatedPlan.diet}</span> meal plan for {' '}
                  <span className="font-bold text-[#126e3d]">{generatedPlan.meals[0]?.servings || servings} servings</span>.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                  <button 
                    onClick={() => setShowResult(false)}
                    className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold py-3.5 px-8 rounded-xl transition-colors"
                  >
                    Start Over
                  </button>
                  <Link
                    href="/pricing"
                    className="bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] hover:from-[#22c55e] hover:to-[#16a34a] text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    Save & Continue
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Meal Cards */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <ChefHat className="w-6 h-6 text-[#126e3d]" />
                  Generated Meals
                </h3>

                {generatedPlan.meals.map((meal, index) => {
                  const isExpanded = expandedMeal === meal.id;
                  
                  return (
                    <div 
                      key={meal.id} 
                      className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden transition-all hover:shadow-xl"
                    >
                      {/* Meal Header */}
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Meal Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="w-8 h-8 bg-[#126e3d] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </span>
                              <h4 className="text-xl font-bold text-slate-900">{meal.name}</h4>
                            </div>
                            <p className="text-slate-600 ml-11">{meal.description}</p>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 ml-11 lg:ml-0">
                            <div className="flex items-center gap-2 bg-[#fff7ed] px-4 py-2.5 rounded-xl">
                              <Users className="w-4 h-4 text-[#f97316]" />
                              <div>
                                <p className="text-xs text-slate-500 font-medium">Servings</p>
                                <p className="text-sm font-bold text-slate-900">{meal.servings} ppl</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 bg-[#f0fdf4] px-4 py-2.5 rounded-xl">
                              <Flame className="w-4 h-4 text-[#32CD32]" />
                              <div>
                                <p className="text-xs text-slate-500 font-medium">Calories</p>
                                <p className="text-sm font-bold text-slate-900">{meal.calories}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 bg-[#f0f9ff] px-4 py-2.5 rounded-xl">
                              <Clock className="w-4 h-4 text-[#0284c7]" />
                              <div>
                                <p className="text-xs text-slate-500 font-medium">Prep Time</p>
                                <p className="text-sm font-bold text-slate-900">{meal.prepTime} min</p>
                              </div>
                            </div>
                          </div>

                          {/* Expand Button */}
                          <button
                            onClick={() => toggleMealExpand(meal.id)}
                            className="flex items-center gap-2 text-[#126e3d] font-semibold hover:text-[#0f5c33] transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <span>Hide Details</span>
                                <ChevronUp className="w-5 h-5" />
                              </>
                            ) : (
                              <>
                                <span>View Recipe</span>
                                <ChevronDown className="w-5 h-5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-[#f8faf8] p-6 lg:p-8">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Ingredients */}
                            <div>
                              <h5 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <ListChecks className="w-5 h-5 text-[#32CD32]" />
                                Ingredients
                              </h5>
                              <ul className="space-y-3">
                                {meal.ingredients.map((ingredient, idx) => (
                                  <li key={idx} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-[#32CD32] mt-0.5 flex-shrink-0" />
                                    <span className="text-slate-700">
                                      <span className="font-semibold text-slate-900">{ingredient.name}</span>
                                      <span className="text-slate-500"> — {ingredient.amount}</span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Procedure */}
                            <div>
                              <h5 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <CookingPot className="w-5 h-5 text-[#f97316]" />
                                Procedure
                              </h5>
                              <ol className="space-y-4">
                                {meal.steps.map((step, idx) => (
                                  <li key={idx} className="flex gap-3">
                                    <div className="w-7 h-7 bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                                      {idx + 1}
                                    </div>
                                    <p className="text-slate-700 leading-relaxed pt-0.5">{step}</p>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <Footer />
    </div>
    </>
  );
}