import { useState, useEffect } from 'react'

const API = 'http://localhost:8000'

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
  pricing: ResultItem[]
  complaints: ResultItem[]
  comparisons: ResultItem[]
  quotes: ResultItem[]
}

type Tab = 'pricing' | 'complaints' | 'comparisons' | 'quotes'

const TAB_LABELS: Record<Tab, string> = {
  pricing: '💰 Pricing',
  complaints: '😤 Complaints',
  comparisons: '⚖️ Comparisons',
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

export default function App() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [intel, setIntel] = useState<Intel | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('quotes')
  const [copied, setCopied] = useState(false)

  // Auto-search from URL param: ?q=Notion
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      setQuery(q)
      doSearch(q)
    }
  }, [])

  async function doSearch(q: string) {
    if (!q.trim()) return
    setLoading(true)
    setError('')
    setIntel(null)
    try {
      const res = await fetch(`${API}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
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

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeResults = intel ? intel[activeTab] : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">🔍 Redditscan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real pricing, honest complaints, and comparisons from Reddit
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
      </div>
    </div>
  )
}
