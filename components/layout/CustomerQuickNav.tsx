'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, Compass, Sparkles, ShoppingCart, Menu, X, LayoutDashboard 
} from 'lucide-react'

// Define your routes here. Adjust the hrefs if your folder structure is different.
const quickLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/discovery', label: 'Discovery', icon: Compass },
  { href: '/meal-generator', label: 'Meal Generator', icon: Sparkles },
  { href: '/shopping', label: 'Shopping', icon: ShoppingCart },
  { href: '/dashboard/user', label: 'Dashboard', icon: LayoutDashboard },
]

export default function CustomerQuickNav() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* ── Desktop Top Navigation ─────────────────────────────── */}
      <div className="hidden lg:flex items-center gap-2 mb-6 p-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3">Quick Access:</span>
        <div className="flex items-center gap-1 flex-1">
          {quickLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
                }`}
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Mobile Floating Action Button ──────────────────────── */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-300 flex items-center justify-center hover:bg-emerald-600 transition-all active:scale-95"
      >
        <Menu size={24} />
      </button>

      {/* ── Mobile Slide-Out Menu ──────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-gray-900">Navigate</h3>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-2 flex-1">
                {quickLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <link.icon size={18} className={isActive ? 'text-emerald-600' : 'text-gray-400'} />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-auto pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">PikaPlan Customer Portal</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}