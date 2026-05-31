import { ChefHat, ChevronRight, Clock, Users, Flame } from "lucide-react";
import Link from "next/link";
import { getMealDescription, getMealId, getMealName, loadMeals } from "../_lib/meals";
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'

export default async function RecipesPage() {
  const meals = await loadMeals(120);

  return (
      <>
        <Navbar />
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <ChefHat size={16} className="text-[#32CD32]" />
            <span className="text-sm font-medium text-white/90">Recipe Collection</span>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">Recipes</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/80">
            Select a meal to open the full recipe with complete ingredients and step-by-step cooking procedure.
          </p>
        </div>
      </section>

      {/* Recipes List */}
      <section className="px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-6xl">
          {meals.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#f8faf8] flex items-center justify-center mx-auto mb-6">
                <ChefHat size={40} className="text-[#126e3d]" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No recipes yet</h3>
              <p className="text-slate-600">Add meals in Supabase to populate this page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meals.map((meal) => {
                const mealId = getMealId(meal);
                if (!mealId) return null;

                return (
                  <Link
                    key={mealId}
                    href={`/recipes/${mealId}`}
                    className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#32CD32]/30 hover:shadow-xl hover:shadow-[#32CD32]/10 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900 group-hover:text-[#126e3d] transition-colors">
                          {getMealName(meal)}
                        </h2>
                        <p className="mt-2 text-slate-600 line-clamp-2">
                          {getMealDescription(meal) || "Click to view full recipe with ingredients and procedure."}
                        </p>
                        
                        <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            Prep time
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            Servings
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame size={14} />
                            Calories
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-slate-400 group-hover:text-[#f97316] group-hover:translate-x-1 transition-all" />
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