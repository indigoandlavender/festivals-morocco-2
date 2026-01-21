# Morocco Events Search Engine

Vertical search engine for festivals and music events in Morocco.

Entity-centric. Search-first. Built for long-term authority and machine readability.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   SOURCES                 CORE                    OUTPUT             │
│   ───────                 ────                    ──────             │
│                                                                      │
│   Eventbrite ─┐                                                      │
│   Songkick ───┼──► Ingestion ──► PostgreSQL ──► Typesense           │
│   Manual ─────┤         │              │              │              │
│   Scrapes ────┘         │              │              │              │
│                         ▼              │              ▼              │
│                   Deduplication        │         REST API            │
│                         │              │              │              │
│                         ▼              │              ▼              │
│                   Confidence           │         Astro SSG           │
│                   Scoring              │              │              │
│                                        │              ▼              │
│                                        └────────► CDN (Cloudflare)   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
morocco-events-search/
├── docs/
│   ├── 01-architecture.md      # System architecture
│   ├── 02-ingestion-pipeline.md # Data ingestion & deduplication
│   ├── 03-url-page-strategy.md  # SEO & page routing
│   └── 04-editorial-layer.md    # Admin controls
├── schema/
│   ├── database.sql            # PostgreSQL schema
│   └── typesense-schema.json   # Search index schema
├── src/
│   ├── api/
│   │   └── routes.ts           # API endpoints
│   ├── search/
│   │   └── indexer.ts          # Typesense sync
│   └── types.ts                # TypeScript definitions
├── examples/
│   ├── event-response.json     # Sample API response
│   └── EventPage.astro         # Sample page component
└── README.md
```

---

## Tech Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Database | PostgreSQL 16 | ACID, JSON support, 10+ year stability |
| Search | Typesense | Low-ops, typo-tolerant, strict schema |
| Backend | Node.js + Fastify | Fast, typed, minimal deps |
| Frontend | Astro | Static-first, partial hydration |
| Hosting | Hetzner VPS | Cost-effective (~€13/mo total) |
| CDN | Cloudflare | Free tier, edge caching |

---

## Core Entities

| Entity | Purpose |
|--------|---------|
| Event | Core entity - concerts, festivals, showcases |
| City | Location within regions |
| Region | 12 administrative regions of Morocco |
| Venue | Physical locations |
| Artist | Performers |
| Genre | Categorization (Gnawa, Chaabi, Jazz, etc.) |
| Organizer | Event producers |
| Source | Data provenance |

---

## API Routes

```
GET /api/search              # Full-text search with facets
GET /api/events              # List upcoming events
GET /api/events/:slug        # Event detail
GET /api/festivals           # List festivals only
GET /api/cities              # List cities with event counts
GET /api/cities/:slug        # City detail with events
GET /api/regions             # List regions
GET /api/genres              # List genres with event counts
GET /api/calendar/:year/:mo  # Events by month
GET /api/artists/:slug       # Artist detail with events
GET /api/health              # Health check
```

---

## Page Routes

```
/                            # Homepage (search entry)
/events                      # Event listing
/events/{slug}               # Event detail
/festivals/{slug}            # Festival detail
/cities/{slug}               # Events in city
/regions/{slug}              # Events in region
/genres/{slug}               # Events by genre
/calendar/{year}/{month}     # Monthly view
/artists/{slug}              # Artist events
```

---

## Data Model (Key Tables)

```sql
events
├── id, name, slug
├── event_type (festival|concert|showcase|ritual|conference)
├── start_date, end_date
├── city_id → cities
├── region_id → regions
├── venue_id → venues (nullable)
├── organizer_id → organizers (nullable)
├── status (announced|confirmed|cancelled|archived)
├── confidence_score (0.00-1.00)
├── is_verified, is_pinned, cultural_significance
└── last_verified_at, created_at, updated_at

event_artists (N:M)
event_genres (N:M)
event_sources (N:M, provenance)
event_ticket_urls (1:N)
```

---

## Confidence Scoring

```
confidence = (
    0.35 × source_reliability +
    0.25 × data_completeness +
    0.20 × source_agreement +
    0.10 × recency +
    0.10 × historical_accuracy
)
```

---

## Editorial Controls

- **Verify**: Mark event as editorially confirmed
- **Pin**: Promote to top of listings
- **Set significance**: 0-10 cultural importance score
- **Update status**: Manually set announced/confirmed/cancelled
- **Merge**: Combine duplicate events
- **Archive**: Remove from active listings

No comments. No ratings. No social features.

---

## Schema.org Markup

Every event page includes structured data:

```json
{
  "@type": "Festival",
  "name": "...",
  "startDate": "2025-06-26",
  "location": { "@type": "Place", ... },
  "performer": [...],
  "offers": { "@type": "Offer", ... }
}
```

---

## Deduplication Strategy

1. **Fingerprint matching**: SHA256 of normalized (name + date + city)
2. **Fuzzy name matching**: Jaro-Winkler similarity ≥ 0.85
3. **Date-location matching**: Same city + overlapping dates
4. **Manual review**: Confidence < 0.70 flagged for review

---

## What This Is Not

- Not a blog
- Not a tourism calendar
- Not a static list
- Not a social platform
- Not a review site

---

## Principles

1. Search-first, not UI-first
2. Structured data over prose
3. Every page answers a query
4. Editorial authority over volume
5. Crawlable, indexable, boring in a good way

---

## Infrastructure Estimate

```
Hetzner CX31 (4 vCPU, 8GB): €8.50/mo
Hetzner Storage Box (100GB): €3.50/mo
Cloudflare: €0
Domain: ~€1/mo

Total: ~€13/month
```

Supports ~100k events, ~1M searches/month.

---

## Next Steps

1. Set up PostgreSQL with schema
2. Deploy Typesense
3. Build ingestion adapters (Eventbrite first)
4. Implement API routes
5. Generate static pages with Astro
6. Configure Cloudflare CDN
7. Seed with known festivals (Gnaoua, Mawazine, Timitar, etc.)
