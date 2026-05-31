import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type ResultItem = {
  text: string
  source_url: string
  reddit_score: number
  subreddit: string
  category?: string
}

type Intel = {
  query: string
  total_posts_scanned: number
  subreddits_searched: string[]
  expanded: boolean
  pricing: ResultItem[]
  complaints: ResultItem[]
  comparisons: ResultItem[]
  praise: ResultItem[]
  quotes: ResultItem[]
}

type Tab = 'pricing' | 'complaints' | 'comparisons' | 'praise' | 'quotes'

const TAB_LABELS: Record<Tab, string> = {
  pricing: '💰 Pricing',
  complaints: '😤 Complaints',
  comparisons: '⚖️ Comparisons',
  praise: '💚 Praise',
  quotes: '💬 Quotes',
}

function ResultCard({ item }: { item: ResultItem }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
      <p className="text-gray-800 text-sm leading-relaxed">{item.text}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
        <span>{item.subreddit}</span>
        {item.reddit_score > 0 && <span>▲ {item.reddit_score}</span>}
        {item.category && (
          <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded">
            {item.category}
          </span>
        )}
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-orange-500 hover:underline"
        >
          view thread →
        </a>
      </div>
    </div>
  )
}

type Draft = { draft: string; word_count: number; tone: string }

