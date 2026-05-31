import { z } from 'zod'

export const MealDaySchema = z.object({
  day: z.string(),
  breakfast: z.string(),
  lunch: z.string(),
  dinner: z.string(),
  snacks: z.array(z.string()).min(0),
  notes: z.string(),
})

export const MealPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  days: z.array(MealDaySchema).length(7),
})

export type MealPlan = z.infer<typeof MealPlanSchema>