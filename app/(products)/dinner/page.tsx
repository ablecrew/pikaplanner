import { MoonStar, ShoppingCart, Clock, Users } from "lucide-react";
import Link from "next/link";
import { filterMealsByType, getMealDescription, getMealId, getMealName, loadMeals } from "../_lib/meals";
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'

export default async function DinnerPage() {
  const meals = await loadMeals(120);
  const dinnerMeals = filterMealsByType(meals, "dinner").slice(0, 12);

  return (
     <>
       <Navbar />
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A5C3A] via-[#0a2d1d] to-[#0f172a] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <MoonStar size={16} className="text-[#32CD32]" />
            <span className="text-sm font-medium text-white/90">Evening Meals</span>
          </div>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">
            Balanced dinner planning with shopping list automation.
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-white/80">
            Turn selected dinner recipes into editable shopping lists and track completion across all user devices.
          </p>
        </div>
      </section>

      {/* Dinner Cards */}
      <section className="px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-6xl">
          {dinnerMeals.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#f0fdf4] flex items-center justify-center mx-auto mb-6">
                <MoonStar size={40} className="text-[#126e3d]" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No dinner meals yet</h3>
              <p className="text-slate-600">Add dinner meals in Supabase to populate this page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dinnerMeals.map((meal) => {
                const mealId = getMealId(meal);
                if (!mealId) return null;

                return (
                  <Link
                    key={mealId}
                    href={`/recipes/${mealId}`}
                    className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#126e3d]/30 hover:shadow-xl hover:shadow-[#126e3d]/10 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A5C3A] to-[#0a2d1d] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <MoonStar size={24} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-[#126e3d] transition-colors">
                      {getMealName(meal)}
                    </h2>
                    <p className="mt-2 text-slate-600 line-clamp-2">
                      {getMealDescription(meal) || "End your day with this satisfying dinner recipe."}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-[#126e3d] font-medium">
                      <ShoppingCart size={14} />
                      Add to shopping list
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        45 mins
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        4 servings
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