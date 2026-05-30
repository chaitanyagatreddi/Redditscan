# Redditscan

> **Reddit, but focus mode.**

Same Reddit. Noise stripped. No jokes, no "this!", no 200-comment tangents — just the sentences with money in them, the complaints, the comparisons, the praise.

```
Search: "Notion"
→ 💰 Pricing       the sentences with $/mo in them
→ 😤 Complaints    what people actually hate
→ ⚖️ Comparisons   "I switched from X to Y because…"
→ 💚 Praise        the rare honest love
→ 💬 Quotes        top post titles, ranked
```

## Who it's for

PMs doing competitor research. Founders pricing a product. GTM folks writing positioning. Sales reps prepping for a call.

Anyone who'd otherwise be Ctrl+F'ing through 15 Reddit threads at 11pm.

## Stack

- **Frontend**: React + Vite + Tailwind v4
- **Backend**: FastAPI (Python)
- **Crawler**: httpx → [Serper.dev](https://serper.dev) (Google Search API, 2500 free searches)
- **Extraction**: pure regex — pricing, complaints, comparisons, quotes
- **Drafter**: OpenAI gpt-4o-mini (~$0.00003 per draft)

> **Why not the Reddit API?** Reddit's [Responsible Builder Policy](https://www.reddit.com/r/redditdev/comments/1oug31u/introducing_the_responsible_builder_policy_new/) (Nov 2025) gated self-serve API access behind manual approval. We hit Reddit through Google search results instead — no keys, no waiting list.

## Quick start

**Prereqs:** Python 3.10+, Node 18+, and a free [Serper.dev](https://serper.dev) API key (sign in with Google).

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
# open .env and paste your SERPER_API_KEY
uvicorn main:app --reload --port 8000
```

**2. Frontend** (in a new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and search a product (e.g. `Notion`, `Linear`, `Salesforce`).

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

## Roadmap

- [x] v1 — focus-mode intel extraction (pricing, complaints, comparisons, praise, quotes)
- [ ] v1.1 — better extractors (LLM-assisted, optional)
- [ ] v2 — multi-product comparison view (paste 3 products, get a matrix)

## Contributing

PRs welcome. See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the pieces fit.

## License

MIT
