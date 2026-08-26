# Redditscan

> **Reddit, but focus mode.**

Same Reddit. Noise stripped. No jokes, no "this!", no 200-comment tangents — just the sentences with money in them, the complaints, the comparisons, the praise.

```
Search: "Notion vs Asana"
→ 💰 Pricing       the sentences with $/mo in them
→ 😤 Complaints    what people actually hate
→ ⚖️ Comparisons   "I switched from X to Y because…"
→ 💚 Praise        the rare honest love
→ 💬 Quotes        top post titles, ranked
```

Only comparison queries ("X vs Y") are accepted — it's built for head-to-head research, not general Reddit search.

## Who it's for

PMs doing competitor research. Founders pricing a product. GTM folks writing positioning. Sales reps prepping for a call.

Anyone who'd otherwise be Ctrl+F'ing through 15 Reddit threads at 11pm.

## Stack

- **Frontend**: React + Vite + Tailwind v4
- **Backend**: FastAPI (Python)
- **Auth**: Supabase (magic-link email sign-in)
- **Crawler**: httpx → [Serper.dev](https://serper.dev) (Google Search API, 2500 free searches)
- **Extraction**: pure regex — pricing, complaints, comparisons, quotes
- **Drafter**: OpenAI gpt-4o-mini (~$0.00003 per draft)
- **Scheduling**: [Zernio](https://zernio.com) (BYOK — each user connects their own API key in Settings)
- **Onboarding email**: [Resend](https://resend.com), triggered via a Supabase database webhook on signup

> **Why not the Reddit API?** Reddit's [Responsible Builder Policy](https://www.reddit.com/r/redditdev/comments/1oug31u/introducing_the_responsible_builder_policy_new/) (Nov 2025) gated self-serve API access behind manual approval. We hit Reddit through Google search results instead — no keys, no waiting list.

## Quick start

**Prereqs:** Python 3.10+, Node 18+, a free [Serper.dev](https://serper.dev) API key, an OpenAI API key, and a [Supabase](https://supabase.com) project (free tier).

```bash
git clone https://github.com/chaitanyagatreddi/Redditscan.git
cd Redditscan
```

**1. Backend**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# fill in SERPER_API_KEY, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY — RESEND_API_KEY and WEBHOOK_SECRET are optional
# (only needed for the onboarding email)
uvicorn main:app --reload --port 8000
```

**2. Frontend** (in a new terminal)

```bash
cd frontend
npm install
# create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Open `http://localhost:5173` and search a comparison (e.g. `Notion vs Asana`). Anonymous users get 3 free searches before sign-in is required.

To schedule posts to Reddit, connect a [Zernio](https://zernio.com) API key under **Settings** after signing in.

Share a result by clicking **Share results ↗** — the URL includes `?q=<product>` and auto-runs the search when opened.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system diagram.

## Features

| Feature | What it does |
|---------|-------------|
| 💰 Pricing | Sentences with `$/mo`, `per seat`, free tier mentions |
| 😤 Complaints | Categorized: performance, support, pricing, features, switching |
| ⚖️ Comparisons | "vs", "switched from", "alternative to" phrases |
| 💚 Praise | Rare positive sentiment — "worth it", "game changer", etc. |
| 💬 Quotes | Top Reddit post titles for the query |
| 🔗 Shareable | `?q=<product>` URL auto-runs the search |
| ✍️ Drafting | Generate a Reddit/HN-style post or comment, tone-matched to scan results |
| 📅 Scheduling | Schedule drafted posts to Reddit via your own connected Zernio account |
| 🔐 Auth | Email magic-link sign-in (Supabase) — 3 free anonymous searches, then sign-in required |

## Roadmap

- [x] v1 — focus-mode intel extraction (pricing, complaints, comparisons, praise, quotes)
- [ ] v1.1 — better extractors (LLM-assisted, optional)
- [ ] v2 — multi-product comparison view (paste 3 products, get a matrix)

## Contributing

PRs welcome. See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the pieces fit.

## License

MIT
