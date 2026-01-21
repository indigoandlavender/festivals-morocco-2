-- Morocco Events Search Engine
-- PostgreSQL 16+ Schema
--
-- Principles:
-- - Normalized structure, no content blobs
-- - Explicit foreign keys
-- - Temporal tracking on all mutable entities
-- - Provenance preserved for all data

-- ============================================================================
-- REFERENCE TABLES (Static/Semi-static)
-- ============================================================================

CREATE TABLE regions (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    name_ar         VARCHAR(100),
    name_fr         VARCHAR(100),
    slug            VARCHAR(100) NOT NULL UNIQUE,
    geo_center      POINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cities (
    id              SERIAL PRIMARY KEY,
    region_id       SMALLINT NOT NULL REFERENCES regions(id),
    name            VARCHAR(100) NOT NULL,
    name_ar         VARCHAR(100),
    name_fr         VARCHAR(100),
    slug            VARCHAR(100) NOT NULL UNIQUE,
    geo_location    POINT,
    population      INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(region_id, name)
);

CREATE TABLE genres (
    id              SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,
    slug            VARCHAR(50) NOT NULL UNIQUE,
    parent_id       SMALLINT REFERENCES genres(id),
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE venues (
    id              SERIAL PRIMARY KEY,
    city_id         INTEGER NOT NULL REFERENCES cities(id),
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) NOT NULL,
    address         TEXT,
    geo_location    POINT,
    capacity        INTEGER,
    venue_type      VARCHAR(50), -- stadium, theater, outdoor, club, etc.
    website         VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(city_id, slug)
);

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

CREATE TYPE event_type AS ENUM (
    'festival',
    'concert',
    'showcase',
    'ritual',
    'conference'
);

CREATE TYPE event_status AS ENUM (
    'announced',
    'confirmed',
    'cancelled',
    'postponed',
    'archived'
);

CREATE TABLE organizers (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) NOT NULL UNIQUE,
    website         VARCHAR(500),
    email           VARCHAR(200),
    verified        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE artists (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) NOT NULL UNIQUE,
    country         CHAR(2), -- ISO 3166-1 alpha-2
    bio             TEXT,
    website         VARCHAR(500),
    spotify_id      VARCHAR(50),
    musicbrainz_id  UUID,
    image_url       VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE artist_genres (
    artist_id       INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    genre_id        SMALLINT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (artist_id, genre_id)
);

CREATE TABLE events (
    id              SERIAL PRIMARY KEY,

    -- Identity
    name            VARCHAR(300) NOT NULL,
    slug            VARCHAR(300) NOT NULL UNIQUE,
    event_type      event_type NOT NULL,

    -- Temporal
    start_date      DATE NOT NULL,
    end_date        DATE,
    start_time      TIME,
    doors_time      TIME,

    -- Location
    city_id         INTEGER NOT NULL REFERENCES cities(id),
    region_id       SMALLINT NOT NULL REFERENCES regions(id),
    venue_id        INTEGER REFERENCES venues(id),

    -- Organization
    organizer_id    INTEGER REFERENCES organizers(id),

    -- Content
    description     TEXT,
    official_website VARCHAR(500),

    -- Status & Trust
    status          event_status NOT NULL DEFAULT 'announced',
    confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Editorial flags
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
    cultural_significance SMALLINT NOT NULL DEFAULT 0 CHECK (cultural_significance >= 0 AND cultural_significance <= 10),

    -- Timestamps
    last_verified_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Event-to-many relationships
CREATE TABLE event_artists (
    event_id        INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    artist_id       INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    billing_order   SMALLINT, -- 1 = headliner, 2 = co-headliner, etc.
    set_time        TIME,
    PRIMARY KEY (event_id, artist_id)
);

CREATE TABLE event_genres (
    event_id        INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    genre_id        SMALLINT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (event_id, genre_id)
);

CREATE TABLE event_ticket_urls (
    id              SERIAL PRIMARY KEY,
    event_id        INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    url             VARCHAR(500) NOT NULL,
    provider        VARCHAR(100), -- ticketmaster, eventbrite, official, etc.
    price_min       DECIMAL(10,2),
    price_max       DECIMAL(10,2),
    currency        CHAR(3) DEFAULT 'MAD',
    is_official     BOOLEAN NOT NULL DEFAULT FALSE,
    last_checked_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PROVENANCE & INGESTION
-- ============================================================================

CREATE TYPE source_type AS ENUM (
    'official_website',
    'eventbrite_api',
    'songkick_api',
    'bandsintown_api',
    'manual_entry',
    'scrape',
    'csv_import'
);

CREATE TABLE sources (
    id              SERIAL PRIMARY KEY,
    source_type     source_type NOT NULL,
    name            VARCHAR(200) NOT NULL,
    base_url        VARCHAR(500),
    reliability_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_fetch_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_sources (
    id              SERIAL PRIMARY KEY,
    event_id        INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    source_id       INTEGER NOT NULL REFERENCES sources(id),
    external_id     VARCHAR(200), -- ID in the source system
    source_url      VARCHAR(500) NOT NULL,
    raw_data        JSONB, -- Original data as received
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(event_id, source_id, external_id)
);

-- ============================================================================
-- DEDUPLICATION SUPPORT
-- ============================================================================

CREATE TABLE event_candidates (
    id              SERIAL PRIMARY KEY,

    -- Raw ingested data
    raw_name        VARCHAR(300) NOT NULL,
    raw_start_date  DATE NOT NULL,
    raw_end_date    DATE,
    raw_city        VARCHAR(100),
    raw_venue       VARCHAR(200),
    raw_data        JSONB NOT NULL,

    -- Source tracking
    source_id       INTEGER NOT NULL REFERENCES sources(id),
    external_id     VARCHAR(200),
    source_url      VARCHAR(500),

    -- Processing status
    processed       BOOLEAN NOT NULL DEFAULT FALSE,
    matched_event_id INTEGER REFERENCES events(id),
    match_confidence DECIMAL(3,2),

    -- Timestamps
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMPTZ
);

-- Fingerprints for fast deduplication lookups
CREATE TABLE event_fingerprints (
    event_id        INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    fingerprint     VARCHAR(64) NOT NULL, -- SHA256 of normalized (name + date + city)
    fingerprint_type VARCHAR(20) NOT NULL, -- 'exact', 'fuzzy_name', 'date_location'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (event_id, fingerprint_type)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Events: Primary query patterns
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_city ON events(city_id);
CREATE INDEX idx_events_region ON events(region_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_confidence ON events(confidence_score DESC);
CREATE INDEX idx_events_upcoming ON events(start_date) WHERE status IN ('announced', 'confirmed') AND start_date >= CURRENT_DATE;

-- Compound indexes for common queries
CREATE INDEX idx_events_region_date ON events(region_id, start_date);
CREATE INDEX idx_events_city_date ON events(city_id, start_date);
CREATE INDEX idx_events_type_date ON events(event_type, start_date);

-- Full-text search support (fallback, primary search via Typesense)
CREATE INDEX idx_events_name_trgm ON events USING gin(name gin_trgm_ops);
CREATE INDEX idx_artists_name_trgm ON artists USING gin(name gin_trgm_ops);

-- Deduplication indexes
CREATE INDEX idx_fingerprints_lookup ON event_fingerprints(fingerprint);
CREATE INDEX idx_candidates_unprocessed ON event_candidates(processed, ingested_at) WHERE NOT processed;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER artists_updated_at BEFORE UPDATE ON artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER organizers_updated_at BEFORE UPDATE ON organizers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-archive past events
CREATE OR REPLACE FUNCTION archive_past_events()
RETURNS void AS $$
BEGIN
    UPDATE events
    SET status = 'archived'
    WHERE status IN ('announced', 'confirmed')
    AND COALESCE(end_date, start_date) < CURRENT_DATE - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA: Morocco Regions
-- ============================================================================

INSERT INTO regions (name, name_fr, name_ar, slug) VALUES
    ('Tanger-Tetouan-Al Hoceima', 'Tanger-Tétouan-Al Hoceïma', 'طنجة-تطوان-الحسيمة', 'tanger-tetouan-al-hoceima'),
    ('Oriental', 'Oriental', 'الشرق', 'oriental'),
    ('Fes-Meknes', 'Fès-Meknès', 'فاس-مكناس', 'fes-meknes'),
    ('Rabat-Sale-Kenitra', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 'rabat-sale-kenitra'),
    ('Beni Mellal-Khenifra', 'Béni Mellal-Khénifra', 'بني ملال-خنيفرة', 'beni-mellal-khenifra'),
    ('Casablanca-Settat', 'Casablanca-Settat', 'الدار البيضاء-سطات', 'casablanca-settat'),
    ('Marrakech-Safi', 'Marrakech-Safi', 'مراكش-آسفي', 'marrakech-safi'),
    ('Draa-Tafilalet', 'Drâa-Tafilalet', 'درعة-تافيلالت', 'draa-tafilalet'),
    ('Souss-Massa', 'Souss-Massa', 'سوس-ماسة', 'souss-massa'),
    ('Guelmim-Oued Noun', 'Guelmim-Oued Noun', 'كلميم-واد نون', 'guelmim-oued-noun'),
    ('Laayoune-Sakia El Hamra', 'Laâyoune-Sakia El Hamra', 'العيون-الساقية الحمراء', 'laayoune-sakia-el-hamra'),
    ('Dakhla-Oued Ed Dahab', 'Dakhla-Oued Ed-Dahab', 'الداخلة-وادي الذهب', 'dakhla-oued-ed-dahab');

-- Major cities (subset)
INSERT INTO cities (region_id, name, name_fr, slug, geo_location) VALUES
    (1, 'Tangier', 'Tanger', 'tangier', POINT(-5.8128, 35.7595)),
    (1, 'Tetouan', 'Tétouan', 'tetouan', POINT(-5.3684, 35.5889)),
    (2, 'Oujda', 'Oujda', 'oujda', POINT(-1.9086, 34.6867)),
    (3, 'Fes', 'Fès', 'fes', POINT(-5.0003, 34.0181)),
    (3, 'Meknes', 'Meknès', 'meknes', POINT(-5.5547, 33.8935)),
    (4, 'Rabat', 'Rabat', 'rabat', POINT(-6.8498, 34.0209)),
    (4, 'Sale', 'Salé', 'sale', POINT(-6.7985, 34.0531)),
    (4, 'Kenitra', 'Kénitra', 'kenitra', POINT(-6.5802, 34.2610)),
    (6, 'Casablanca', 'Casablanca', 'casablanca', POINT(-7.5898, 33.5731)),
    (6, 'El Jadida', 'El Jadida', 'el-jadida', POINT(-8.5007, 33.2316)),
    (7, 'Marrakech', 'Marrakech', 'marrakech', POINT(-7.9811, 31.6295)),
    (7, 'Essaouira', 'Essaouira', 'essaouira', POINT(-9.7595, 31.5085)),
    (8, 'Ouarzazate', 'Ouarzazate', 'ouarzazate', POINT(-6.8936, 30.9189)),
    (8, 'Errachidia', 'Errachidia', 'errachidia', POINT(-4.4266, 31.9314)),
    (9, 'Agadir', 'Agadir', 'agadir', POINT(-9.5981, 30.4278));

-- Core genres
INSERT INTO genres (name, slug, parent_id) VALUES
    ('Gnawa', 'gnawa', NULL),
    ('Chaabi', 'chaabi', NULL),
    ('Andalusian', 'andalusian', NULL),
    ('Amazigh', 'amazigh', NULL),
    ('Rai', 'rai', NULL),
    ('Electronic', 'electronic', NULL),
    ('Hip Hop', 'hip-hop', NULL),
    ('Jazz', 'jazz', NULL),
    ('World Music', 'world-music', NULL),
    ('Rock', 'rock', NULL),
    ('Classical', 'classical', NULL),
    ('Sufi', 'sufi', NULL),
    ('Reggae', 'reggae', NULL),
    ('Afrobeat', 'afrobeat', NULL),
    ('Folk', 'folk', NULL);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Upcoming events with full context
CREATE VIEW v_upcoming_events AS
SELECT
    e.id,
    e.name,
    e.slug,
    e.event_type,
    e.start_date,
    e.end_date,
    e.status,
    e.confidence_score,
    e.is_verified,
    e.is_pinned,
    e.cultural_significance,
    c.name AS city_name,
    c.slug AS city_slug,
    r.name AS region_name,
    r.slug AS region_slug,
    v.name AS venue_name,
    o.name AS organizer_name,
    e.official_website,
    ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) AS genres,
    ARRAY_AGG(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) AS artists
FROM events e
JOIN cities c ON e.city_id = c.id
JOIN regions r ON e.region_id = r.id
LEFT JOIN venues v ON e.venue_id = v.id
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN event_genres eg ON e.id = eg.event_id
LEFT JOIN genres g ON eg.genre_id = g.id
LEFT JOIN event_artists ea ON e.id = ea.event_id
LEFT JOIN artists a ON ea.artist_id = a.id
WHERE e.status IN ('announced', 'confirmed')
AND e.start_date >= CURRENT_DATE
GROUP BY e.id, c.name, c.slug, r.name, r.slug, v.name, o.name;

-- Festival-only view (most searched)
CREATE VIEW v_festivals AS
SELECT * FROM v_upcoming_events
WHERE event_type = 'festival';
