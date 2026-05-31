import { querySupabase } from "./supabase";

export type DataRow = Record<string, unknown>;

function asText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
}

function pickText(row: DataRow, keys: string[]): string {
  for (const key of keys) {
    const value = asText(row[key]);
    if (value) {
      return value;
    }
  }
  return "";
}

export function getMealId(row: DataRow): string {
  return pickText(row, ["id", "meal_id", "uuid"]);
}

export function getMealName(row: DataRow): string {
  return pickText(row, ["name", "title", "meal_name"]) || "Untitled meal";
}

export function getMealDescription(row: DataRow): string {
  return pickText(row, ["description", "summary", "notes"]);
}

export function getMealImage(row: DataRow): string {
  return pickText(row, ["image_url", "photo_url", "thumbnail_url"]);
}

export function getMealType(row: DataRow): string {
  return pickText(row, ["meal_type", "category", "type", "meal_category"]).toLowerCase();
}

export function getIngredientName(row: DataRow): string {
  return pickText(row, ["ingredient", "name", "item_name"]);
}

export function getIngredientAmount(row: DataRow): string {
  return pickText(row, ["amount", "quantity", "measurement", "unit"]);
}

export function getStepInstruction(row: DataRow): string {
  return pickText(row, ["instruction", "step", "description", "text"]);
}

export function getStepOrder(row: DataRow): number {
  const value = row.step_number ?? row.position ?? row.order_index ?? row.order;
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }
  return Number.MAX_SAFE_INTEGER;
}

function belongsToMeal(row: DataRow, mealId: string): boolean {
  const keys = ["meal_id", "recipe_id", "meal", "recipe"];
  return keys.some((key) => asText(row[key]) === mealId);
}

export async function loadMeals(limit = 100): Promise<DataRow[]> {
  try {
    return await querySupabase<DataRow>("meals", `select=*&limit=${limit}`);
  } catch {
    return [];
  }
}

export async function loadRecipeIngredients(mealId: string): Promise<DataRow[]> {
  try {
    const rows = await querySupabase<DataRow>("recipe_ingredients", "select=*&limit=500");
    return rows.filter((row) => belongsToMeal(row, mealId));
  } catch {
    return [];
  }
}

export async function loadRecipeSteps(mealId: string): Promise<DataRow[]> {
  try {
    const rows = await querySupabase<DataRow>("recipe_steps", "select=*&limit=500");
    return rows
      .filter((row) => belongsToMeal(row, mealId))
      .sort((a, b) => getStepOrder(a) - getStepOrder(b));
  } catch {
    return [];
  }
}

export function filterMealsByType(meals: DataRow[], type: "breakfast" | "dinner") {
  const match = meals.filter((meal) => getMealType(meal).includes(type));
  if (match.length > 0) {
    return match;
  }

  const byName = meals.filter((meal) => getMealName(meal).toLowerCase().includes(type));
  return byName;
}
