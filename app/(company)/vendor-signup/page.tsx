'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Store, ArrowRight, ArrowLeft, TrendingUp, DollarSign, Target,
  BarChart3, Megaphone, Bell, ClipboardCheck, ShieldCheck,
  ChefHat, Clock, Star, CheckCircle2, Upload, X, FileText,
  Phone, Mail, MessageCircle, ChevronDown, ChevronUp,
  Building2, User, MapPin, UtensilsCrossed, Camera, Sparkles,
  Loader2, Truck, Cloud, CakeSlice, ConciergeBell,
  Salad, Leaf, Wheat, Egg, Ban, Citrus, Nut, Flame,
  type LucideIcon,
} from 'lucide-react';
import {
  type VendorApplication,
  type BusinessType,
  type KitchenType,
  type DeliveryOption,
  EMPTY_APPLICATION,
  KITCHEN_TYPES,
  DELIVERY_OPTIONS,
  CUISINE_OPTIONS,
  DIETARY_OPTIONS,
  NAIROBI_AREAS,
  submitVendorApplication,
  uploadVendorDocument,
} from '../_lib/vendors';
// Icon Maps 
const BUSINESS_TYPE_ICONS: { value: BusinessType; label: string; icon: LucideIcon }[] = [
  { value: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  { value: 'home-chef', label: 'Home Chef', icon: ChefHat },
  { value: 'catering', label: 'Catering', icon: ConciergeBell },
  { value: 'food-truck', label: 'Food Truck', icon: Truck },
  { value: 'bakery', label: 'Bakery', icon: CakeSlice },
  { value: 'cloud-kitchen', label: 'Cloud Kitchen', icon: Cloud },
];
const DIETARY_ICONS: Record<string, LucideIcon> = {
  Vegetarian: Salad,
  Vegan: Leaf,
  Halal: Star,
  Kosher: Star,
  'Gluten-Free': Wheat,
  'Dairy-Free': Ban,
  'Nut-Free': Nut,
  'Low-Carb': Flame,
  Keto: Flame,
  Organic: Citrus,
};
const CUISINE_ICONS: Record<string, LucideIcon> = {
  Kenyan: MapPin,
  'East African': MapPin,
  'West African': MapPin,
  Ethiopian: MapPin,
  Indian: UtensilsCrossed,
  Chinese: UtensilsCrossed,
  Italian: UtensilsCrossed,
  Mexican: UtensilsCrossed,
  Japanese: UtensilsCrossed,
  Thai: UtensilsCrossed,
  Mediterranean: Salad,
  American: UtensilsCrossed,
  'Middle Eastern': UtensilsCrossed,
  French: ChefHat,
  Fusion: Sparkles,
};
// Constants 
const STEPS = [
  { id: 1, title: 'Business Info', icon: Building2 },
  { id: 2, title: 'Contact Info', icon: User },
  { id: 3, title: 'Kitchen Details', icon: ChefHat },
  { id: 4, title: 'Cuisine', icon: UtensilsCrossed },
  { id: 5, title: 'Documents', icon: FileText },
];
const BENEFITS = [
  { icon: TrendingUp, title: 'Reach More Customers', description: 'Access thousands of active meal planners in Nairobi and beyond.', color: '#32CD32' },
  { icon: DollarSign, title: 'Earn Revenue', description: 'Get paid for every meal ordered through the Smart Meal platform.', color: '#F4A535' },
  { icon: Target, title: 'Targeted Audience', description: 'Users actively searching for meals \u2014 no wasted impressions.', color: '#32CD32' },
  { icon: BarChart3, title: 'Analytics Dashboard', description: 'Track sales, popularity trends, and customer insights in real-time.', color: '#F4A535' },
  { icon: Megaphone, title: 'Marketing Support', description: 'Get featured placements, seasonal promotions, and social media exposure.', color: '#32CD32' },
  { icon: Bell, title: 'Order Notifications', description: 'Real-time alerts for every order so you never miss a sale.', color: '#F4A535' },
];
const COMMISSION_PLANS = [
  { name: 'Basic', commission: '15%', price: 'Free', features: ['List up to 10 meals', 'Standard support', 'Basic analytics', 'Order notifications'] },
  { name: 'Pro', commission: '12%', price: '499 KES/mo', features: ['Unlimited meals', 'Priority support', 'Advanced analytics', 'Featured in search', 'Promotional tools'], popular: true },
  { name: 'Premium', commission: '10%', price: '999 KES/mo', features: ['Unlimited meals', 'Dedicated account manager', 'Full analytics suite', 'Homepage featured placement', 'Priority order queue', 'Custom branding'] },
];
const FAQS = [
  { q: "How long does approval take?", a: "Applications are typically reviewed within 1\u20133 business days. You\u2019ll receive an email notification as soon as a decision is made, along with next steps to set up your vendor dashboard." },
  { q: "When do I get paid?", a: "Payouts are processed weekly on Mondays via M-Pesa or bank transfer. You can view your earnings and pending payouts in the Vendor Dashboard at any time." },
  { q: "What if I can\u2019t fulfill an order?", a: "You can mark yourself unavailable temporarily from the dashboard. For individual orders, you can decline within 5 minutes of receiving the notification with no penalty." },
  { q: "Can I change my menu anytime?", a: "Absolutely. You have full control to add, edit, pause, or remove meals from your menu through the Vendor Dashboard at any time \u2014 no approval needed." },
  { q: "How do I handle allergies and special requests?", a: "You can tag every meal with allergen information and dietary labels. Customers with special requests can include notes in their order, and you can message them directly through the platform." },
];
const TESTIMONIALS = [
  { name: 'Chef Amina W.', role: 'Home Chef, Kilimani', quote: 'Smart Meal changed my business. I went from 5 orders a week to over 40 within two months.', earnings: '85,000 KES/month', rating: 4.9 },
  { name: 'Mama Fua Kitchen', role: 'Restaurant, Westlands', quote: 'The analytics dashboard alone is worth it. I can see exactly what my customers want and adjust my menu in real-time.', earnings: '220,000 KES/month', rating: 4.8 },
  { name: 'David K.', role: 'Cloud Kitchen, Kasarani', quote: 'Zero marketing costs. The platform brings the customers to me \u2014 all I have to do is cook great food.', earnings: '150,000 KES/month', rating: 4.7 },
];
const REQUIREMENTS: { text: string; icon: LucideIcon }[] = [
  { text: "Valid business license or food handler\u2019s permit", icon: ShieldCheck },
  { text: "Kitchen facility \u2014 home, commercial, or shared", icon: Building2 },
  { text: "Ability to fulfill orders within 2 hours of confirmation", icon: Clock },
  { text: "High-quality food photos for your menu listings", icon: Camera },
  { text: "Maintain a minimum 4.0-star customer rating after joining", icon: Star },
];
// Draft Auto-save 
const DRAFT_KEY = 'smartmeal_vendor_draft';
function saveDraft(data: VendorApplication) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}
function loadDraft(): VendorApplication | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw) as VendorApplication;
  } catch { /* ignore */ }
  return null;
}
function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch { /* ignore */ }
}
// File Upload Preview Component
function FileUploadField({
  label,
  accept,
  onUpload,
  currentUrl,
  onClear,
}: {
  label: string;
  accept: string;
  onUpload: (file: File) => void;
  currentUrl: string;
  onClear: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = (file: File) => {
    setIsUploading(true);
    onUpload(file);
    setTimeout(() => setIsUploading(false), 1200);
  };
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      {currentUrl ? (
        <div className="flex items-center gap-3 bg-[#f0fdf4] border-2 border-[#32CD32]/30 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-[#32CD32] flex-shrink-0" />
          <span className="flex-1 text-sm text-slate-700 truncate">File uploaded successfully</span>
          <button onClick={onClear} className="text-slate-400 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#32CD32] bg-[#f0fdf4]'
              : 'border-slate-300 hover:border-[#32CD32]/50 hover:bg-[#f8faf8]'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-[#32CD32] mx-auto animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          )}
          <p className="text-sm text-slate-600 mt-1">
            {isUploading ? 'Uploading...' : 'Click or drag file to upload'}
          </p>
          <p className="text-xs text-slate-400 mt-1">PDF, JPG or PNG up to 10MB</p>
        </div>
      )}
    </div>
  );
}
// Toggle Chips with Icons
function ToggleChipsWithIcons({
  options,
  selected,
  onChange,
  iconMap,
  fallbackIcon,
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  iconMap: Record<string, LucideIcon>;
  fallbackIcon: LucideIcon;
}) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        const IconComp = iconMap[option] || fallbackIcon;
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? 'bg-[#126e3d] text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <IconComp className="w-4 h-4" />
            {option}
          </button>
        );
      })}
    </div>
  );
}
// Plain Toggle Chips
function ToggleChips({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? 'bg-[#126e3d] text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {option}
          </button>
        );
      })}
    </div>
  );
}
// ─── Main Page ────────────────
export default function VendorSignupPage() {
  const [formData, setFormData] = useState<VendorApplication>(EMPTY_APPLICATION);
  const [currentStep, setCurrentStep] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) setFormData(draft);
  }, []);
  // Auto-save on change
  useEffect(() => {
    if (showForm && !submitted) saveDraft(formData);
  }, [formData, showForm, submitted]);
  const update = useCallback(
    <K extends keyof VendorApplication>(key: K, value: VendorApplication[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );
  const scrollToForm = () => {
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };
  // Step Validation
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(formData.business_name && formData.business_type && formData.registration_number);
      case 1:
        return !!(formData.owner_name && formData.email && formData.phone && formData.address && formData.city);
      case 2:
        return !!(formData.kitchen_type && formData.capacity_per_day > 0 && formData.delivery_option);
      case 3:
        return formData.cuisine_types.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };
  const handleNext = () => {
    if (isStepValid(currentStep) && currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    const result = await submitVendorApplication(formData);
    if (result.success) {
      clearDraft();
      setSubmitted(true);
    } else {
      setSubmitError(result.message);
    }
    setIsSubmitting(false);
  };
  const handleDocUpload = async (file: File, field: keyof VendorApplication) => {
    const result = await uploadVendorDocument(file, field);
    if ('url' in result) {
      update(field, result.url as never);
    }
  };
  // Render Step Content 
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Business Name *</label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => update('business_name', e.target.value)}
                placeholder="e.g. Mama Fua Kitchen"
                className="w-full border-2 border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Business Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BUSINESS_TYPE_ICONS.map((type) => {
                  const IconComp = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => update('business_type', type.value)}
                      className={`py-4 px-4 border-2 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-2.5 ${
                        formData.business_type === type.value
                          ? 'border-[#32CD32] bg-[#32CD32]/10 text-[#126e3d]'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <IconComp
                        className={`w-7 h-7 ${
                          formData.business_type === type.value ? 'text-[#32CD32]' : 'text-slate-400'
                        }`}
                      />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Registration / License Number *</label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => update('registration_number', e.target.value)}
                  placeholder="e.g. BN-2024-XXXX"
                  className="w-full border-2 border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] transition-all placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tax ID (KRA PIN)</label>
                <input
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => update('tax_id', e.target.value)}
                  placeholder="e.g. A012345678X"
                  className="w-full border-2 border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Owner / Manager Name *</label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => update('owner_name', e.target.value)}
                placeholder="Full name"
                className="w-full border-2 border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border-2 border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] transition-all placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full border-2 border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Physical Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Street address or building name"
                className="w-full border-2 border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] transition-all placeholder:text-slate-400"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="e.g. Nairobi"
                  className="w-full border-2 border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] transition-all placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">County</label>
                <input
                  type="text"
                  value={formData.county}
                  onChange={(e) => update('county', e.target.value)}
                  placeholder="e.g. Nairobi County"
                  className="w-full border-2 border-slate-200 rounded-xl px-5 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-[#32CD32] transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Kitchen Type *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {KITCHEN_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => update('kitchen_type', type.value)}
                    className={`py-3.5 px-4 border-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${
                      formData.kitchen_type === type.value
                        ? 'border-[#32CD32] bg-[#32CD32]/10 text-[#126e3d]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className={`w-4 h-4 ${formData.kitchen_type === type.value ? 'text-[#32CD32]' : 'text-slate-400'}`} />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Daily Meal Capacity *</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={formData.capacity_per_day}
                  onChange={(e) => update('capacity_per_day', Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#32CD32]"
                />
                <div className="w-20 h-12 bg-[#126e3d] text-white rounded-xl flex items-center justify-center font-bold text-lg min-w-[5rem]">
                  {formData.capacity_per_day}
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">Maximum meals you can prepare per day</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Delivery Option *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DELIVERY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('delivery_option', opt.value)}
                    className={`py-3.5 px-4 border-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${
                      formData.delivery_option === opt.value
                        ? 'border-[#32CD32] bg-[#32CD32]/10 text-[#126e3d]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Truck className={`w-4 h-4 ${formData.delivery_option === opt.value ? 'text-[#32CD32]' : 'text-slate-400'}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Service Areas <span className="text-slate-400 font-normal">(Select all that apply)</span>
              </label>
              <ToggleChips
                options={NAIROBI_AREAS}
                selected={formData.service_areas}
                onChange={(areas) => update('service_areas', areas)}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Cuisine Types * <span className="text-slate-400 font-normal">(Select at least 1)</span>
              </label>
              <ToggleChipsWithIcons
                options={CUISINE_OPTIONS}
                selected={formData.cuisine_types}
                onChange={(types) => update('cuisine_types', types)}
                iconMap={CUISINE_ICONS}
                fallbackIcon={UtensilsCrossed}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Dietary Options <span className="text-slate-400 font-normal">(What can you accommodate?)</span>
              </label>
              <ToggleChipsWithIcons
                options={DIETARY_OPTIONS}
                selected={formData.dietary_options}
                onChange={(opts) => update('dietary_options', opts)}
                iconMap={DIETARY_ICONS}
                fallbackIcon={Leaf}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-start gap-3 text-sm text-slate-600 bg-[#fff7ed] border border-[#F4A535]/20 rounded-xl p-4">
              <Sparkles className="w-5 h-5 text-[#F4A535] flex-shrink-0 mt-0.5" />
              <p>
                <strong className="text-[#ea580c]">Tip:</strong> Uploading documents now speeds up approval. You can also add them later from your Vendor Dashboard.
              </p>
            </div>
            <FileUploadField
              label="Business License / Permit"
              accept=".pdf,.jpg,.jpeg,.png"
              currentUrl={formData.business_license_url}
              onUpload={(file) => handleDocUpload(file, 'business_license_url')}
              onClear={() => update('business_license_url', '')}
            />
            <FileUploadField
              label="Food Safety Certificate"
              accept=".pdf,.jpg,.jpeg,.png"
              currentUrl={formData.food_safety_cert_url}
              onUpload={(file) => handleDocUpload(file, 'food_safety_cert_url')}
              onClear={() => update('food_safety_cert_url', '')}
            />
            <FileUploadField
              label="ID Verification (National ID or Passport)"
              accept=".pdf,.jpg,.jpeg,.png"
              currentUrl={formData.id_verification_url}
              onUpload={(file) => handleDocUpload(file, 'id_verification_url')}
              onClear={() => update('id_verification_url', '')}
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Kitchen Photos <span className="text-slate-400 font-normal">(Optional, up to 4)</span>
              </label>
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#32CD32]/50 hover:bg-[#f8faf8] transition-all"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.jpg,.jpeg,.png';
                  input.multiple = true;
                  input.onchange = async (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (!files) return;
                    const urls: string[] = [...formData.kitchen_photos_urls];
                    for (let i = 0; i < Math.min(files.length, 4 - urls.length); i++) {
                      const result = await uploadVendorDocument(files[i], 'kitchen_photos');
                      if ('url' in result) urls.push(result.url);
                    }
                    update('kitchen_photos_urls', urls);
                  };
                  input.click();
                }}
              >
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Click to upload kitchen photos</p>
                <p className="text-xs text-slate-400 mt-1">JPG or PNG, up to 5MB each</p>
              </div>
              {formData.kitchen_photos_urls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.kitchen_photos_urls.map((_, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-[#f0fdf4] border border-[#32CD32]/30 rounded-lg px-3 py-1.5 text-sm text-[#126e3d]">
                      <CheckCircle2 className="w-4 h-4" />
                      Photo {idx + 1}
                      <button
                        onClick={() => update('kitchen_photos_urls', formData.kitchen_photos_urls.filter((__, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500 ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  // SUCCESS STATE 
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#f8faf8] flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-10 lg:p-14 max-w-2xl w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#32CD32]/30">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Application Submitted!
          </h1>
          <p className="text-lg text-slate-600 mb-4 leading-relaxed">
            Thank you for applying to become a Smart Meal vendor. We&apos;ve received your application and our team will review it within <strong className="text-[#126e3d]">1&ndash;3 business days</strong>.
          </p>
          <div className="bg-[#f8faf8] rounded-2xl p-6 text-left space-y-4 mt-8 mb-8">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#32CD32]" />
              What happens next?
            </h3>
            {[
              { icon: Mail, text: "You\u2019ll receive a confirmation email shortly." },
              { icon: ClipboardCheck, text: "Our team reviews your application and documents." },
              { icon: ShieldCheck, text: "Once approved, you\u2019ll get access to the Vendor Dashboard." },
              { icon: DollarSign, text: "Add your meals, set prices, and start receiving orders!" },
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] text-white rounded-full flex items-center justify-center flex-shrink-0">
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-slate-700 pt-0.5">{item.text}</p>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold py-3.5 px-8 rounded-xl transition-colors text-center"
            >
              Back to Home
            </Link>
            <Link
              href="/meal-generator"
              className="bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              Explore Smart Meal
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }
  // ── MAIN PAGE ──────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] px-6 py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2332CD32' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#32CD32]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-[#F4A535]/10 rounded-full blur-3xl" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Store size={16} className="text-[#32CD32]" />
            <span className="text-sm font-medium text-white/90">Vendor Program</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl lg:text-7xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Grow Your Food Business with{' '}
            <span className="gradient-text">Pika Plan</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/80 mx-auto">
            Join Kenya&apos;s fastest-growing meal platform. List your meals, reach thousands of available customers, and get paid for every order &mdash; all from your own kitchen.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] px-8 py-4 text-base font-semibold text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <Store className="w-5 h-5" />
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 border border-white/30 backdrop-blur-sm px-8 py-4 text-base font-semibold text-white rounded-xl hover:bg-white/10 transition-all"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>
      {/* 2. BENEFITS SECTION */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 md:text-5xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Why Join Smart Meal?
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to sell more meals and grow your food business.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, idx) => {
              const IconComp = benefit.icon;
              return (
                <div key={idx} className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#32CD32]/30 hover:shadow-xl hover:shadow-[#32CD32]/10 transition-all duration-300">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ background: `${benefit.color}18` }}
                  >
                    <IconComp size={28} style={{ color: benefit.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="px-6 py-20 bg-[#f8faf8]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 md:text-5xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
              How It Works
            </h2>
            <p className="mt-4 text-lg text-slate-600">Four simple steps to start earning.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Apply', description: 'Fill out the vendor application with your business details.', icon: ClipboardCheck, color: '#32CD32' },
              { title: 'Get Approved', description: 'Our team reviews your application within 1\u20133 business days.', icon: ShieldCheck, color: '#F4A535' },
              { title: 'Add Meals', description: 'Upload your menu with photos, prices, and descriptions.', icon: ChefHat, color: '#32CD32' },
              { title: 'Start Earning', description: 'Receive orders, fulfill them, and get paid weekly.', icon: DollarSign, color: '#F4A535' },
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="relative bg-white border border-slate-200 rounded-2xl p-6 text-center">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full text-white font-bold text-sm flex items-center justify-center" style={{ background: item.color }}>
                    {idx + 1}
                  </div>
                  <div className="w-14 h-14 rounded-xl mx-auto mb-4 mt-2 flex items-center justify-center" style={{ background: `${item.color}18` }}>
                    <IconComp size={28} style={{ color: item.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* 4. REQUIREMENTS */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Requirements
            </h2>
            <p className="mt-4 text-lg text-slate-600">What you need to qualify as a vendor.</p>
          </div>
          <div className="space-y-4">
            {REQUIREMENTS.map((req, idx) => {
              const IconComp = req.icon;
              return (
                <div key={idx} className="flex items-start gap-4 bg-[#f8faf8] border border-slate-200 rounded-xl p-5">
                  <div className="w-10 h-10 rounded-lg bg-[#32CD32]/10 flex items-center justify-center flex-shrink-0">
                    <IconComp className="w-5 h-5 text-[#32CD32]" />
                  </div>
                  <p className="text-slate-700 font-medium pt-2">{req.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* 5. COMMISSION / PRICING */}
      <section className="px-6 py-20 bg-[#f8faf8]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 md:text-5xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Vendor Plans
            </h2>
            <p className="mt-4 text-lg text-slate-600">Choose the plan that fits your business.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COMMISSION_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl p-6 ${
                  plan.popular
                    ? 'border-2 border-[#32CD32] shadow-xl shadow-[#32CD32]/20'
                    : 'border border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                    <Sparkles size={12} /> Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mt-2">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-4xl font-black text-[#126e3d]">{plan.commission}</span>
                  <span className="text-slate-600 text-sm ml-1">commission</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{plan.price}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-[#32CD32] flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={scrollToForm}
                  className={`w-full mt-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white hover:shadow-lg hover:shadow-[#32CD32]/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* 8. TESTIMONIALS ─ */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 md:text-5xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Vendor Success Stories
            </h2>
            <p className="mt-4 text-lg text-slate-600">Hear from vendors already thriving on Smart Meal.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, idx) => (
              <div key={idx} className="bg-[#f8faf8] border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(testimonial.rating) ? 'text-[#F4A535] fill-[#F4A535]' : 'text-slate-300'}`} />
                  ))}
                  <span className="text-sm text-slate-500 ml-1">{testimonial.rating}</span>
                </div>
                <p className="text-slate-700 leading-relaxed mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                      <DollarSign className="w-3 h-3" />
                      Earning
                    </p>
                    <p className="font-bold text-[#126e3d]">{testimonial.earnings}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* 6. APPLICATION FORM  */}
      <section ref={formRef} className="px-6 py-20 bg-gradient-to-b from-[#f8faf8] to-white scroll-mt-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 md:text-5xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Apply Now
            </h2>
            <p className="mt-4 text-lg text-slate-600">Complete the form below to get started. It takes about 5 minutes.</p>
          </div>
          {!showForm ? (
            <div className="text-center">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] px-10 py-5 text-lg font-bold text-white rounded-xl shadow-lg hover:shadow-xl hover:shadow-[#32CD32]/30 transition-all hover:-translate-y-0.5"
              >
                <Store className="w-5 h-5" />
                Start Application
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              {/* Progress Bar */}
              <div className="bg-[#f8faf8] border-b border-slate-100 px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  {STEPS.map((step, idx) => {
                    const IconComp = step.icon;
                    const isActive = idx === currentStep;
                    const isCompleted = idx < currentStep;
                    return (
                      <React.Fragment key={step.id}>
                        <button
                          onClick={() => {
                            if (idx <= currentStep) setCurrentStep(idx);
                          }}
                          className={`flex flex-col items-center gap-1.5 transition-all ${
                            isActive ? 'scale-105' : ''
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-[#32CD32] text-white'
                                : isActive
                                ? 'bg-[#126e3d] text-white shadow-lg shadow-[#32CD32]/30'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <IconComp className="w-5 h-5" />}
                          </div>
                          <span className={`text-xs font-medium hidden sm:block ${
                            isActive ? 'text-[#126e3d]' : isCompleted ? 'text-[#32CD32]' : 'text-slate-400'
                          }`}>
                            {step.title}
                          </span>
                        </button>
                        {idx < STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-2 rounded ${
                            idx < currentStep ? 'bg-[#32CD32]' : 'bg-slate-200'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                <p className="text-sm text-slate-500 text-center">
                  Step {currentStep + 1} of {STEPS.length}: <span className="font-semibold text-slate-700">{STEPS[currentStep].title}</span>
                </p>
              </div>
              {/* Form Content */}
              <div className="p-6 lg:p-10">
                {renderStep()}
                {submitError && (
                  <div className="mt-6 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl p-4 text-sm font-medium">
                    {submitError}
                  </div>
                )}
                {/* Navigation */}
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2 text-slate-600 font-semibold py-3 px-6 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  {currentStep < STEPS.length - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={!isStepValid(currentStep)}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#32CD32] to-[#1A5C3A] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl hover:shadow-[#32CD32]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Submit Application
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* 7. FAQ SECTION  */}
      <section className="px-6 py-20 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-[#f8faf8] border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left gap-4"
                >
                  <span className="font-semibold text-slate-900">{faq.q}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-[#126e3d] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* 9. CONTACT SUPPORT  */}
      <section className="px-6 py-20 bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2332CD32' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-white md:text-5xl mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Have Questions?
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Our vendor support team is here to help you get started.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <a
              href="mailto:pikaplan.app@gmail.com"
              className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all group"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6 text-[#32CD32]" />
              </div>
              <span className="text-white font-semibold">Email Us</span>
              <span className="text-white/60 text-sm">pikaplan.app@gmail.com</span>
            </a>
            <a
              href="tel:+254797846624"
              className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all group"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6 text-[#F4A535]" />
              </div>
              <span className="text-white font-semibold">Call Us</span>
              <span className="text-white/60 text-sm">+254 797 846 624</span>
            </a>
            <a
              href="https://wa.me/254797846624"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all group"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-[#32CD32]" />
              </div>
              <span className="text-white font-semibold">WhatsApp</span>
              <span className="text-white/60 text-sm">Chat with us</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}