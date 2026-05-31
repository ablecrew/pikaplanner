import { Coffee, Sunrise, Clock, Flame } from "lucide-react";
import Link from "next/link";
import { filterMealsByType, getMealDescription, getMealId, getMealName, loadMeals } from "../_lib/meals";
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'

export default async function BreakfastPage() {
  const meals = await loadMeals(120);
  const breakfastMeals = filterMealsByType(meals, "breakfast").slice(0, 12);

  return (
      <>
         <Navbar />
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#fbbf24] via-[#F4A535] to-[#f97316] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Sunrise size={16} className="text-white" />
            <span className="text-sm font-medium text-white">Morning Meals</span>
          </div>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">
            High-energy breakfast suggestions personalized per user.
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-white/90">
            Blend user preferences, saved vendors, and quick-prep options for a reliable morning recommendation page.
          </p>
        </div>
      </section>

      {/* Breakfast Cards */}
      <section className="px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-6xl">
          {breakfastMeals.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#fff7ed] flex items-center justify-center mx-auto mb-6">
                <Coffee size={40} className="text-[#f97316]" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No breakfast meals yet</h3>
              <p className="text-slate-600">Add breakfast meals in Supabase to populate this page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {breakfastMeals.map((meal) => {
                const mealId = getMealId(meal);
                if (!mealId) return null;

                return (
                  <Link
                    key={mealId}
                    href={`/recipes/${mealId}`}
                    className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#F4A535]/30 hover:shadow-xl hover:shadow-[#F4A535]/10 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#F4A535] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Coffee size={24} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-[#126e3d] transition-colors">
                      {getMealName(meal)}
                    </h2>
                    <p className="mt-2 text-slate-600 line-clamp-2">
                      {getMealDescription(meal) || "Start your day with this delicious breakfast recipe."}
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Quick
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame size={14} />
                        Energizing
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
    </>
  );
}