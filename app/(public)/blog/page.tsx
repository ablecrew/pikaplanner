import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  BookOpen, Clock, ArrowRight, Sparkles, TrendingUp,
  Calendar, User, Tag,
} from 'lucide-react'
import BlogFilters from './BlogFilters'
import NewsletterForm from './NewsletterForm'
import CoverImage from './CoverImage'
import {
  POSTS, CATEGORIES, getFeaturedPost, getCategoryMeta,
  type BlogCategory, type BlogPost,
} from './_data/posts'

export const metadata: Metadata = {
  title: 'Blog | Pika Plan',
  description:
    'Recipes, nutrition tips, vendor stories, and the latest on AI-powered meal planning — straight from the Pika Plan team.',
  keywords: [
    'Pika Plan blog',
    'meal planning blog',
    'Kenyan recipes',
    'nutrition Kenya',
    'vendor stories',
    'AI meal planning',
  ],
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog | Pika Plan',
    description: 'Recipes, nutrition, vendor stories, and AI meal planning insights.',
    url: '/blog',
    siteName: 'Pika Plan',
    type: 'website',
    locale: 'en_KE',
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function BlogPage() {
  const featured = getFeaturedPost()
  const recentPosts = POSTS.filter((p) => p.slug !== featured.slug)
  const trendingTags = ['meal-prep', 'budget', 'kenyan', 'vegetarian', 'high-protein', 'family']

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Pika Plan Blog',
    description: 'Recipes, nutrition, vendor stories, and AI meal planning insights from Pika Plan.',
    url: 'https://pikaplanner.vercel.app/blog',
    blogPost: POSTS.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `https://pikaplanner.vercel.app/blog/${p.slug}`,
      datePublished: p.publishedAt,
      author: { '@type': 'Person', name: p.author.name },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="min-h-screen bg-[#f8faf8] font-poppins">
        {/* ── HERO ───────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:py-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider mb-5 backdrop-blur">
              <BookOpen size={14} className="text-[#32CD32]" />
              The Pika Plan Blog
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-3xl">
              Stories, recipes & ideas to feed your week.
            </h1>
            <p className="mt-4 text-lg text-white/80 max-w-2xl leading-relaxed">
              Honest food writing from Kenya — practical meal planning, smart nutrition,
              vendor success stories, and the tech behind your favourite features.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <BookOpen size={14} />
                <span>
                  <strong className="text-white">{POSTS.length}</strong> articles
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#32CD32]" />
                <span>Updated weekly</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} />
                <span>Written by experts</span>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
          {/* ── FEATURED POST ────────────────────────────── */}
          <section className="mb-12">
            <Link
              href={`/blog/${featured.slug}`}
              className="group block bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all"
            >
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative h-64 md:h-auto overflow-hidden">
                  <CoverImage title={featured.title} category={featured.category} />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-[#f97316] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md z-10">
                    <TrendingUp size={11} /> Featured
                  </div>
                </div>

                <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                  <CategoryBadge category={featured.category} />
                  <h2 className="mt-4 text-2xl sm:text-3xl font-black text-slate-900 leading-tight group-hover:text-[#126e3d] transition-colors">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-3">
                    {featured.excerpt}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User size={12} />
                      <span className="font-semibold text-slate-700">{featured.author.name}</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      <span>{formatDate(featured.publishedAt)}</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>{featured.readTime} min read</span>
                    </div>
                  </div>

                  <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-[#126e3d]">
                    Read the article <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>
              </div>
            </Link>
          </section>

          {/* ── FILTERS ──────────────────────────────────── */}
          <section className="mb-8">
            <BlogFilters />
          </section>

          {/* ── NO RESULTS BANNER ────────────────────────── */}
          <div
            id="no-blog-results"
            style={{ display: 'none' }}
            className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center"
          >
            <BookOpen className="mx-auto mb-2 text-amber-600" size={28} />
            <p className="font-bold text-amber-900">No articles match your search</p>
            <p className="text-sm text-amber-800 mt-1">
              Try a different keyword or pick another category.
            </p>
          </div>

          {/* ── POSTS GRID ───────────────────────────────── */}
          <section className="mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>

          {/* ── TRENDING TAGS ────────────────────────────── */}
          <section className="mb-16 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Tag size={16} className="text-[#126e3d]" />
              <h3 className="font-black text-slate-900 uppercase text-sm tracking-wider">
                Trending Tags
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${tag}`}
                  className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-bold text-slate-700 hover:bg-[#f0fdf4] hover:text-[#126e3d] transition"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </section>

          {/* ── NEWSLETTER ───────────────────────────────── */}
          <section className="mb-16">
            <div className="rounded-[32px] bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white p-8 lg:p-12 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#32CD32]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#F4A535]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur">
                  <Sparkles size={14} className="text-[#32CD32]" />
                  Weekly Newsletter
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3 leading-tight">
                  Fresh recipes & meal planning tips, every Friday.
                </h2>
                <p className="text-white/80 mb-6 leading-relaxed">
                  Join 5,000+ Kenyan families getting one carefully-curated email per week.
                  No spam, just genuinely useful food content.
                </p>
                <NewsletterForm />
              </div>
            </div>
          </section>

          {/* ── BROWSE BY CATEGORY ────────────────────────── */}
          <section className="mb-16">
            <h2 className="text-2xl font-black text-slate-900 mb-1">Browse by category</h2>
            <p className="text-sm text-gray-500 mb-6">Pick a topic to deep-dive into.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {CATEGORIES.map((cat) => {
                const count = POSTS.filter((p) => p.category === cat.value).length
                return (
                  <Link
                    key={cat.value}
                    href={`/blog?category=${cat.value}`}
                    className="group bg-white border border-gray-100 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-md transition-all"
                  >
                    <div
                      className="w-12 h-1.5 rounded-full mb-3"
                      style={{ backgroundColor: cat.color }}
                    />
                    <h3 className="font-black text-slate-900 text-sm">{cat.label}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{cat.description}</p>
                    <p className="text-xs font-bold text-[#126e3d] mt-3">
                      {count} {count === 1 ? 'article' : 'articles'} →
                    </p>
                  </Link>
                )
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}

// ── Reusable Components ────────────────────────────────────
function CategoryBadge({ category }: { category: BlogCategory }) {
  const meta = getCategoryMeta(category)
  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  )
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      data-post
      data-category={post.category}
      data-search={`${post.title} ${post.excerpt} ${post.tags.join(' ')} ${post.author.name}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <CoverImage title={post.title} category={post.category} />
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <CategoryBadge category={post.category} />
        <h3 className="mt-3 text-lg font-black text-slate-900 leading-tight group-hover:text-[#126e3d] transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">
          {post.excerpt}
        </p>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <User size={11} />
            <span className="font-semibold text-slate-700 truncate">{post.author.name}</span>
          </div>
          <span>·</span>
          <span>{new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          <span className="ml-auto flex items-center gap-1">
            <Clock size={11} /> {post.readTime}m
          </span>
        </div>
      </div>
    </Link>
  )
}