'use client';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Leaf,
  ChevronRight,
  Smartphone,
  ShoppingCart,
  UtensilsCrossed,
  Apple,
  Sparkles,
  ChefHat,
  Sunrise,
  MoonStar,
} from 'lucide-react';
import { FaGooglePlay, FaFacebook, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import CookieSettingsButton from '@/components/cookie-consent/CookieSettingsButton'
// Placeholder for PikaLogo since it's an external component
const PikaLogo = ({ size = 32 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);
const PRODUCT_LINKS = [
  { href: '/meal-generator', label: 'Meal Generator', icon: Sparkles },
  { href: '/pricing', label: 'Pricing', icon: ShoppingCart },
  { href: '/recipes', label: 'Recipes', icon: ChefHat },
  { href: '/breakfast', label: 'Breakfast', icon: Sunrise },
  { href: '/dinner', label: 'Dinner', icon: MoonStar },
];
const COMPANY_LINKS = [
  { href: '/about', label: 'About Us' },
  { href: '/blog', label: 'Blog' },
  { href: '/careers', label: 'Careers' },
  { href: '/vendor-signup', label: 'Become a Vendor' },
  { href: '/press', label: 'Press Kit' },
];
const CONNECT_LINKS = [
  { href: '/contact', label: 'Contact Us' },
  { href: '/support', label: 'Help & Support' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cookies', label: 'Cookie Policy' },
];

<div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
  <Link href="/privacy" className="hover:text-[#1A5C3A]">Privacy Policy</Link>
  <Link href="/terms" className="hover:text-[#1A5C3A]">Terms of Service</Link>
  <Link href="/cookies" className="hover:text-[#1A5C3A]">Cookie Policy</Link>
  <CookieSettingsButton />
</div>
export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="relative mt-auto overflow-hidden bg-[#0a2d1d] font-['Poppins'] text-white">
      {/* Animated Background Mesh */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: 
            'radial-gradient(circle at 10% 20%, rgba(34,197,94,0.15) 0%, transparent 50%), ' +
            'radial-gradient(circle at 90% 80%, rgba(244,165,53,0.12) 0%, transparent 50%), ' +
            'radial-gradient(circle at 50% 50%, rgba(26,92,58,0.08) 0%, transparent 70%)',
        }}
      />
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#32CD32] via-[#1A5C3A] to-[#F4A535] shadow-[0_0_20px_rgba(50,205,50,0.4)]" />
      {/* Main footer content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:px-10">
        
        {/* Brand & CTA Section - Glass Card */}
        <div className="mb-12 grid grid-cols-1 gap-10 rounded-[24px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-xl md:grid-cols-2 lg:p-12">
          
          {/* Brand Section */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] shadow-lg shadow-green-500/20">
                <PikaLogo size={32} />
              </div>
              <div>
                <p className="bg-gradient-to-r from-[#32CD32] to-[#F4A535] bg-clip-text text-2xl font-extrabold leading-none text-transparent">
                  Pika<span className="text-[#F4A535]">Plan</span>
                </p>
                <p className="mt-1 text-[10px] font-semibold tracking-[2px] text-[#32CD32]">
                  NAIROBI, KENYA
                </p>
              </div>
            </div>
            <p className="mb-6 text-base font-medium leading-relaxed text-white/85">
              Smart Meals. Smart Living. Plan your meals, discover local vendors, and eat smarter every day.
            </p>
            {/* Contact info */}
            <div className="flex flex-col gap-4">
              {[
                { icon: Phone, text: '+254 797 846 624', href: 'tel:+254797846624', color: '#32CD32' },
                { icon: Mail, text: 'pikaplan.app@gmail.com', href: 'mailto:pikaplan.app@gmail.com', color: '#F4A535' },
                { icon: MapPin, text: 'Nairobi, Kenya', color: 'white/60' },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  className="group flex items-center gap-3 text-sm font-medium text-white/70 transition-all hover:translate-x-1"
                  style={{ color: 'var(--hover-color)' }}
                >
                  <div 
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors"
                    style={{ backgroundColor: `${item.color === 'white/60' ? '#ffffff' : item.color}20` }}
                  >
                    <item.icon size={16} style={{ color: item.color.startsWith('#') ? item.color : '#ffffff99' }} />
                  </div>
                  <span className="group-hover:text-white transition-colors">{item.text}</span>
                </a>
              ))}
            </div>
          </div>
          {/* App Download CTA */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] shadow-lg shadow-green-500/30">
              <Smartphone size={28} className="text-white" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">Get the App</h3>
            <p className="mb-6 text-xs leading-relaxed text-white/60">
              Download on App Store or Google Play
            </p>
            <div className="flex gap-3">
              {[
                { icon: Apple, label: 'App Store' },
                { icon: FaGooglePlay, label: 'Play Store' },
              ].map((store, idx) => (
                <div
                  key={idx}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 transition-all hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <store.icon size={18} className="text-white" />
                  <div className="text-left">
                    <p className="text-[9px] leading-none text-white/50">Get it on</p>
                    <p className="text-xs font-bold leading-none text-white">{store.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Links Grid */}
        <div className="mb-12 grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-4">
          {/* Product Links */}
          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-[#32CD32]">Product</h4>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link, idx) => {
                const Icon = link.icon;
                return (
                  <li key={idx}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-sm text-white/70 transition-all hover:translate-x-1 hover:text-white"
                    >
                      <Icon size={14} className="flex-shrink-0 text-[#32CD32]" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          {/* Company Links */}
          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-[#F4A535]">Company</h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-white/70 transition-all hover:translate-x-1 hover:text-white"
                  >
                    <ChevronRight size={14} className="flex-shrink-0 text-[#F4A535]" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Connect Links */}
          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-white/60">Connect</h4>
            <ul className="space-y-3">
              {CONNECT_LINKS.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-white/70 transition-all hover:translate-x-1 hover:text-white"
                  >
                    <ChevronRight size={14} className="flex-shrink-0 text-white/40" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Social Icons (Desktop) */}
          <div className="col-span-2 md:col-span-1">
             <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-white/60">Follow Us</h4>
             <div className="flex gap-3">
              {[
                { icon: FaInstagram, label: 'Instagram' },
                { icon: FaTwitter, label: 'Twitter' },
                { icon: FaFacebook, label: 'Facebook' },
                { icon: FaYoutube, label: 'YouTube' },
              ].map((social, idx) => {
                const Icon = social.icon;
                return (
                  <a
                    key={idx}
                    href={`https://${social.label.toLowerCase()}.com/pikaplan`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all hover:-translate-y-1 hover:border-green-500/50 hover:bg-green-500/20"
                    aria-label={social.label}
                  >
                    <Icon size={18} className="text-white/80" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
          <div className="flex items-center gap-2">
            <Leaf size={14} className="text-[#32CD32]" />
            <p className="text-xs font-medium text-white/50">
              Made with ♥ in Nairobi for Africa
            </p>
          </div>
          <p className="text-xs font-medium text-white/50">
            © {currentYear} Pika Plan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}