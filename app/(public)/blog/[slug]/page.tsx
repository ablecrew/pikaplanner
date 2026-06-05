import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Footer from '@/components/footer/Footer'
import {
  ArrowLeft, Calendar, Clock, Share2,
  Lightbulb, Info, AlertTriangle, Sparkles, ArrowRight,
} from 'lucide-react'
import CoverImage from '../CoverImage'
import {
  POSTS, getPostBySlug, getRelatedPosts, getCategoryMeta,
  type BlogContent,
} from '../_data/posts'

export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Not Found' }

  return {
    title: `${post.title} | Pika Plan Blog`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      siteName: 'Pika Plan',
      type: 'article',
      locale: 'en_KE',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) notFound()

  const category = getCategoryMeta(post.category)
  const related = getRelatedPosts(post.slug, post.category, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Pika Plan',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://pikaplanner.vercel.app/blog/${post.slug}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="min-h-screen bg-[#f8faf8] font-poppins">
        {/* Hero cover */}
        <div className="relative aspect-[21/9] sm:aspect-[16/6] overflow-hidden">
          <CoverImage title={post.title} category={post.category} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>

        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-10 pb-16">
          {/* Header card */}
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10 mb-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#126e3d] mb-5 transition"
            >
              <ArrowLeft size={14} /> Back to all articles
            </Link>

            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-4"
              style={{ backgroundColor: category.bg, color: category.color }}
            >
              {category.label}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
              {post.title}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
              {post.excerpt}
            </p>

            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-[#126e3d] text-xs font-black">
                  {post.author.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-700">{post.author.name}</p>
                  <p className="text-xs text-gray-500">{post.author.role}</p>
                </div>
              </div>
              <span className="text-gray-300">·</span>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} /> {formatDate(post.publishedAt)}
              </div>
              <span className="text-gray-300">·</span>
              <div className="flex items-center gap-1.5">
                <Clock size={12} /> {post.readTime} min read
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-10">
            <div className="prose prose-slate max-w-none">
              {post.content.map((block, i) => (
                <ContentBlock key={i} block={block} accentColor={category.color} />
              ))}
            </div>

            {/* Tags */}
            <div className="mt-10 pt-6 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${tag}`}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-bold text-slate-700 hover:bg-[#f0fdf4] hover:text-[#126e3d] transition"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Share */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Share2 size={12} /> Share
              </span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} — https://pikaplanner.vercel.app/blog/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#126e3d] text-xs font-bold hover:bg-emerald-100 transition"
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://pikaplanner.vercel.app/blog/${post.slug}`)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold hover:bg-sky-100 transition"
              >
                Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://pikaplanner.vercel.app/blog/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition"
              >
                Facebook
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(`I thought you'd enjoy this: https://pikaplanner.vercel.app/blog/${post.slug}`)}`}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-slate-700 text-xs font-bold hover:bg-gray-200 transition"
              >
                Email
              </a>
            </div>
          </div>

          {/* Author bio */}
          <div className="mt-10 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#32CD32] to-[#1A5C3A] text-white text-2xl font-black flex-shrink-0">
                {post.author.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-wider text-[#126e3d] mb-1">
                  About the author
                </p>
                <h3 className="font-black text-slate-900 text-lg">{post.author.name}</h3>
                <p className="text-xs text-gray-500 font-semibold">{post.author.role}</p>
                {post.author.bio && (
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">{post.author.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <div className="mt-12">
              <div className="flex items-end justify-between mb-5">
                <h2 className="text-xl font-black text-slate-900">Related articles</h2>
                <Link href="/blog" className="text-xs font-bold text-[#126e3d] hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((p) => {
                  const rCat = getCategoryMeta(p.category)
                  return (
                    <Link
                      key={p.slug}
                      href={`/blog/${p.slug}`}
                      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      <div className="relative aspect-video">
                        <CoverImage title={p.title} category={p.category} />
                      </div>
                      <div className="p-4">
                        <span
                          className="text-[9px] font-black uppercase tracking-wider"
                          style={{ color: rCat.color }}
                        >
                          {rCat.label}
                        </span>
                        <h4 className="mt-2 font-black text-slate-900 text-sm leading-tight line-clamp-2 group-hover:text-[#126e3d] transition">
                          {p.title}
                        </h4>
                        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
                          <Clock size={10} /> {p.readTime}m read
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </>
  )
}

// ── Content Block Renderer ─────────────────────────────────
function ContentBlock({
  block,
  accentColor,
}: {
  block: BlogContent
  accentColor: string
}) {
  switch (block.type) {
    case 'heading':
      return block.level === 2 ? (
        <h2 className="text-2xl font-black text-slate-900 mt-8 mb-4">{block.text}</h2>
      ) : (
        <h3 className="text-xl font-black text-slate-900 mt-6 mb-3">{block.text}</h3>
      )
    case 'paragraph':
      return <p className="text-base text-gray-700 leading-relaxed mb-4">{block.text}</p>
    case 'image':
      return null // Skipping inline images entirely to avoid timeouts
    case 'quote':
      return (
        <blockquote
          className="my-6 pl-6 border-l-4 italic text-lg text-slate-700 leading-relaxed"
          style={{ borderColor: accentColor }}
        >
          “{block.text}”
          {block.author && (
            <footer className="mt-2 text-sm text-gray-500 not-italic">— {block.author}</footer>
          )}
        </blockquote>
      )
    case 'list':
      return block.ordered ? (
        <ol className="my-4 space-y-2 list-decimal pl-5">
          {block.items.map((item, i) => (
            <li key={i} className="text-base text-gray-700 leading-relaxed">{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="my-4 space-y-2 list-disc pl-5">
          {block.items.map((item, i) => (
            <li key={i} className="text-base text-gray-700 leading-relaxed">{item}</li>
          ))}
        </ul>
      )
    case 'callout': {
      const Icon = block.variant === 'warning' ? AlertTriangle : block.variant === 'info' ? Info : Lightbulb
      const colors =
        block.variant === 'warning'
          ? { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', text: '#991b1b' }
          : block.variant === 'info'
            ? { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1e40af' }
            : { bg: '#fff7ed', border: '#fed7aa', icon: '#f97316', text: '#9a3412' }
      return (
        <div
          className="my-6 flex items-start gap-3 rounded-xl border p-4"
          style={{ backgroundColor: colors.bg, borderColor: colors.border }}
        >
          <Icon size={18} className="flex-shrink-0 mt-0.5" style={{ color: colors.icon }} />
          <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
            {block.variant === 'warning' && <strong>Heads up: </strong>}
            {block.variant === 'info' && <strong>Note: </strong>}
            {block.variant === 'tip' && <strong>Pro tip: </strong>}
            {block.text}
          </p>
        </div>
      )
    }
    case 'cta':
      return (
        <div className="my-8 rounded-2xl bg-gradient-to-br from-[#0a2d1d] via-[#126e3d] to-[#1A5C3A] text-white p-6 sm:p-8 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#32CD32]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider mb-3 backdrop-blur">
              <Sparkles size={11} className="text-[#32CD32]" />
              Try it now
            </div>
            <h3 className="text-xl font-black mb-2">{block.title}</h3>
            <p className="text-sm text-white/80 mb-5 leading-relaxed">{block.description}</p>
            <Link
              href={block.href}
              className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] px-6 py-3 text-sm font-black uppercase text-white shadow-md transition"
            >
              {block.label} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )
    default:
      return null
  }
}