
export type CompanyFact = {
  iconName: 'users' | 'trending-up' | 'store' | 'globe' | 'award' | 'sparkles'
  label: string
  value: string
  description: string
}

export type Founder = {
  name: string
  role: string
  bio: string
  shortBio: string
  linkedinUrl?: string
  twitterUrl?: string
  email?: string
}

export type Milestone = {
  year: string
  month?: string
  title: string
  description: string
  type: 'launch' | 'funding' | 'milestone' | 'award' | 'expansion'
}

export type MediaCoverage = {
  outlet: string
  headline: string
  date: string
  url: string
  excerpt?: string
}

export type DownloadableAsset = {
  name: string
  description: string
  fileName: string
  fileSize: string
  fileType: 'PNG' | 'SVG' | 'PDF' | 'ZIP' | 'JPG'
  url: string
  iconName: 'image' | 'file-text' | 'package' | 'palette'
}

export type BrandColor = {
  name: string
  hex: string
  rgb: string
  cmyk?: string
  usage: string
}

// ── Company Profile ───────────────────────────────────────
export const COMPANY = {
  name: 'Pika Plan Ltd',
  shortName: 'Pika Plan',
  tagline: 'AI-powered meal planning for every Kenyan family.',
  founded: '2026',
  headquarters: 'Nairobi, Kenya',
  website: 'https://pikaplanner.vercel.app',
  industry: 'FoodTech / Consumer SaaS',
  employees: '15–25',
  registrationNumber: 'PVR-2026-001234',
}

// ── Boilerplate (the official "about us" PR write-up) ────
export const BOILERPLATE = {
  short:
    'Pika Plan is an AI-powered meal planning platform helping Kenyan families discover what to eat, build smart shopping lists, and order from a curated network of local vendors.',
  medium:
    'Founded in 2026 and headquartered in Nairobi, Pika Plan combines artificial intelligence, dietary science, and a curated vendor marketplace to transform how Kenyan families plan, shop, and eat. The platform serves thousands of users monthly and partners with home chefs, restaurants, and food trucks across Kenya.',
  long:
    'Pika Plan Ltd is a Nairobi-based foodtech company on a mission to make smart, healthy, affordable eating effortless for every Kenyan family. Founded in 2026, the platform uses AI to generate personalised 7-day meal plans tailored to each household\'s dietary preferences, budget, and cuisine tastes. Users can shop the consolidated grocery list themselves or order directly from a curated network of vetted vendors — including home chefs, restaurants, and cloud kitchens. Beyond meal planning, Pika Plan supports vendor businesses with a flat-fee subscription model (no commissions), real-time analytics, and weekly M-Pesa payouts. The company is committed to building locally-relevant technology that respects Kenyan food culture while empowering both consumers and small food businesses.',
}

// ── Quick Stats ───────────────────────────────────────────
export const FACTS: CompanyFact[] = [
  {
    iconName: 'users',
    label: 'Active Users',
    value: '10,000+',
    description: 'Households planning meals weekly',
  },
  {
    iconName: 'store',
    label: 'Vendor Partners',
    value: '200+',
    description: 'Home chefs, restaurants, food trucks',
  },
  {
    iconName: 'trending-up',
    label: 'Meals Planned',
    value: '500K+',
    description: 'Generated via AI to date',
  },
  {
    iconName: 'globe',
    label: 'Cities Served',
    value: '5',
    description: 'Nairobi, Mombasa, Kisumu, Nakuru, Eldoret',
  },
  {
    iconName: 'award',
    label: 'NPS Score',
    value: '72',
    description: 'World-class customer satisfaction',
  },
  {
    iconName: 'sparkles',
    label: 'Funding Raised',
    value: '$500K',
    description: 'Pre-seed round, 2026',
  },
]

