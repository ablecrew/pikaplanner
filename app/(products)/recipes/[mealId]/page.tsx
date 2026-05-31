import { ArrowLeft, CookingPot, ListChecks, Clock, Users, Flame } from "lucide-react";
import Link from "next/link";
import {
  getIngredientAmount,
  getIngredientName,
  getMealDescription,
  getMealId,
  getMealImage,
  getMealName,
  getStepInstruction,
  loadMeals,
  loadRecipeIngredients,
  loadRecipeSteps,
} from "../../_lib/meals";

type RecipeDetailPageProps = {
  params: { mealId: string };
};

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { mealId } = params;
  const meals = await loadMeals(200);
  const meal = meals.find((item) => getMealId(item) === mealId);
  const ingredients = await loadRecipeIngredients(mealId);
  const steps = await loadRecipeSteps(mealId);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <Link 
            href="/recipes" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to recipes
          </Link>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
            {meal ? getMealName(meal) : "Recipe"}
          </h1>

          <p className="mt-3 max-w-3xl text-white/80">
            {meal ? getMealDescription(meal) || "Complete recipe details and preparation steps." : "Recipe details"}
          </p>

          {/* Meta info */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Clock size={16} className="text-[#32CD32]" />
              <span className="text-sm text-white">30 mins</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Users size={16} className="text-[#32CD32]" />
              <span className="text-sm text-white">4 servings</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Flame size={16} className="text-[#F4A535]" />
              <span className="text-sm text-white">450 kcal</span>
            </div>
          </div>
        </div>
      </section>

      {/* Image */}
      {meal && getMealImage(meal) ? (
        <div className="mx-auto max-w-5xl px-6 -mt-8">
          <img
            src={getMealImage(meal)}
            alt={getMealName(meal)}
            className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-2xl"
          />
        </div>
      ) : (
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="w-full h-48 md:h-64 bg-gradient-to-br from-[#f8faf8] to-slate-100 rounded-2xl flex items-center justify-center">
            <CookingPot size={64} className="text-[#126e3d]/30" />
          </div>
        </div>
      )}

      {/* Content */}
      <section className="px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Ingredients */}
            <div className="lg:col-span-1">
              <h2 className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
                <ListChecks className="h-6 w-6 text-[#126e3d]" />
                Ingredients
              </h2>

              <ul className="mt-6 space-y-3 bg-[#f8faf8] rounded-xl p-6">
                {ingredients.length === 0 ? (
                  <li className="text-slate-600">No ingredients found for this meal yet.</li>
                ) : (
                  ingredients.map((ingredient, index) => {
                    const name = getIngredientName(ingredient) || `Ingredient ${index + 1}`;
                    const amount = getIngredientAmount(ingredient);
                    return (
                      <li key={`${name}-${index}`} className="flex items-start gap-3 text-slate-700">
                        <div className="w-2 h-2 rounded-full bg-[#32CD32] mt-2 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-slate-900">{name}</span>
                          {amount && <span className="text-slate-500"> — {amount}</span>}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {/* Procedure */}
            <div className="lg:col-span-2">
              <h2 className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
                <CookingPot className="h-6 w-6 text-[#f97316]" />
                Procedure
              </h2>

              <ol className="mt-6 space-y-6">
                {steps.length === 0 ? (
                  <li className="text-slate-600">No procedure steps found for this meal yet.</li>
                ) : (
                  steps.map((step, index) => (
                    <li key={`step-${index}`} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-slate-700 leading-relaxed pt-1">
                        {getStepInstruction(step) || `Step ${index + 1}`}
                      </p>
                    </li>
                  ))
                )}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}