export default function App() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [intel, setIntel] = useState<Intel | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('quotes')
  const [copied, setCopied] = useState(false)

  // Notepad state
  const [idea, setIdea] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [draftError, setDraftError] = useState('')
  const [draftCopied, setDraftCopied] = useState(false)

  // Comment generator state
  const [postText, setPostText] = useState('')
  const [intent, setIntent] = useState('')
  const [commenting, setCommenting] = useState(false)
  const [comment, setComment] = useState<Draft | null>(null)
  const [commentError, setCommentError] = useState('')
  const [commentCopied, setCommentCopied] = useState(false)

  // Auto-search from URL param: ?q=Notion
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      setQuery(q)
      doSearch(q)
    }
  }, [])

  async function doSearch(q: string, expand = false) {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    if (!expand) setIntel(null)
    try {
      const res = await fetch(`${API}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, expand }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Search failed')
      }
      const data = await res.json()
      setIntel(data)
      window.history.replaceState({}, '', `?q=${encodeURIComponent(q)}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Expand-search preview shows when results are thin and we haven't expanded yet
  const EXPAND_QUERIES = [
    'worth it honest',
    'vs alternative',
    'experience after months',
    'stopped using cancelled',
    'is good or bad',
  ]
  const showExpandPreview =
    intel && !intel.expanded && intel.total_posts_scanned < 15

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function generateDraft() {
    if (!idea.trim()) return
    setDrafting(true)
    setDraftError('')
    setDraft(null)
    try {
      // Use top quotes as tone context if we have intel
      const context_snippets = intel
        ? intel.quotes.slice(0, 5).map(q => q.text)
        : null
      const res = await fetch(`${API}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, context_snippets }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Draft failed')
      }
      setDraft(await res.json())
    } catch (e: unknown) {
      setDraftError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setDrafting(false)
    }
  }

  function copyDraft() {
    if (!draft) return
    navigator.clipboard.writeText(draft.draft)
    setDraftCopied(true)
    setTimeout(() => setDraftCopied(false), 2000)
  }

  async function generateComment() {
    if (!postText.trim() || !intent.trim()) return
    setCommenting(true)
    setCommentError('')
    setComment(null)
    try {
      const res = await fetch(`${API}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: postText, intent }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Comment failed')
      }
      setComment(await res.json())
    } catch (e: unknown) {
      setCommentError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setCommenting(false)
    }
  }

  function copyComment() {
    if (!comment) return
    navigator.clipboard.writeText(comment.draft)
    setCommentCopied(true)
    setTimeout(() => setCommentCopied(false), 2000)
  }

  const activeResults = intel ? intel[activeTab] : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">🔍 Redditscan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Reddit, but focus mode — pricing, complaints, comparisons, no noise.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Search bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(query)}
            placeholder="Enter a product name (e.g. Notion, Linear, Salesforce)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={() => doSearch(query)}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Scanning...' : 'Scan Reddit'}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        {intel && (
          <div className="mt-6">
            {/* Meta + share */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Scanned <strong>{intel.total_posts_scanned}</strong> posts for{' '}
                <strong>"{intel.query}"</strong>
              </p>
              <button
                onClick={handleShare}
                className="text-sm text-orange-500 hover:underline"
              >
                {copied ? '✓ Copied!' : 'Share results ↗'}
              </button>
            </div>

            {/* Expand search preview */}
            {showExpandPreview && (
              <div className="mb-4 border border-orange-200 bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-gray-800 font-medium">
                  Only {intel.total_posts_scanned} posts found — want a wider net?
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Expanding runs 5 more searches:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {EXPAND_QUERIES.map(q => (
                    <span
                      key={q}
                      className="text-xs bg-white border border-orange-200 text-orange-700 px-2 py-0.5 rounded"
                    >
                      "{intel.query} {q}"
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => doSearch(intel.query, true)}
                  disabled={loading}
                  className="mt-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Expanding...' : 'Expand search →'}
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-gray-200">
              {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {TAB_LABELS[tab]} <span className="text-xs">({intel[tab].length})</span>
                </button>
              ))}
            </div>

            {/* Results */}
            {activeResults.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                No {activeTab} found for this product.
              </p>
            ) : (
              <div className="space-y-3">
                {activeResults.map((item, i) => (
                  <ResultCard key={i} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notepad — always visible */}
        <div className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold text-gray-900">📝 Notepad</h2>
          <p className="text-sm text-gray-500 mt-1">
            Drop a 2-line idea. We'll draft a Reddit-style post that sounds human.
            {intel && ' Tone will match the quotes above.'}
          </p>

          <textarea
            value={idea}
            onChange={e => setIdea(e.target.value)}
            placeholder="e.g. I switched from Notion to Obsidian after 6 months — speed killed it for me"
            rows={3}
            className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {idea.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <button
              onClick={generateDraft}
              disabled={drafting || !idea.trim()}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {drafting ? 'Drafting...' : 'Generate post →'}
            </button>
          </div>

          {draftError && (
            <p className="mt-3 text-sm text-red-500">{draftError}</p>
          )}

          {draft && (
            <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-white">
              <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                {draft.draft}
              </p>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500">
                <span>{draft.word_count} words</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  tone: {draft.tone}
                </span>
                <button
                  onClick={copyDraft}
                  className="ml-auto text-orange-500 hover:underline"
                >
                  {draftCopied ? '✓ Copied!' : 'Copy draft ↗'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Comment generator */}
        <div className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold text-gray-900">💬 Reply to a post</h2>
          <p className="text-sm text-gray-500 mt-1">
            Paste a Reddit post + what you want to say. We draft a comment that fits.
          </p>

          <label className="block mt-4 text-xs font-medium text-gray-600">
            The Reddit post
          </label>
          <textarea
            value={postText}
            onChange={e => setPostText(e.target.value)}
            placeholder="Paste the post you want to reply to..."
            rows={4}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />

          <label className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-600">
            What you want to say
            <span className="relative group inline-flex items-center">
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-gray-400 text-[10px] font-bold cursor-help hover:bg-gray-100 hover:text-gray-600"
                aria-label="help"
              >
                ?
              </span>
              <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 hidden group-hover:block whitespace-nowrap bg-gray-900 text-white text-xs font-normal rounded px-2 py-1 shadow-lg z-10">
                Explain your comment in 1–2 lines
              </span>
            </span>
          </label>
          <textarea
            value={intent}
            onChange={e => setIntent(e.target.value)}
            placeholder="e.g. agree, mention I switched to Obsidian and it loads instantly"
            rows={2}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />

          <div className="mt-2 flex items-center justify-end">
            <button
              onClick={generateComment}
              disabled={commenting || !postText.trim() || !intent.trim()}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {commenting ? 'Drafting...' : 'Generate comment →'}
            </button>
          </div>

          {commentError && (
            <p className="mt-3 text-sm text-red-500">{commentError}</p>
          )}

          {comment && (
            <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-white">
              <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                {comment.draft}
              </p>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500">
                <span>{comment.word_count} words</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  tone: {comment.tone}
                </span>
                <button
                  onClick={copyComment}
                  className="ml-auto text-orange-500 hover:underline"
                >
                  {commentCopied ? '✓ Copied!' : 'Copy comment ↗'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
