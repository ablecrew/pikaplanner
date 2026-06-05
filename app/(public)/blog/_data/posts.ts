export type BlogCategory =
  | 'recipes' | 'nutrition' | 'vendor-stories'
  | 'cooking-tips' | 'ai-tech' | 'sustainability'
  | 'kenyan-cuisine' | 'budget'

export type BlogTag = string

export type BlogAuthor = {
  id: string
  name: string
  role: string
  avatar?: string
  bio?: string
}

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  coverImage?: string
  category: BlogCategory
  tags: BlogTag[]
  author: BlogAuthor
  publishedAt: string  // ISO date
  readTime: number     // minutes
  featured?: boolean
  content: BlogContent[]
}

export type BlogContent =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'quote'; text: string; author?: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'callout'; variant: 'tip' | 'info' | 'warning'; text: string }
  | { type: 'cta'; title: string; description: string; href: string; label: string }

// ── Authors ────────────────────────────────────────────────
export const AUTHORS: Record<string, BlogAuthor> = {
  amina: {
    id: 'amina',
    name: 'Amina Wanjiru',
    role: 'Head of Nutrition',
    bio: 'Registered nutritionist with 8+ years helping Kenyan families eat better on a budget.',
  },
  david: {
    id: 'david',
    name: 'David Kimani',
    role: 'Founder & CEO',
    bio: 'Building Pika Plan to make meal planning effortless for every Kenyan household.',
  },
  grace: {
    id: 'grace',
    name: 'Grace Mwende',
    role: 'Vendor Success Manager',
    bio: 'Helping home chefs and small restaurants thrive on the Pika Plan platform.',
  },
  brian: {
    id: 'brian',
    name: 'Brian Otieno',
    role: 'AI Engineer',
    bio: 'Building the machine learning models that power Pika Plan\'s smart meal recommendations.',
  },
}

// ── Category Metadata ──────────────────────────────────────
export const CATEGORIES: { value: BlogCategory; label: string; description: string; color: string; bg: string }[] = [
  { value: 'recipes',        label: 'Recipes & Meal Ideas', description: 'Tried-and-tested recipes for every occasion', color: '#f97316', bg: '#fff7ed' },
  { value: 'nutrition',      label: 'Nutrition & Wellness', description: 'Eat smarter, live healthier',                color: '#16a34a', bg: '#f0fdf4' },
  { value: 'vendor-stories', label: 'Vendor Stories',       description: 'Meet the chefs behind your favourite meals',  color: '#0891b2', bg: '#ecfeff' },
  { value: 'cooking-tips',   label: 'Cooking Tips & Hacks', description: 'Skills, shortcuts and pro techniques',        color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'ai-tech',        label: 'AI & Technology',      description: 'Behind the tech powering smart meal planning', color: '#2563eb', bg: '#eff6ff' },
  { value: 'sustainability', label: 'Sustainable Eating',   description: 'Lower food waste, smarter sourcing',          color: '#059669', bg: '#ecfdf5' },
  { value: 'kenyan-cuisine', label: 'Kenyan Cuisine',       description: 'Celebrating local food culture',             color: '#dc2626', bg: '#fef2f2' },
  { value: 'budget',         label: 'Budget Cooking',       description: 'Big flavour, small spend',                    color: '#F4A535', bg: '#fff7ed' },
]

export function getCategoryMeta(category: BlogCategory) {
  return CATEGORIES.find((c) => c.value === category)!
}

