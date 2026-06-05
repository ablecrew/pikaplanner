// ── Types ──────────────────────────────────────────────────
export type IconName =
  | 'rocket'
  | 'user'
  | 'chef-hat'
  | 'calendar'
  | 'shopping-cart'
  | 'credit-card'
  | 'truck'
  | 'store'
  | 'smartphone'
  | 'shield'
  | 'sparkles'
  | 'life-buoy'

export type GuideSection = {
  id: string
  title: string
  paragraphs?: string[]
  steps?: string[]
  tips?: { type: 'tip' | 'warning' | 'info'; text: string }[]
  code?: { language?: string; text: string }
  faqs?: { q: string; a: string }[]
}

export type GuideChapter = {
  id: string
  title: string
  description: string
  iconName: IconName    // serializable string instead of a component
  color: string
  bg: string
  readTime: number
  sections: GuideSection[]
}

// ── Content ────────────────────────────────────────────────
export const CHAPTERS: GuideChapter[] = [
  // ── CHAPTER 1: GETTING STARTED ──────────────────────────
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Create your account, set up your profile, and take your first steps in Pika Plan.',
    iconName: 'rocket',
    color: '#1A5C3A',
    bg: '#f0fdf4',
    readTime: 5,
    sections: [
      {
        id: 'welcome',
        title: 'Welcome to Pika Plan',
        paragraphs: [
          'Pika Plan is your AI-powered meal planning companion. We help you discover meals tailored to your tastes, budget, and dietary needs — then connect you with trusted local vendors when you want a meal cooked for you.',
          'This guide will walk you through every feature step by step. You can read it cover-to-cover or jump straight to the topic you need using the Contents button at the top.',
        ],
        tips: [
          { type: 'tip', text: 'Tap the Contents button to search any topic across the guide.' },
        ],
      },
      {
        id: 'create-account',
        title: 'Creating Your Account',
        paragraphs: [
          'Signing up takes less than 60 seconds and unlocks personalised meal recommendations, order history, and a saved shopping list.',
        ],
        steps: [
          'Click the "Sign Up" button in the top-right corner of any page.',
          'Enter your email address and create a strong password (at least 8 characters).',
          'Verify your email by clicking the link we send to your inbox.',
          'Complete the onboarding wizard to set your dietary preferences, household size, and budget.',
          'You\'re in! Land on your dashboard to start exploring meals.',
        ],
        tips: [
          { type: 'info', text: 'Forgot to verify? Check your spam folder or click "Resend verification" on the login page.' },
        ],
      },
      {
        id: 'first-meal-plan',
        title: 'Generating Your First Meal Plan',
        paragraphs: [
          'Once your profile is set up, you can generate an AI-powered 7-day meal plan in a single click.',
        ],
        steps: [
          'Navigate to "Meal Plans" from the main menu.',
          'Click the orange "Generate New Plan" button.',
          'Wait 10–20 seconds while our AI analyses your preferences.',
          'Browse the 21 generated meals across your week (breakfast, lunch, and dinner per day).',
          'Tap any meal to view full recipe details, swap it, or mark it as cooked.',
        ],
        tips: [
          { type: 'tip', text: 'You can regenerate your plan as many times as you like — perfect for getting fresh ideas.' },
          { type: 'warning', text: 'Free accounts get 3 meals per day. Upgrade to Premium for snacks, more variety, and AI-curated recipes.' },
        ],
      },
    ],
  },

  // ── CHAPTER 2: YOUR PROFILE ─────────────────────────────
  {
    id: 'profile',
    title: 'Your Profile & Preferences',
    description: 'Customise your dietary preferences, household size, and budget for tailored recommendations.',
    iconName: 'user',
    color: '#7c3aed',
    bg: '#f5f3ff',
    readTime: 4,
    sections: [
      {
        id: 'dietary-preferences',
        title: 'Setting Dietary Preferences',
        paragraphs: [
          'Pika Plan respects what you eat — and what you avoid. Setting accurate dietary preferences ensures every meal plan we generate is one you can actually enjoy.',
        ],
        steps: [
          'Go to Settings → Profile → Dietary Preferences.',
          'Tap the tags that apply: Vegetarian, Vegan, Halal, Gluten-Free, Dairy-Free, Nut-Free, Low-Carb, Keto, etc.',
          'Add any specific allergies in the "Allergies" field.',
          'List any foods you simply dislike in "Foods to avoid".',
          'Save your changes.',
        ],
        tips: [
          { type: 'warning', text: 'Always double-check ingredients on the meal detail page if you have severe allergies. AI is highly accurate but not infallible.' },
        ],
      },
      {
        id: 'cuisine-preferences',
        title: 'Picking Favourite Cuisines',
        paragraphs: [
          'Tell us which cuisines you love and our AI will prioritise them in your meal plans. You can mix-and-match as many as you like.',
        ],
        steps: [
          'Navigate to Settings → Profile → Cuisine Preferences.',
          'Select cuisines you enjoy: Kenyan, Swahili, Italian, Indian, Chinese, Mediterranean, and more.',
          'You can select multiple — variety keeps your week interesting.',
          'Save your preferences.',
        ],
      },
      {
        id: 'household',
        title: 'Household Size & Budget',
        paragraphs: [
          'Pika Plan scales serving sizes and ingredient quantities to match your household. Setting an accurate budget also helps us suggest meals you can actually afford.',
        ],
        steps: [
          'Go to Settings → Profile → Household.',
          'Set the number of people you typically cook for (1–10+).',
          'Select your weekly grocery budget range.',
          'Save your changes — your next meal plan will reflect these immediately.',
        ],
      },
    ],
  },

  // ── CHAPTER 3: MEAL GENERATOR ───────────────────────────
  {
    id: 'meal-generator',
    title: 'Using the Meal Generator',
    description: 'Browse meals, filter by preferences, and add your favourites to your weekly plan.',
    iconName: 'chef-hat',
    color: '#f97316',
    bg: '#fff7ed',
    readTime: 6,
    sections: [
      {
        id: 'browsing',
        title: 'Browsing Meals',
        paragraphs: [
          'The Meal Generator is your hub for discovering recipes. You can browse our entire library, see what\'s trending, and find AI suggestions personalised to you.',
        ],
        steps: [
          'Open the Meal Generator from the main menu.',
          'Use the filters at the top to narrow down by cuisine, dietary tag, or prep time.',
          'Tap any meal card to see full details: ingredients, steps, calories, and prep time.',
          'Tap the heart icon to save meals to your Favourites.',
        ],
      },
      {
        id: 'search-filters',
        title: 'Searching & Filtering',
        paragraphs: [
          'Looking for something specific? Use the search bar to find meals by name, ingredient, or cuisine.',
        ],
        tips: [
          { type: 'tip', text: 'Try searching by ingredient — e.g. "chicken" or "ugali" — to discover meals you wouldn\'t have thought of.' },
        ],
      },
      {
        id: 'ai-recommendations',
        title: 'Understanding AI Recommendations',
        paragraphs: [
          'The "Recommended for You" section uses your dietary preferences, recent activity, and household details to surface meals that match your taste.',
          'The more you interact with meals (favouriting, cooking, rating), the smarter our recommendations get.',
        ],
        faqs: [
          {
            q: 'Why does Pika Plan keep recommending the same meals?',
            a: 'If you have very specific preferences (e.g. only Kenyan food, vegetarian), your pool may be limited. Try expanding your cuisine preferences or adding new tags.',
          },
          {
            q: 'Can I get meal suggestions in a different language?',
            a: 'Yes — set your account language in Settings → Account → Language. We support English and Swahili.',
          },
        ],
      },
    ],
  },

  // ── CHAPTER 4: MEAL PLANS ───────────────────────────────
  {
    id: 'meal-plans',
    title: 'Weekly Meal Plans',
    description: 'Generate AI-powered weekly plans, customise meals, and stay on top of your nutrition.',
    iconName: 'calendar',
    color: '#2563eb',
    bg: '#eff6ff',
    readTime: 7,
    sections: [
      {
        id: 'plan-overview',
        title: 'Your Plan at a Glance',
        paragraphs: [
          'The Meal Plans page gives you a 7-day overview of your scheduled meals. Each day shows breakfast, lunch, and dinner (plus snacks if you\'re on Premium).',
          'Stats at the top show how many days you have planned, total calories for the week, and total prep time.',
        ],
      },
      {
        id: 'customising-plans',
        title: 'Customising Your Plan',
        paragraphs: [
          'Don\'t love a suggested meal? Swap it in seconds.',
        ],
        steps: [
          'Tap any meal in your plan.',
          'Choose "Swap meal" from the action menu.',
          'Browse alternatives that match your preferences and dietary needs.',
          'Tap "Use this meal" to replace.',
        ],
        tips: [
          { type: 'info', text: 'You can also mark meals as "Cooked" or "Skipped" to keep track of what you actually ate.' },
        ],
      },
      {
        id: 'regenerating',
        title: 'Regenerating a Plan',
        paragraphs: [
          'Sometimes you want a fresh start. Hit "Generate New Plan" any time to get a brand-new 7-day plan based on your latest preferences.',
        ],
        tips: [
          { type: 'warning', text: 'Regenerating replaces your active plan. If you\'ve been tracking what you cooked, finish marking meals as "Cooked" before regenerating.' },
        ],
      },
      {
        id: 'shopping-list-generation',
        title: 'Generating a Shopping List',
        paragraphs: [
          'Once your plan looks good, you can auto-generate a complete shopping list with all the ingredients you need for the week.',
        ],
        steps: [
          'On the Meal Plans page, tap "Add to Shopping List".',
          'Review the consolidated ingredient list — duplicates are merged automatically.',
          'Adjust quantities or remove items you already have.',
          'Save the list, or send it to a vendor for direct delivery.',
        ],
      },
    ],
  },

  // ── CHAPTER 5: SHOPPING LIST ────────────────────────────
  {
    id: 'shopping',
    title: 'Smart Shopping List',
    description: 'Manage groceries, check items off as you shop, and send orders to vendors directly.',
    iconName: 'shopping-cart',
    color: '#16a34a',
    bg: '#f0fdf4',
    readTime: 4,
    sections: [
      {
        id: 'adding-items',
        title: 'Adding Items',
        paragraphs: [
          'Your shopping list can be built automatically from your meal plan, or manually for any extras you need.',
        ],
        steps: [
          'Navigate to Shopping from the main menu.',
          'Tap "Add Item" to add a manual entry, or generate from your meal plan.',
          'Group items by category (produce, dairy, pantry, etc.) for easier in-store shopping.',
        ],
      },
      {
        id: 'check-off',
        title: 'Checking Items Off',
        paragraphs: [
          'As you shop, tap each item to check it off. Your list will visually separate purchased vs. remaining items.',
        ],
        tips: [
          { type: 'tip', text: 'On mobile, your list stays available offline — no signal needed in the supermarket.' },
        ],
      },
      {
        id: 'send-to-vendor',
        title: 'Sending to a Vendor',
        paragraphs: [
          'Don\'t want to shop yourself? Send your entire list to a local vendor for delivery.',
        ],
        steps: [
          'From your shopping list, tap "Send to vendor".',
          'Browse vendors who deliver to your area.',
          'Select one and review the total cost (vendor markup may apply).',
          'Pay with M-Pesa or card.',
          'Track your delivery in real time.',
        ],
      },
    ],
  },

  // ── CHAPTER 6: ORDERING & DELIVERY ──────────────────────
  {
    id: 'orders',
    title: 'Orders & Delivery',
    description: 'Place orders with vendors, track delivery, and handle issues like cancellations or refunds.',
    iconName: 'truck',
    color: '#dc2626',
    bg: '#fef2f2',
    readTime: 6,
    sections: [
      {
        id: 'placing-order',
        title: 'Placing an Order',
        paragraphs: [
          'Pika Plan vendors can prepare meals on-demand or fulfil bulk weekly orders. Choose what fits your week.',
        ],
        steps: [
          'Find a meal you want and tap "Order Now".',
          'Select a vendor (we recommend based on rating, proximity, and price).',
          'Confirm your delivery address and time slot.',
          'Pay with M-Pesa, Visa, Mastercard, or bank transfer.',
          'You\'ll receive a confirmation SMS with your order number.',
        ],
      },
      {
        id: 'tracking',
        title: 'Tracking Your Order',
        paragraphs: [
          'Once an order is placed, you can track its status in real time.',
        ],
        steps: [
          'Open Orders from the main menu.',
          'Tap your active order to see live status: Preparing → Out for Delivery → Delivered.',
          'You\'ll get SMS and in-app push notifications at each step.',
        ],
      },
      {
        id: 'cancelling',
        title: 'Cancelling an Order',
        paragraphs: [
          'You can cancel free of charge within 5 minutes of placing the order. After that, fees may apply.',
        ],
        steps: [
          'Go to Orders → your active order.',
          'Tap "Cancel order".',
          'Confirm the cancellation.',
          'Refunds are processed automatically within 3–5 business days.',
        ],
        tips: [
          { type: 'warning', text: 'Cancellation policies vary by vendor. The exact terms are shown at checkout before you confirm.' },
        ],
      },
      {
        id: 'issues',
        title: 'Reporting an Order Issue',
        paragraphs: [
          'If your meal arrives damaged, incorrect, or late, we\'ve got your back.',
        ],
        steps: [
          'Go to Orders → the order in question.',
          'Tap "Report Issue".',
          'Choose the issue type and add a photo if relevant.',
          'Submit — our team typically resolves issues within 24 hours.',
        ],
      },
    ],
  },

  // ── CHAPTER 7: PAYMENTS & BILLING ───────────────────────
  {
    id: 'payments',
    title: 'Payments & Billing',
    description: 'Add payment methods, manage subscriptions, view invoices, and request refunds.',
    iconName: 'credit-card',
    color: '#7c3aed',
    bg: '#f5f3ff',
    readTime: 5,
    sections: [
      {
        id: 'payment-methods',
        title: 'Adding a Payment Method',
        paragraphs: [
          'We accept M-Pesa, Visa, Mastercard, and bank transfers. All payments are encrypted end-to-end via Payhero.',
        ],
        steps: [
          'Go to Settings → Payments → Add Payment Method.',
          'Choose M-Pesa, card, or bank transfer.',
          'For M-Pesa: enter your Safaricom number and confirm via STK push.',
          'For cards: enter card details on our secure form (we never see or store your raw card number).',
        ],
        tips: [
          { type: 'info', text: 'You can save multiple payment methods and choose one at checkout.' },
        ],
      },
      {
        id: 'subscriptions',
        title: 'Managing Your Subscription',
        paragraphs: [
          'Premium unlocks unlimited AI generations, snack slots, vendor priority, and more.',
        ],
        steps: [
          'Go to Settings → Subscription.',
          'View your current plan, next billing date, and payment method.',
          'Upgrade, downgrade, or cancel any time — changes take effect at the next billing cycle.',
        ],
        faqs: [
          {
            q: 'When am I charged?',
            a: 'Monthly subscriptions renew on the same date each month. Annual subscriptions renew yearly.',
          },
          {
            q: 'Will I lose my data if I downgrade?',
            a: 'No — all your meal plans, favourites, and history are preserved. You\'ll just lose access to Premium-only features.',
          },
        ],
      },
      {
        id: 'refunds',
        title: 'Refunds & Invoices',
        paragraphs: [
          'Refunds are processed back to your original payment method within 3–5 business days.',
        ],
        steps: [
          'Go to Orders → the order you want refunded.',
          'Tap "Request refund".',
          'Provide a reason (we use this to improve our service).',
          'You\'ll receive an email confirmation when the refund is issued.',
        ],
        tips: [
          { type: 'tip', text: 'You can download invoices for all your orders from Settings → Billing → Invoices.' },
        ],
      },
    ],
  },

  // ── CHAPTER 8: BECOMING A VENDOR ────────────────────────
  {
    id: 'vendor',
    title: 'Becoming a Vendor',
    description: 'Apply to sell on Pika Plan, manage your menu, and handle orders from your dashboard.',
    iconName: 'store',
    color: '#0891b2',
    bg: '#ecfeff',
    readTime: 5,
    sections: [
      {
        id: 'vendor-signup',
        title: 'Applying as a Vendor',
        paragraphs: [
          'Pika Plan is always looking for talented home chefs, restaurants, and food trucks. Application is free and takes about 5 minutes.',
        ],
        steps: [
          'Visit the Vendor Signup page from the footer.',
          'Complete the 5-step application: business info, contact, kitchen details, cuisine, and documents.',
          'Upload your business license and food safety certificate.',
          'Submit and wait — most applications are reviewed within 1–3 business days.',
        ],
      },
      {
        id: 'vendor-dashboard',
        title: 'Using the Vendor Dashboard',
        paragraphs: [
          'Once approved, you\'ll get access to a powerful dashboard for managing orders, menu items, and payouts.',
        ],
      },
      {
        id: 'vendor-payouts',
        title: 'How Vendor Payouts Work',
        paragraphs: [
          'Vendor earnings are paid out every Monday via M-Pesa or bank transfer.',
        ],
        tips: [
          { type: 'info', text: 'Your subscription is a flat KES 999/month — there\'s no commission on your sales. You keep 100% of every order.' },
        ],
      },
    ],
  },

  // ── CHAPTER 9: MOBILE & OFFLINE ─────────────────────────
  {
    id: 'mobile',
    title: 'Mobile App & Offline Features',
    description: 'Install Pika Plan on your phone, enable notifications, and use the app offline.',
    iconName: 'smartphone',
    color: '#475569',
    bg: '#f1f5f9',
    readTime: 3,
    sections: [
      {
        id: 'install',
        title: 'Installing the App',
        paragraphs: [
          'Pika Plan is a Progressive Web App (PWA) — install it directly from your browser without an app store.',
        ],
        steps: [
          'On Android: open Pika Plan in Chrome → tap the three-dot menu → "Add to Home screen".',
          'On iOS: open Pika Plan in Safari → tap the Share button → "Add to Home Screen".',
          'The app icon will appear on your home screen — tap it any time to launch.',
        ],
      },
      {
        id: 'notifications',
        title: 'Enabling Notifications',
        paragraphs: [
          'Get real-time alerts for order updates, delivery status, and weekly plan reminders.',
        ],
        steps: [
          'Go to Settings → Notifications.',
          'Toggle on the categories you want: Orders, Meal Plans, Promotions, Vendor Updates.',
          'Allow browser/device-level notifications when prompted.',
        ],
      },
      {
        id: 'offline',
        title: 'Using Pika Plan Offline',
        paragraphs: [
          'Your meal plans, shopping list, and saved recipes are cached locally — accessible even without internet.',
        ],
        tips: [
          { type: 'tip', text: 'Perfect for the supermarket! Your shopping list works offline so you can check off items even with no signal.' },
        ],
      },
    ],
  },

  // ── CHAPTER 10: PRIVACY & SECURITY ──────────────────────
  {
    id: 'privacy-security',
    title: 'Privacy & Security',
    description: 'Manage your data, change your password, set up two-factor auth, and stay safe online.',
    iconName: 'shield',
    color: '#dc2626',
    bg: '#fef2f2',
    readTime: 4,
    sections: [
      {
        id: 'change-password',
        title: 'Changing Your Password',
        steps: [
          'Go to Settings → Security → Change Password.',
          'Enter your current password and a new strong password.',
          'Click Save.',
        ],
        tips: [
          { type: 'tip', text: 'Use a unique password you don\'t reuse anywhere else. A password manager makes this easy.' },
        ],
      },
      {
        id: 'two-factor',
        title: 'Two-Factor Authentication',
        paragraphs: [
          '2FA adds an extra layer of security — even if someone gets your password, they can\'t log in without your phone.',
        ],
        steps: [
          'Go to Settings → Security → Two-Factor Authentication.',
          'Choose SMS or an authenticator app (Google Authenticator, Authy).',
          'Follow the setup steps and save your backup codes somewhere safe.',
        ],
      },
      {
        id: 'data-export',
        title: 'Exporting or Deleting Your Data',
        paragraphs: [
          'Under Kenya\'s Data Protection Act 2019, you have the right to download or delete all your personal data at any time.',
        ],
        steps: [
          'Export: Settings → Privacy → Download my data (delivered as a ZIP within 30 days).',
          'Delete: Settings → Account → Delete account (30-day grace period before permanent removal).',
        ],
      },
    ],
  },

  // ── CHAPTER 11: TIPS & TRICKS ───────────────────────────
  {
    id: 'tips-tricks',
    title: 'Pro Tips & Power Features',
    description: 'Get the most out of Pika Plan with insider tips, keyboard shortcuts, and hidden features.',
    iconName: 'sparkles',
    color: '#F4A535',
    bg: '#fff7ed',
    readTime: 4,
    sections: [
      {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        paragraphs: [
          'Speed up your workflow with these shortcuts (desktop only).',
        ],
        steps: [
          'Cmd/Ctrl + K — Open global search',
          'Cmd/Ctrl + N — Generate new meal plan',
          'Cmd/Ctrl + / — Open help guide',
          'Esc — Close any modal',
        ],
      },
      {
        id: 'meal-prep',
        title: 'Meal Prep Tips',
        paragraphs: [
          'Save time and money by prepping meals in advance.',
        ],
        tips: [
          { type: 'tip', text: 'Filter recipes by "Prep < 30 min" to find quick weeknight options.' },
          { type: 'tip', text: 'Use the "Batch cook" filter to find recipes designed for meal prepping multiple servings.' },
          { type: 'info', text: 'Premium users can mark meals as "Lunch prep" to get tailored portion guides.' },
        ],
      },
      {
        id: 'sharing',
        title: 'Sharing Recipes & Plans',
        paragraphs: [
          'Found a meal your friends would love? Share it with one tap.',
        ],
        steps: [
          'Open the meal or plan you want to share.',
          'Tap the Share icon.',
          'Send via WhatsApp, SMS, email, or copy the link.',
        ],
      },
    ],
  },

  // ── CHAPTER 12: GETTING HELP ────────────────────────────
  {
    id: 'getting-help',
    title: 'Getting More Help',
    description: 'When you need a human, here\'s how to reach our support team fast.',
    iconName: 'life-buoy',
    color: '#16a34a',
    bg: '#f0fdf4',
    readTime: 2,
    sections: [
      {
        id: 'support-channels',
        title: 'Reaching Support',
        paragraphs: [
          'Our support team is available 7 days a week. The fastest channel for most issues is WhatsApp.',
        ],
        steps: [
          'WhatsApp: tap the WhatsApp icon in the footer (avg. response: 30 mins)',
          'Email: support@pikaplan.com (avg. response: 24 hours)',
          'Phone: +254 797 846 624 (Mon–Sat, 8am–8pm)',
          'Submit a Ticket: use our /support/contact form for complex issues with file attachments',
        ],
      },
      {
        id: 'community',
        title: 'Join the Community',
        paragraphs: [
          'Connect with other Pika Plan users to share recipes, tips, and discoveries.',
        ],
        tips: [
          { type: 'info', text: 'Follow us on Instagram and Twitter for daily meal inspiration and product updates.' },
        ],
      },
    ],
  },
]