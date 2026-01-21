/**
 * Data Client
 *
 * Fetches event data from local JSON (seed data) or Google Sheets.
 * Uses local data by default for instant deployment.
 * Set USE_GOOGLE_SHEETS=true to fetch from Sheets instead.
 */

import seedEvents from '../data/events.json';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1LjfPpLzpuQEkeb34MYrrTFad_PM1wjiS4vPS67sNML0';
const API_KEY = process.env.GOOGLE_API_KEY;
const USE_SHEETS = process.env.USE_GOOGLE_SHEETS === 'true';

// ============================================================================
// TYPES
// ============================================================================

export interface SheetEvent {
  id: string;
  name: string;
  slug: string;
  event_type: 'festival' | 'concert' | 'showcase' | 'ritual' | 'conference';
  start_date: string;
  end_date: string | null;
  city: string;
  city_slug: string;
  region: string;
  region_slug: string;
  venue: string | null;
  genres: string[];
  artists: string[];
  organizer: string | null;
  official_website: string | null;
  ticket_url: string | null;
  status: 'announced' | 'confirmed' | 'cancelled' | 'archived';
  is_verified: boolean;
  is_pinned: boolean;
  cultural_significance: number;
  description: string | null;
  image_url: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseList(str: string | null | undefined): string[] {
  if (!str || str.trim() === '') return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

function parseBool(val: string | boolean | null | undefined): boolean {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const v = val.toString().toLowerCase().trim();
  return v === 'true' || v === 'yes' || v === '1';
}

function parseNum(val: string | number | null | undefined, defaultVal = 0): number {
  if (typeof val === 'number') return val;
  if (!val) return defaultVal;
  const n = parseFloat(val);
  return isNaN(n) ? defaultVal : n;
}

// ============================================================================
// LOCAL DATA (SEED)
// ============================================================================

function loadSeedEvents(): SheetEvent[] {
  return (seedEvents as any[]).map(event => ({
    id: event.id,
    name: event.name,
    slug: slugify(event.name),
    event_type: event.event_type || 'concert',
    start_date: event.start_date,
    end_date: event.end_date || null,
    city: event.city,
    city_slug: slugify(event.city),
    region: event.region,
    region_slug: slugify(event.region),
    venue: event.venue || null,
    genres: Array.isArray(event.genres) ? event.genres : parseList(event.genres),
    artists: Array.isArray(event.artists) ? event.artists : parseList(event.artists),
    organizer: event.organizer || null,
    official_website: event.official_website || null,
    ticket_url: event.ticket_url || null,
    status: event.status || 'announced',
    is_verified: parseBool(event.is_verified),
    is_pinned: parseBool(event.is_pinned),
    cultural_significance: parseNum(event.cultural_significance, 0),
    description: event.description || null,
    image_url: event.image_url || null,
  }));
}

// ============================================================================
// GOOGLE SHEETS FETCH
// ============================================================================

const SHEET_CONFIG = {
  events: {
    name: 'Events',
    columns: {
      id: 0,
      name: 1,
      event_type: 2,
      start_date: 3,
      end_date: 4,
      city: 5,
      region: 6,
      venue: 7,
      genres: 8,
      artists: 9,
      organizer: 10,
      official_website: 11,
      ticket_url: 12,
      status: 13,
      is_verified: 14,
      is_pinned: 15,
      cultural_significance: 16,
      description: 17,
      image_url: 18,
    },
  },
};

async function fetchSheetData(sheetName: string): Promise<string[][]> {
  const url = API_KEY
    ? `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`
    : `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet ${sheetName}: ${response.status}`);
  }

  if (API_KEY) {
    const data = await response.json();
    return data.values || [];
  } else {
    const text = await response.text();
    const jsonStr = text.replace(/^[^{]+/, '').replace(/[^}]+$/, '');
    const data = JSON.parse(jsonStr);
    return data.table.rows.map((row: any) =>
      row.c.map((cell: any) => cell?.v?.toString() || '')
    );
  }
}