// ── Sample Posts ───────────────────────────────────────────
export const POSTS: BlogPost[] = [
  {
    slug: 'meal-prep-for-busy-nairobi-families',
    title: '7-Day Meal Prep for Busy Nairobi Families: Save Time, Money & Sanity',
    excerpt:
      'Stop scrambling at 7 PM trying to figure out dinner. This battle-tested weekly meal prep system has helped thousands of Nairobi families reclaim 8+ hours every week.',
    coverImage: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=1200&q=80',
    category: 'cooking-tips',
    tags: ['meal-prep', 'family', 'time-saving', 'budget'],
    author: AUTHORS.amina,
    publishedAt: '2026-05-28T08:00:00Z',
    readTime: 8,
    featured: true,
    content: [
      { type: 'paragraph', text: 'If you\'re reading this on a Wednesday evening, exhausted and staring into an empty fridge, you\'re not alone. The average Nairobi parent spends 11 hours a week thinking about, shopping for, and preparing meals. Imagine getting half of that time back.' },
      { type: 'paragraph', text: 'Meal prepping isn\'t about eating bland chicken and broccoli for seven days straight. It\'s about strategic planning that gives you variety, nutrition, and freedom — all while cutting your weekly grocery bill by 20-30%.' },
      { type: 'heading', level: 2, text: 'The 90-Minute Sunday System' },
      { type: 'paragraph', text: 'Block out 90 minutes every Sunday afternoon. That\'s it. In that window, you\'ll prepare the building blocks of every meal for the week ahead.' },
      { type: 'list', ordered: true, items: [
        'Cook a large pot of ugali, rice, or githeri (your weekly grain base)',
        'Roast 1.5 kg of protein (chicken, beef, or lentils for vegetarians)',
        'Prep 4-5 vegetables — wash, chop, and store in airtight containers',
        'Make one signature sauce that elevates everything (we\'ll share three below)',
      ]},
      { type: 'callout', variant: 'tip', text: 'Pika Plan automatically generates your shopping list from your weekly meal plan — saving you a separate hour of list-making.' },
      { type: 'heading', level: 2, text: 'Sample Week: Mixing & Matching' },
      { type: 'paragraph', text: 'With these building blocks, your week could look like:' },
      { type: 'list', items: [
        'Monday: Beef stew with ugali and sukuma wiki',
        'Tuesday: Chicken stir-fry with rice and steamed vegetables',
        'Wednesday: Bean curry with chapati (use prepped onion-tomato base)',
        'Thursday: Grilled fish with mukimo and salad',
        'Friday: Pilau night — special weekly treat',
      ]},
      { type: 'quote', text: 'Since switching to meal prep, my grocery spending dropped from 18,000 KES to 12,500 KES per month — and we waste almost zero food.', author: 'Margaret N., Kasarani' },
      { type: 'cta', title: 'Let AI Do the Planning', description: 'Pika Plan generates your weekly meal plan in 10 seconds — tailored to your family size, dietary needs, and budget.', href: '/meal-plans', label: 'Generate My Plan' },
    ],
  },
  {
    slug: 'high-protein-vegetarian-meals-kenya',
    title: 'High-Protein Vegetarian Meals That Don\'t Cost a Fortune in Kenya',
    excerpt:
      'You don\'t need expensive imported proteins to build a high-protein vegetarian diet. Discover 12 affordable, locally-available foods that deliver serious protein.',
    coverImage: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80',
    category: 'nutrition',
    tags: ['vegetarian', 'high-protein', 'budget', 'health'],
    author: AUTHORS.amina,
    publishedAt: '2026-05-22T10:00:00Z',
    readTime: 6,
    content: [
      { type: 'paragraph', text: 'Walk into any Kenyan supermarket and you\'ll see expensive imported protein powders, "fitness" bars, and specialty supplements. The truth? You can build a 100g+ daily protein intake using foods that cost less than 200 KES per day.' },
      { type: 'heading', level: 2, text: 'The Local Protein Powerhouses' },
      { type: 'list', items: [
        'Lentils (kamande) — 18g protein per cooked cup',
        'Green grams (ndengu) — 14g protein per cooked cup',
        'Black beans (maharagwe meusi) — 15g protein per cooked cup',
        'Peanuts (karanga) — 25g protein per 100g',
        'Eggs — 6g per egg, around 15 KES each',
        'Greek yogurt (locally produced) — 10g per 100g',
        'Tofu — increasingly available, 8g per 100g',
      ]},
      { type: 'callout', variant: 'info', text: 'Pair beans/lentils with grains (rice, ugali) to create a complete amino acid profile — this is the science behind dishes like rice and beans or githeri.' },
    ],
  },
  {
    slug: 'chef-amina-home-kitchen-success',
    title: 'From Side Hustle to Six Figures: How Chef Amina Built Her Pika Plan Business',
    excerpt:
      'Amina Wanjiru started cooking from her Kilimani kitchen for her neighbours. Today, she fulfils 200+ orders weekly through Pika Plan and earns more than her old corporate job.',
    coverImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
    category: 'vendor-stories',
    tags: ['vendor', 'success-story', 'home-chef', 'entrepreneurship'],
    author: AUTHORS.grace,
    publishedAt: '2026-05-15T09:30:00Z',
    readTime: 7,
    content: [
      { type: 'paragraph', text: 'Two years ago, Chef Amina was a marketing executive who cooked for fun on weekends. Today, she runs one of Pika Plan\'s top-rated kitchens, serving over 200 meals a week from her home in Kilimani.' },
      { type: 'quote', text: 'I never imagined cooking could replace my corporate salary. But Pika Plan handled the customer acquisition — I just focused on what I love: the food.', author: 'Chef Amina W.' },
    ],
  },
  {
    slug: 'how-ai-recommends-meals',
    title: 'Inside Pika Plan\'s AI: How We Recommend the Perfect Meal for You',
    excerpt:
      'Ever wondered how Pika Plan generates a 7-day meal plan in 10 seconds? Our AI engineer breaks down the technology behind your personalised recommendations.',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
    category: 'ai-tech',
    tags: ['ai', 'machine-learning', 'behind-the-scenes'],
    author: AUTHORS.brian,
    publishedAt: '2026-05-10T14:00:00Z',
    readTime: 5,
    content: [
      { type: 'paragraph', text: 'When you tap "Generate New Plan", a sophisticated set of algorithms swings into action. Here\'s a peek behind the curtain.' },
    ],
  },
  {
    slug: 'kenyan-superfoods-overlooked',
    title: '10 Kenyan Superfoods You\'re Probably Overlooking',
    excerpt:
      'Forget imported acai and goji berries. Our backyard is packed with nutrient-dense foods like mukimo greens, baobab, and African nightshade.',
    coverImage: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1200&q=80',
    category: 'kenyan-cuisine',
    tags: ['superfoods', 'local', 'nutrition', 'indigenous'],
    author: AUTHORS.amina,
    publishedAt: '2026-05-05T11:00:00Z',
    readTime: 6,
    content: [
      { type: 'paragraph', text: 'Kenya is home to some of the most nutrient-dense foods on the planet — but many of us reach for imported alternatives that cost 10x more.' },
    ],
  },
  {
    slug: 'reduce-food-waste-kenya',
    title: 'Cut Your Food Waste in Half: A Practical Guide for Kenyan Households',
    excerpt:
      'The average Kenyan household throws away 25% of the food they buy. Here\'s how meal planning, smart storage, and simple habits can change that.',
    coverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
    category: 'sustainability',
    tags: ['food-waste', 'sustainability', 'budget', 'environment'],
    author: AUTHORS.david,
    publishedAt: '2026-04-28T08:00:00Z',
    readTime: 5,
    content: [
      { type: 'paragraph', text: 'Every shilling you spend on food that ends up in the bin is a shilling stolen from your budget — and adding to Kenya\'s mounting waste problem.' },
    ],
  },
  {
    slug: 'pilau-recipe-perfect-every-time',
    title: 'The Perfect Pilau Recipe — Restaurant Quality, At Home',
    excerpt:
      'After testing 30+ variations across Mombasa, Malindi and Lamu, we\'ve cracked the formula for restaurant-grade pilau that will impress even your strictest auntie.',
    coverImage: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=1200&q=80',
    category: 'recipes',
    tags: ['pilau', 'kenyan', 'rice', 'main-course'],
    author: AUTHORS.amina,
    publishedAt: '2026-04-20T12:00:00Z',
    readTime: 10,
    content: [
      { type: 'paragraph', text: 'Pilau is more than a meal — it\'s a celebration. Get it right and you\'ll be the most-requested cook at every family gathering.' },
    ],
  },
  {
    slug: 'cooking-for-one-budget-meals',
    title: 'Cooking for One? 15 Budget Meals That Won\'t Leave You Eating Leftovers for Days',
    excerpt:
      'Solo cooking is tough — recipes are sized for families, and you end up wasting food. These 15 single-serve meals are designed for one person, big on flavour, easy on the wallet.',
    coverImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80',
    category: 'budget',
    tags: ['solo', 'budget', 'quick', 'one-pot'],
    author: AUTHORS.amina,
    publishedAt: '2026-04-15T09:00:00Z',
    readTime: 7,
    content: [
      { type: 'paragraph', text: 'Living alone shouldn\'t mean surviving on instant noodles and takeaway. Here are 15 satisfying meals scaled perfectly for one person.' },
    ],
  },
  {
    slug: 'mpesa-vendor-payouts-explained',
    title: 'How Vendor M-Pesa Payouts Work on Pika Plan (And Why They\'re Faster Than Most)',
    excerpt:
      'Most platforms make vendors wait 14-30 days for payments. We process M-Pesa payouts every Monday. Here\'s exactly how it works.',
    coverImage: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=1200&q=80',
    category: 'vendor-stories',
    tags: ['vendor', 'payments', 'mpesa', 'how-to'],
    author: AUTHORS.grace,
    publishedAt: '2026-04-10T10:00:00Z',
    readTime: 4,
    content: [
      { type: 'paragraph', text: 'Cash flow is everything for a small food business. Here\'s how we make sure vendors get paid quickly and predictably.' },
    ],
  },
  {
    slug: 'diabetic-friendly-kenyan-meals',
    title: 'Diabetic-Friendly Kenyan Meals That Actually Taste Good',
    excerpt:
      'Managing diabetes doesn\'t mean giving up the foods you love. A registered nutritionist shares 10 diabetic-friendly Kenyan recipes that respect both your taste buds and your blood sugar.',
    coverImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80',
    category: 'nutrition',
    tags: ['diabetes', 'health', 'low-carb', 'kenyan'],
    author: AUTHORS.amina,
    publishedAt: '2026-04-05T08:00:00Z',
    readTime: 9,
    content: [
      { type: 'paragraph', text: 'Diabetes is on the rise in Kenya, but the standard advice — "avoid ugali, rice and chapati" — feels impossible for many of us.' },
    ],
  },
]

export function getFeaturedPost() {
  return POSTS.find((p) => p.featured) ?? POSTS[0]
}

export function getPostBySlug(slug: string) {
  return POSTS.find((p) => p.slug === slug)
}

export function getRelatedPosts(currentSlug: string, category: BlogCategory, limit = 3) {
  return POSTS
    .filter((p) => p.slug !== currentSlug && p.category === category)
    .slice(0, limit)
}

export function getAllTags(): string[] {
  const set = new Set<string>()
  POSTS.forEach((p) => p.tags.forEach((t) => set.add(t)))
  return Array.from(set).sort()
}