// ── Founders / Leadership ─────────────────────────────────
export const FOUNDERS: Founder[] = [
  {
    name: 'Brian Ontita',
    role: 'Founder & CEO',
    shortBio: 'Spaxmedia company lead. Building Pika Plan to make meal planning effortless for every Kenyan household.',
    bio:
      'Ontita is the founder and CEO of Pika Plan. Before starting the company, he spent 6 years at Spaxmedia, where he led product teams in producing solution products. He holds a Bachelor\'s in Computer Science from the University of Nairobi and an MBA from Strathmore Business School. Ontita lives in Nairobi with his family, who are also Pika Plan\'s most demanding beta testers.',
    linkedinUrl: 'https://linkedin.com/in/brianontita',
    twitterUrl: 'https://twitter.com/brianontita',
    email: 'ontitabrian@pikaplan.com',
  },
  {
    name: 'Amina Wanjiru',
    role: 'Head of Nutrition',
    shortBio: 'Registered nutritionist with 8+ years helping Kenyan families eat better on a budget.',
    bio:
      'Amina leads nutrition, content, and dietary research at Pika Plan. A registered nutritionist with a Master\'s in Public Health Nutrition from Kenyatta University, she has spent the last eight years working with the Ministry of Health on nutritional outreach programs across rural and urban Kenya. At Pika Plan, she ensures every AI-generated meal plan respects cultural traditions, nutritional balance, and household budgets.',
    linkedinUrl: 'https://linkedin.com/in/aminawanjiru',
    email: 'amina@pikaplan.com',
  },
  {
    name: 'Teddy Dande',
    role: 'CTO & Co-Founder',
    shortBio: 'AI engineer backed fintech.',
    bio:
      'Dande leads the engineering team at Pika Plan, with a focus on the AI systems that power personalised meal recommendations. He previously led machine-learning teams at Andela and a YC-backed fintech, and holds a Bachelor\'s in Computer Science from University of Nairobi.',
    linkedinUrl: 'https://linkedin.com/in/dandeteddy',
    twitterUrl: 'https://twitter.com/dandeteddy',
    email: 'dandeteddy@pikaplan.com',
  },
  {
    name: 'Grace Mwende',
    role: 'Head of Vendor Success',
    shortBio: 'Building Kenya\'s most vendor-friendly food platform.',
    bio:
      'Grace leads vendor partnerships and success at Pika Plan. Previously head of merchant ops at Jumia Food Kenya, she has spent her career helping small food businesses scale digitally. At Pika Plan, she manages onboarding, training, and ongoing success for 200+ active vendor partners.',
    linkedinUrl: 'https://linkedin.com/in/gracemwende',
    email: 'grace@pikaplan.com',
  },
]

// ── Company Milestones ────────────────────────────────────
export const MILESTONES: Milestone[] = [
  {
    year: '2026',
    month: 'March',
    title: 'Pika Plan founded',
    description: 'Brian Ontita and Teddy Dande co-found the company in Nairobi.',
    type: 'launch',
  },
  {
    year: '2026',
    month: 'May',
    title: 'Beta launch',
    description: 'First 500 households join the closed beta.',
    type: 'launch',
  },
  {
    year: '2026',
    month: 'July',
    title: 'Pre-seed funding closed',
    description: 'Raising the money for the funding.',
    type: 'funding',
  },
  {
    year: '2026',
    month: 'August',
    title: 'Public launch',
    description: 'Pika Plan opens to all Kenyan users. Vendor marketplace goes live with 50 partners.',
    type: 'launch',
  },
  {
    year: '2026',
    month: 'October',
    title: 'We are expecting 2,000 active households',
    description: 'Reach 2,000 weekly active households within five months of launch.',
    type: 'milestone',
  },
  {
    year: '2026',
    month: 'December',
    title: 'Expansion to coastal Kenya',
    description: 'Mombasa launch brings Pika Plan to coastal cuisine lovers.',
    type: 'expansion',
  },
  {
    year: '2027',
    month: 'January',
    title: '200th vendor onboarded',
    description: 'Vendor network crosses 200 active partners across 5 cities.',
    type: 'milestone',
  },
  {
    year: '2027',
    month: 'February',
    title: 'We are expecting to be featured by Google for Startups',
    description: 'Selected for the Google for Startups Africa accelerator program.',
    type: 'award',
  },
]

// ── Media Coverage ────────────────────────────────────────
export const MEDIA_COVERAGE: MediaCoverage[] = [
  {
    outlet: 'Business Daily Africa',
    headline: 'How Pika Plan is using AI to solve Kenya\'s meal planning problem',
    date: '2026-04-15',
    url: 'https://www.businessdailyafrica.com',
    excerpt: 'The Nairobi-based startup has built a platform that combines machine learning with local food culture...',
  },
  {
    outlet: 'TechCrunch Africa',
    headline: 'Pika Plan raises $500K to bring AI meal planning to Kenyan households',
    date: '2026-05-15',
    url: 'https://techcrunch.com',
    excerpt: 'The pre-seed round was led by regional angels with participation from Nordic VCs...',
  },
  {
    outlet: 'Capital FM',
    headline: 'New app helps Kenyan families plan meals on a budget',
    date: '2027-06-10',
    url: 'https://www.capitalfm.co.ke',
    excerpt: 'Cooking inspiration meets smart shopping in this Nairobi-built platform...',
  },
  {
    outlet: 'NTV Kenya',
    headline: 'Meet the team behind Pika Plan',
    date: '2027-08-22',
    url: 'https://ntv.nation.africa',
    excerpt: 'Featured segment on the morning show about Kenya\'s rising foodtech sector...',
  },
  {
    outlet: 'Disrupt Africa',
    headline: 'Kenyan foodtech Pika Plan signs 100th vendor',
    date: '2027-04-18',
    url: 'https://disrupt-africa.com',
    excerpt: 'The platform\'s zero-commission model is winning over home chefs and small restaurants...',
  },
]