async function fetchEventsFromSheets(): Promise<SheetEvent[]> {
  const rows = await fetchSheetData(SHEET_CONFIG.events.name);
  const cols = SHEET_CONFIG.events.columns;

  return rows.slice(1).map((row, index) => {
    const name = row[cols.name] || '';
    const city = row[cols.city] || '';
    const region = row[cols.region] || '';

    return {
      id: row[cols.id] || `event-${index + 1}`,
      name,
      slug: slugify(name),
      event_type: (row[cols.event_type] || 'concert') as SheetEvent['event_type'],
      start_date: row[cols.start_date] || '',
      end_date: row[cols.end_date] || null,
      city,
      city_slug: slugify(city),
      region,
      region_slug: slugify(region),
      venue: row[cols.venue] || null,
      genres: parseList(row[cols.genres]),
      artists: parseList(row[cols.artists]),
      organizer: row[cols.organizer] || null,
      official_website: row[cols.official_website] || null,
      ticket_url: row[cols.ticket_url] || null,
      status: (row[cols.status] || 'announced') as SheetEvent['status'],
      is_verified: parseBool(row[cols.is_verified]),
      is_pinned: parseBool(row[cols.is_pinned]),
      cultural_significance: parseNum(row[cols.cultural_significance], 0),
      description: row[cols.description] || null,
      image_url: row[cols.image_url] || null,
    };
  }).filter(e => e.name && e.start_date);
}

// ============================================================================
// MAIN FETCH FUNCTION
// ============================================================================

/**
 * Fetch events from local seed data or Google Sheets.
 * Uses local data by default. Set USE_GOOGLE_SHEETS=true for Sheets.
 */
export async function fetchEvents(): Promise<SheetEvent[]> {
  if (USE_SHEETS) {
    try {
      return await fetchEventsFromSheets();
    } catch (error) {
      console.error('Failed to fetch from Sheets, falling back to seed data:', error);
      return loadSeedEvents();
    }
  }
  return loadSeedEvents();
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

export function getUpcomingEvents(events: SheetEvent[]): SheetEvent[] {
  const today = new Date().toISOString().split('T')[0];
  return events
    .filter(e => e.start_date >= today && ['announced', 'confirmed'].includes(e.status))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
}

export function getEventsByCity(events: SheetEvent[], citySlug: string): SheetEvent[] {
  return events.filter(e => e.city_slug === citySlug);
}

export function getEventsByGenre(events: SheetEvent[], genre: string): SheetEvent[] {
  const genreLower = genre.toLowerCase();
  return events.filter(e =>
    e.genres.some(g => g.toLowerCase() === genreLower || slugify(g) === genreLower)
  );
}

export function getEventsByMonth(events: SheetEvent[], year: number, month: number): SheetEvent[] {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  return events.filter(e => e.start_date.startsWith(monthStr));
}

export function getEventBySlug(events: SheetEvent[], slug: string): SheetEvent | undefined {
  return events.find(e => e.slug === slug || e.id === slug);
}

// ============================================================================
// AGGREGATION HELPERS
// ============================================================================

export function getUniqueCities(events: SheetEvent[]): { name: string; slug: string; region: string; count: number }[] {
  const cityMap = new Map<string, { name: string; slug: string; region: string; count: number }>();

  for (const event of events) {
    const existing = cityMap.get(event.city_slug);
    if (existing) {
      existing.count++;
    } else {
      cityMap.set(event.city_slug, {
        name: event.city,
        slug: event.city_slug,
        region: event.region,
        count: 1,
      });
    }
  }

  return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
}

export function getUniqueGenres(events: SheetEvent[]): { name: string; slug: string; count: number }[] {
  const genreMap = new Map<string, { name: string; slug: string; count: number }>();

  for (const event of events) {
    for (const genre of event.genres) {
      const slug = slugify(genre);
      const existing = genreMap.get(slug);
      if (existing) {
        existing.count++;
      } else {
        genreMap.set(slug, { name: genre, slug, count: 1 });
      }
    }
  }

  return Array.from(genreMap.values()).sort((a, b) => b.count - a.count);
}

export function getUniqueRegions(events: SheetEvent[]): { name: string; slug: string; count: number }[] {
  const regionMap = new Map<string, { name: string; slug: string; count: number }>();

  for (const event of events) {
    const existing = regionMap.get(event.region_slug);
    if (existing) {
      existing.count++;
    } else {
      regionMap.set(event.region_slug, {
        name: event.region,
        slug: event.region_slug,
        count: 1,
      });
    }
  }

  return Array.from(regionMap.values()).sort((a, b) => b.count - a.count);
}
