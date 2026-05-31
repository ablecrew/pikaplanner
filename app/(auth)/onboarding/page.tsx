'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowRight, ArrowLeft, CheckCircle2, User, MapPin,
  UtensilsCrossed, Leaf, ShieldAlert, Users, Wallet,
  Sparkles, ChefHat, Clock, Heart, ShoppingCart,
  Salad, Wheat, Flame, Ban, Nut, Star,
  Home, Loader2,
} from 'lucide-react';
// ─── Types ───────────────────────────────────────────────────────────────────
interface OnboardingData {
  full_name: string;
  phone: string;
  household_size: number;
  location: string;
  dietary_preferences: string[];
  allergies: string[];
  cuisine_preferences: string[];
  meal_types: string[];
  cooking_skill: string;
  budget_range: string;
  meal_plan_frequency: string;
  goals: string[];
}
const EMPTY_DATA: OnboardingData = {
  full_name: '',
  phone: '',
  household_size: 1,
  location: '',
  dietary_preferences: [],
  allergies: [],
  cuisine_preferences: [],
  meal_types: [],
  cooking_skill: 'intermediate',
  budget_range: '',
  meal_plan_frequency: 'weekly',
  goals: [],
};
// ─── Step Configuration ──────────────────────────────────────────────────────
const STEPS = [
  { id: 1, title: 'Welcome', icon: Sparkles },
  { id: 2, title: 'Profile', icon: User },
  { id: 3, title: 'Dietary', icon: Leaf },
  { id: 4, title: 'Preferences', icon: UtensilsCrossed },
  { id: 5, title: 'Lifestyle', icon: Heart },
  { id: 6, title: 'Ready', icon: CheckCircle2 },
];
// ─── Options ─────────────────────────────────────────────────────────────────
const LOCATIONS = [
  'Westlands', 'Kilimani', 'Lavington', 'Karen', 'Langata',
  'Kileleshwa', 'Parklands', 'CBD', 'Upperhill', 'South B',
  'South C', 'Eastleigh', 'Donholm', 'Buruburu', 'Kasarani',
  'Roysambu', 'Ruaka', 'Kahawa', 'Thika Road', 'Mombasa Road',
];
const DIETARY_OPTIONS: { label: string; icon: typeof Leaf }[] = [
  { label: 'No Restrictions', icon: CheckCircle2 },
  { label: 'Vegetarian', icon: Salad },
  { label: 'Vegan', icon: Leaf },
  { label: 'Halal', icon: Star },
  { label: 'Kosher', icon: Star },
  { label: 'Pescatarian', icon: UtensilsCrossed },
  { label: 'Low-Carb', icon: Flame },
  { label: 'Keto', icon: Flame },
  { label: 'Gluten-Free', icon: Wheat },
  { label: 'Dairy-Free', icon: Ban },
  { label: 'Organic', icon: Leaf },
  { label: 'High-Protein', icon: Flame },
];
const ALLERGY_OPTIONS: { label: string; icon: typeof ShieldAlert }[] = [
  { label: 'None', icon: CheckCircle2 },
  { label: 'Peanuts', icon: Nut },
  { label: 'Tree Nuts', icon: Nut },
  { label: 'Milk/Dairy', icon: Ban },
  { label: 'Eggs', icon: ShieldAlert },
  { label: 'Wheat/Gluten', icon: Wheat },
  { label: 'Soy', icon: Leaf },
  { label: 'Fish', icon: UtensilsCrossed },
  { label: 'Shellfish', icon: ShieldAlert },
  { label: 'Sesame', icon: ShieldAlert },
];
const CUISINE_OPTIONS: { label: string; icon: typeof ChefHat }[] = [
  { label: 'Kenyan', icon: Home },
  { label: 'East African', icon: MapPin },
  { label: 'West African', icon: MapPin },
  { label: 'Ethiopian', icon: UtensilsCrossed },
  { label: 'Indian', icon: Flame },
  { label: 'Chinese', icon: UtensilsCrossed },
  { label: 'Italian', icon: UtensilsCrossed },
  { label: 'Mexican', icon: Flame },
  { label: 'Japanese', icon: UtensilsCrossed },
  { label: 'Mediterranean', icon: Salad },
  { label: 'Middle Eastern', icon: UtensilsCrossed },
  { label: 'Fusion', icon: Sparkles },
];
const MEAL_TYPES = [
  { label: 'Breakfast', icon: Clock, description: 'Morning meals to start your day' },
  { label: 'Lunch', icon: UtensilsCrossed, description: 'Midday meals and snacks' },
  { label: 'Dinner', icon: ChefHat, description: 'Evening meals and suppers' },
  { label: 'Snacks', icon: Heart, description: 'Quick bites between meals' },
];
const COOKING_SKILLS = [
  { value: 'beginner', label: 'Beginner', description: 'I can make basic meals', icon: '1' },
  { value: 'intermediate', label: 'Intermediate', description: 'I cook regularly', icon: '2' },
  { value: 'advanced', label: 'Advanced', description: 'I love trying complex recipes', icon: '3' },
  { value: 'none', label: "I don\u2019t cook", description: 'I prefer ordering from vendors', icon: '0' },
];
const BUDGET_OPTIONS = [
  { value: 'under-500', label: 'Under 500 KES', description: 'Per day' },
  { value: '500-1000', label: '500 - 1,000 KES', description: 'Per day' },
  { value: '1000-2000', label: '1,000 - 2,000 KES', description: 'Per day' },
  { value: 'above-2000', label: 'Above 2,000 KES', description: 'Per day' },
];
const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', description: 'Plan one day at a time' },
  { value: 'weekly', label: 'Weekly', description: 'Plan a full week ahead' },
  { value: 'biweekly', label: 'Bi-weekly', description: 'Plan two weeks ahead' },
  { value: 'monthly', label: 'Monthly', description: 'Plan the whole month' },
];
const GOAL_OPTIONS = [
  { label: 'Eat healthier', icon: Salad },
  { label: 'Save money on food', icon: Wallet },
  { label: 'Save time cooking', icon: Clock },
  { label: 'Try new recipes', icon: Sparkles },
  { label: 'Support local vendors', icon: ShoppingCart },
  { label: 'Meal prep efficiently', icon: ChefHat },
  { label: 'Feed my family better', icon: Users },
  { label: 'Lose weight', icon: Flame },
];
// ─── Chip Component ──────────────────────────────────────────────────────────
function SelectChip({
  label,
  icon: Icon,
  selected,
  onClick,
}: {
  label: string;
  icon: typeof Leaf;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
        selected
          ? 'border-[#32CD32] bg-[#32CD32]/10 text-[#126e3d] shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <Icon className={`w-4 h-4 ${selected ? 'text-[#32CD32]' : 'text-slate-400'}`} />
      {label}
      {selected && <CheckCircle2 className="w-4 h-4 text-[#32CD32]" />}
    </button>
  );
}
// ─── Main Page ───────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<OnboardingData>(EMPTY_DATA);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      setUserId(session.user.id);
      // Pre-fill name from auth metadata
      const meta = session.user.user_metadata;
      if (meta?.full_name || meta?.name) {
        setData(prev => ({
          ...prev,
          full_name: meta.full_name || meta.name || '',
          phone: meta.phone || '',
        }));
      }
    };
    getUser();
  }, [supabase, router]);
  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };
  const toggleArray = (key: 'dietary_preferences' | 'allergies' | 'cuisine_preferences' | 'meal_types' | 'goals', value: string) => {
    setData(prev => {
      const arr = prev[key];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter(v => v !== value) };
      }
      return { ...prev, [key]: [...arr, value] };
    });
  };
  // ── Validation ─────────────────────────────────────────────────────────────
  const isStepValid = (s: number): boolean => {
    switch (s) {
      case 0: return true;
      case 1: return !!(data.full_name.trim() && data.location);
      case 2: return data.dietary_preferences.length > 0;
      case 3: return data.cuisine_preferences.length > 0 && data.meal_types.length > 0;
      case 4: return !!(data.cooking_skill && data.budget_range);
      case 5: return true;
      default: return false;
    }
  };
  const handleNext = () => {
    if (isStepValid(step) && step < STEPS.length - 1) {
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const handleBack = () => {
    if (step > 0) {
      setStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  // ── Handle Complete — with RPC fallback ────────────────────────────────────
  const handleComplete = async () => {
    if (!userId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const updatePayload = {
      full_name: data.full_name,
      phone: data.phone || null,
      household_size: data.household_size,
      location: data.location,
      dietary_preferences: data.dietary_preferences,
      allergies: data.allergies,
      cuisine_preferences: data.cuisine_preferences,
      meal_types: data.meal_types,
      cooking_skill: data.cooking_skill,
      budget_range: data.budget_range,
      meal_plan_frequency: data.meal_plan_frequency,
      goals: data.goals,
      onboarding_complete: true,
    };
    // Try 1: Direct update
    const { error: directError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);
    if (!directError) {
      setIsSubmitting(false);
      router.replace('/dashboard');
      return;
    }
    console.error('Direct update failed:', directError.message);
    // Try 2: RPC function (bypasses RLS)
    try {
      const { error: rpcError } = await supabase.rpc('update_my_onboarding', updatePayload);
      if (!rpcError) {
        setIsSubmitting(false);
        router.replace('/dashboard');
        return;
      }
      console.error('RPC update failed:', rpcError.message);
    } catch {
      // RPC function might not exist, continue to fallback
    }
    // Try 3: Minimal update — just mark onboarding complete
    const { error: minimalError } = await supabase
      .from('profiles')
      .update({ onboarding_complete: true })
      .eq('id', userId);
    if (minimalError) {
      console.error('Minimal update also failed:', minimalError.message);
      setSubmitError('Could not save preferences. Please try again or contact support.');
    }
    setIsSubmitting(false);
    // Always redirect — user should never be permanently stuck
    router.replace('/dashboard');
  };
  // ── Step Renders ───────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // STEP 0: Welcome
      case 0:
        return (
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#32CD32]/30">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Welcome to PIKA PLAN!
            </h1>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Let&apos;s set up your profile so we can personalize your meal plans,
              recommend recipes, and connect you with the best local vendors in Nairobi.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[
                { icon: ChefHat, title: 'AI Meal Plans', desc: 'Generated just for you' },
                { icon: ShoppingCart, title: 'Smart Shopping', desc: 'Auto-generated lists' },
                { icon: MapPin, title: 'Local Vendors', desc: 'Order fresh meals nearby' },
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[#32CD32]/10 flex items-center justify-center mx-auto mb-3">
                      <IconComp className="w-6 h-6 text-[#32CD32]" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-slate-500">This takes about 2 minutes</p>
          </div>
        );
      // STEP 1: Profile
      case 1:
        return (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-[#32CD32]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <User className="w-7 h-7 text-[#32CD32]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Tell us about yourself
              </h2>
              <p className="text-slate-600 mt-2">Basic details to personalize your experience</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={data.full_name}
                onChange={e => update('full_name', e.target.value)}
                placeholder="e.g. Jane Wanjiku"
                className="w-full border-2 border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={data.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="w-full border-2 border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#32CD32]" />
                  Household Size *
                </span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={data.household_size}
                  onChange={e => update('household_size', Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#32CD32]"
                />
                <div className="w-16 h-12 bg-[#126e3d] text-white rounded-xl flex items-center justify-center font-bold text-lg min-w-[4rem]">
                  {data.household_size}
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">How many people do you cook for?</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#32CD32]" />
                  Location in Nairobi *
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => update('location', loc)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all border-2 ${
                      data.location === loc
                        ? 'border-[#32CD32] bg-[#32CD32]/10 text-[#126e3d]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${data.location === loc ? 'text-[#32CD32]' : 'text-slate-400'}`} />
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      // STEP 2: Dietary
      case 2:
        return (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-[#32CD32]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-7 h-7 text-[#32CD32]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Dietary Preferences
              </h2>
              <p className="text-slate-600 mt-2">We&apos;ll filter meals and recipes to match your diet</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                What do you eat? * <span className="text-slate-400 font-normal">(Select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(opt => (
                  <SelectChip
                    key={opt.label}
                    label={opt.label}
                    icon={opt.icon}
                    selected={data.dietary_preferences.includes(opt.label)}
                    onClick={() => toggleArray('dietary_preferences', opt.label)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#F4A535]" />
                  Any food allergies?
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map(opt => (
                  <SelectChip
                    key={opt.label}
                    label={opt.label}
                    icon={opt.icon}
                    selected={data.allergies.includes(opt.label)}
                    onClick={() => toggleArray('allergies', opt.label)}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      // STEP 3: Food Preferences
      case 3:
        return (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-[#F4A535]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-7 h-7 text-[#F4A535]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Food Preferences
              </h2>
              <p className="text-slate-600 mt-2">Tell us what cuisines and meals you love</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Favourite Cuisines * <span className="text-slate-400 font-normal">(Select at least 1)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map(opt => (
                  <SelectChip
                    key={opt.label}
                    label={opt.label}
                    icon={opt.icon}
                    selected={data.cuisine_preferences.includes(opt.label)}
                    onClick={() => toggleArray('cuisine_preferences', opt.label)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Which meals do you plan for? * <span className="text-slate-400 font-normal">(Select at least 1)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {MEAL_TYPES.map(meal => {
                  const IconComp = meal.icon;
                  const selected = data.meal_types.includes(meal.label);
                  return (
                    <button
                      key={meal.label}
                      type="button"
                      onClick={() => toggleArray('meal_types', meal.label)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-[#32CD32] bg-[#32CD32]/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selected ? 'bg-[#32CD32]/20' : 'bg-slate-100'
                      }`}>
                        <IconComp className={`w-5 h-5 ${selected ? 'text-[#32CD32]' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${selected ? 'text-[#126e3d]' : 'text-slate-700'}`}>{meal.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{meal.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      // STEP 4: Lifestyle
      case 4:
        return (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-[#32CD32]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-[#32CD32]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Your Lifestyle
              </h2>
              <p className="text-slate-600 mt-2">Help us tailor meal plans to your routine</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Cooking Skill Level *</label>
              <div className="grid grid-cols-2 gap-3">
                {COOKING_SKILLS.map(skill => {
                  const selected = data.cooking_skill === skill.value;
                  return (
                    <button
                      key={skill.value}
                      type="button"
                      onClick={() => update('cooking_skill', skill.value)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-[#32CD32] bg-[#32CD32]/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        selected ? 'bg-[#32CD32] text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {skill.icon}
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${selected ? 'text-[#126e3d]' : 'text-slate-700'}`}>{skill.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{skill.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                <span className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#F4A535]" />
                  Daily Food Budget *
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {BUDGET_OPTIONS.map(budget => {
                  const selected = data.budget_range === budget.value;
                  return (
                    <button
                      key={budget.value}
                      type="button"
                      onClick={() => update('budget_range', budget.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        selected
                          ? 'border-[#F4A535] bg-[#F4A535]/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className={`font-bold text-sm ${selected ? 'text-[#ea580c]' : 'text-slate-700'}`}>{budget.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{budget.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">How often do you plan meals?</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FREQUENCY_OPTIONS.map(freq => {
                  const selected = data.meal_plan_frequency === freq.value;
                  return (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => update('meal_plan_frequency', freq.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        selected
                          ? 'border-[#32CD32] bg-[#32CD32]/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className={`font-semibold text-sm ${selected ? 'text-[#126e3d]' : 'text-slate-700'}`}>{freq.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{freq.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                What are your goals? <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map(goal => (
                  <SelectChip
                    key={goal.label}
                    label={goal.label}
                    icon={goal.icon}
                    selected={data.goals.includes(goal.label)}
                    onClick={() => toggleArray('goals', goal.label)}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      // STEP 5: Ready
      case 5:
        return (
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#32CD32]/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              You&apos;re All Set!
            </h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              We&apos;ve got everything we need to personalize your PIKA PLAN experience.
              Here&apos;s a summary of your preferences:
            </p>
            {/* Summary */}
            <div className="bg-[#f8faf8] border border-slate-200 rounded-2xl p-6 text-left space-y-4 mb-10">
              {[
                { label: 'Name', value: data.full_name, icon: User },
                { label: 'Location', value: data.location, icon: MapPin },
                { label: 'Household', value: `${data.household_size} ${data.household_size === 1 ? 'person' : 'people'}`, icon: Users },
                { label: 'Diet', value: data.dietary_preferences.join(', ') || 'Not set', icon: Leaf },
                { label: 'Cuisines', value: data.cuisine_preferences.join(', ') || 'Not set', icon: UtensilsCrossed },
                { label: 'Budget', value: BUDGET_OPTIONS.find(b => b.value === data.budget_range)?.label || 'Not set', icon: Wallet },
                { label: 'Cooking', value: COOKING_SKILLS.find(s => s.value === data.cooking_skill)?.label || 'Not set', icon: ChefHat },
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#32CD32]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <IconComp className="w-4 h-4 text-[#32CD32]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-slate-500 mb-6">
              You can change any of these later in your Settings.
            </p>
          </div>
        );
      default:
        return null;
    }
  };
  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8faf8]">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, idx) => {
              const IconComp = s.icon;
              const isActive = idx === step;
              const isCompleted = idx < step;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-[#32CD32] text-white'
                          : isActive
                          ? 'bg-[#126e3d] text-white shadow-lg shadow-[#32CD32]/30'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <IconComp className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] font-medium hidden sm:block ${
                      isActive ? 'text-[#126e3d]' : isCompleted ? 'text-[#32CD32]' : 'text-slate-400'
                    }`}>
                      {s.title}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1.5 rounded ${
                      idx < step ? 'bg-[#32CD32]' : 'bg-slate-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 text-center">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
      </div>
      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-32">
        {renderStep()}
      </div>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-100 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4">
          {/* Error message */}
          {submitError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
              {submitError}
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-2 text-slate-600 font-semibold py-3 px-6 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid(step)}
                className="flex items-center gap-2 bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl hover:shadow-[#32CD32]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {step === 0 ? "Let\u2019s Go" : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Start Using PIKA PLAN
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}