// ── Downloadable Assets ───────────────────────────────────
export const ASSETS: DownloadableAsset[] = [
  {
    name: 'Full Brand Kit',
    description: 'Everything you need — logos, color palette, typography guide, and brand guidelines PDF',
    fileName: 'pikaplan-brand-kit.zip',
    fileSize: '12.4 MB',
    fileType: 'ZIP',
    url: '/press/pikaplan-brand-kit.zip',
    iconName: 'package',
  },
  {
    name: 'Logo Pack (PNG + SVG)',
    description: 'Primary logo in light & dark variants, vertical lockup, and icon-only mark',
    fileName: 'pikaplan-logos.zip',
    fileSize: '2.8 MB',
    fileType: 'ZIP',
    url: '/press/pikaplan-logos.zip',
    iconName: 'image',
  },
  {
    name: 'Brand Guidelines PDF',
    description: 'Official guide on how to use Pika Plan branding — spacing, do\'s and don\'ts, voice & tone',
    fileName: 'pikaplan-brand-guidelines.pdf',
    fileSize: '4.1 MB',
    fileType: 'PDF',
    url: '/press/pikaplan-brand-guidelines.pdf',
    iconName: 'file-text',
  },
  {
    name: 'Product Screenshots',
    description: 'High-resolution screenshots of the meal generator, plans, and vendor pages',
    fileName: 'pikaplan-screenshots.zip',
    fileSize: '18.6 MB',
    fileType: 'ZIP',
    url: '/press/pikaplan-screenshots.zip',
    iconName: 'image',
  },
  {
    name: 'Founder Headshots',
    description: 'Professional photos of the leadership team in both casual and formal settings',
    fileName: 'pikaplan-team-photos.zip',
    fileSize: '24.2 MB',
    fileType: 'ZIP',
    url: '/press/pikaplan-team-photos.zip',
    iconName: 'image',
  },
  {
    name: 'Color Palette',
    description: 'Brand colors with HEX, RGB, CMYK values and usage notes',
    fileName: 'pikaplan-colors.pdf',
    fileSize: '180 KB',
    fileType: 'PDF',
    url: '/press/pikaplan-colors.pdf',
    iconName: 'palette',
  },
]

// ── Brand Colors ──────────────────────────────────────────
export const BRAND_COLORS: BrandColor[] = [
  {
    name: 'Forest Green',
    hex: '#1A5C3A',
    rgb: 'rgb(26, 92, 58)',
    cmyk: 'C72 M0 Y37 K64',
    usage: 'Primary brand color — backgrounds, primary buttons, headings',
  },
  {
    name: 'Lime Bright',
    hex: '#32CD32',
    rgb: 'rgb(50, 205, 50)',
    cmyk: 'C76 M0 Y76 K20',
    usage: 'Accent — highlights, success states, decorative elements',
  },
  {
    name: 'Amber Orange',
    hex: '#F4A535',
    rgb: 'rgb(244, 165, 53)',
    cmyk: 'C0 M32 Y78 K4',
    usage: 'CTA accent — featured tags, secondary buttons',
  },
  {
    name: 'Vibrant Orange',
    hex: '#F97316',
    rgb: 'rgb(249, 115, 22)',
    cmyk: 'C0 M54 Y91 K2',
    usage: 'Primary CTAs — Apply Now, Subscribe, Get Started buttons',
  },
  {
    name: 'Deep Green',
    hex: '#0A2D1D',
    rgb: 'rgb(10, 45, 29)',
    cmyk: 'C78 M0 Y36 K82',
    usage: 'Hero gradients, premium feel, dark mode surfaces',
  },
  {
    name: 'Slate 900',
    hex: '#0F172A',
    rgb: 'rgb(15, 23, 42)',
    cmyk: 'C64 M45 Y0 K84',
    usage: 'Body text, headings on light backgrounds',
  },
]

// ── Awards & Recognition ──────────────────────────────────
export const AWARDS = [
  { year: '2026', name: 'Google for Startups Africa — Accelerator Cohort' },
  { year: '2027', name: 'Top 10 African FoodTech Startups — Disrupt Africa' },
  { year: '2026', name: 'Best Use of AI in Consumer Apps — Nairobi Tech Awards' },
  { year: '2026', name: 'Pre-Seed Funding Round — $500K closed' },
]

// ── Press Contact ─────────────────────────────────────────
export const PRESS_CONTACT = {
  name: 'Brian Ontita',
  role: 'CEO & Founder',
  email: 'press@pikaplan.com',
  phone: '+254 797 846 624',
  responseTime: 'Within 24 hours on weekdays',
}