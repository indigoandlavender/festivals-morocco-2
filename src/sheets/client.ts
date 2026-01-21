/**
 * Google Sheets Data Client
 *
 * Fetches event data from Google Sheets.
 * Sheet ID configured via GOOGLE_SHEET_ID env var.
 *
 * Uses the public Google Sheets API (no auth required if sheet is public)
 * or Google Service Account for private sheets.
 */

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1LjfPpLzpuQEkeb34MYrrTFad_PM1wjiS4vPS67sNML0';
const API_KEY = process.env.GOOGLE_API_KEY;

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

export interface SheetCity {
  name: string;
  slug: string;
  name_fr: string | null;
  name_ar: string | null;
  region: string;
  region_slug: string;
  lat: number | null;
  lng: number | null;
}

export interface SheetArtist {
  name: string;
  slug: string;
  country: string | null;
  genres: string[];
  website: string | null;
  image_url: string | null;
}

// ============================================================================
// SHEET CONFIGURATION
// ============================================================================

/**
 * Expected sheet names and their column structures.
 * Columns are 0-indexed based on their position in the sheet.
 */
export const SHEET_CONFIG = {
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
      genres: 8,           // comma-separated
      artists: 9,          // comma-separated
      organizer: 10,
      official_website: 11,
      ticket_url: 12,
      status: 13,
      is_verified: 14,     // TRUE/FALSE
      is_pinned: 15,       // TRUE/FALSE
      cultural_significance: 16,  // 0-10
      description: 17,
      image_url: 18,
    },
  },
  cities: {
    name: 'Cities',
    columns: {
      name: 0,
      name_fr: 1,
      name_ar: 2,
      region: 3,
      lat: 4,
      lng: 5,
    },
  },
  artists: {
    name: 'Artists',
    columns: {
      name: 0,
      country: 1,
      genres: 2,           // comma-separated
      website: 3,
      image_url: 4,
    },
  },
  genres: {
    name: 'Genres',
    columns: {
      name: 0,
      parent: 1,
      description: 2,
    },
  },
  regions: {
    name: 'Regions',
    columns: {
      name: 0,
      name_fr: 1,
      name_ar: 2,
    },
  },
};

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Fetch raw data from a Google Sheet tab.
 * Works with public sheets (no API key) or private sheets (with API key).
 */
async function fetchSheetData(sheetName: string): Promise<string[][]> {
  // Use the Google Sheets API v4
  const url = API_KEY
    ? `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`
    : `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet ${sheetName}: ${response.status}`);
  }

  if (API_KEY) {
    // Google Sheets API response
    const data = await response.json();
    return data.values || [];
  } else {
    // Public gviz response (wrapped in callback)
    const text = await response.text();
    // Remove the callback wrapper: google.visualization.Query.setResponse({...})
    const jsonStr = text.replace(/^[^{]+/, '').replace(/[^}]+$/, '');
    const data = JSON.parse(jsonStr);

    // Convert gviz format to simple 2D array
    return data.table.rows.map((row: any) =>
      row.c.map((cell: any) => cell?.v?.toString() || '')
    );
  }
}

/**
 * Generate a URL-friendly slug from a string.
 */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse a comma-separated string into an array.
 */
function parseList(str: string | null | undefined): string[] {
  if (!str || str.trim() === '') return [];
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse a boolean from sheet (TRUE/FALSE/Yes/No/1/0).
 */
function parseBool(val: string | null | undefined): boolean {
  if (!val) return false;
  const v = val.toString().toLowerCase().trim();
  return v === 'true' || v === 'yes' || v === '1';
}

/**
 * Parse a number, defaulting to 0.
 */
function parseNum(val: string | null | undefined, defaultVal = 0): number {
  if (!val) return defaultVal;
  const n = parseFloat(val);
  return isNaN(n) ? defaultVal : n;
}

// ============================================================================
// DATA FETCHERS
// ============================================================================

/**
 * Fetch and parse all events from the Events sheet.
 */
export async function fetchEvents(): Promise<SheetEvent[]> {
  const rows = await fetchSheetData(SHEET_CONFIG.events.name);
  const cols = SHEET_CONFIG.events.columns;

  // Skip header row
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
  }).filter(e => e.name && e.start_date); // Filter out empty rows
}

/**
 * Fetch and parse all cities.
 */
export async function fetchCities(): Promise<SheetCity[]> {
  const rows = await fetchSheetData(SHEET_CONFIG.cities.name);
  const cols = SHEET_CONFIG.cities.columns;

  return rows.slice(1).map(row => {
    const name = row[cols.name] || '';
    const region = row[cols.region] || '';

    return {
      name,
      slug: slugify(name),
      name_fr: row[cols.name_fr] || null,
      name_ar: row[cols.name_ar] || null,
      region,
      region_slug: slugify(region),
      lat: parseNum(row[cols.lat], null as any),
      lng: parseNum(row[cols.lng], null as any),
    };
  }).filter(c => c.name);
}

/**
 * Fetch and parse all artists.
 */
export async function fetchArtists(): Promise<SheetArtist[]> {
  const rows = await fetchSheetData(SHEET_CONFIG.artists.name);
  const cols = SHEET_CONFIG.artists.columns;

  return rows.slice(1).map(row => {
    const name = row[cols.name] || '';

    return {
      name,
      slug: slugify(name),
      country: row[cols.country] || null,
      genres: parseList(row[cols.genres]),
      website: row[cols.website] || null,
      image_url: row[cols.image_url] || null,
    };
  }).filter(a => a.name);
}

// ============================================================================
// AGGREGATED DATA
// ============================================================================

export interface SiteData {
  events: SheetEvent[];
  cities: SheetCity[];
  artists: SheetArtist[];
  genres: string[];
  regions: string[];
  lastFetched: string;
}

/**
 * Fetch all data from all sheets.
 * Use this for static site generation.
 */
export async function fetchAllData(): Promise<SiteData> {
  const [events, cities, artists] = await Promise.all([
    fetchEvents(),
    fetchCities().catch(() => []),   // Optional sheet
    fetchArtists().catch(() => []),  // Optional sheet
  ]);

  // Extract unique genres and regions from events
  const genres = [...new Set(events.flatMap(e => e.genres))].sort();
  const regions = [...new Set(events.map(e => e.region))].filter(Boolean).sort();

  return {
    events,
    cities,
    artists,
    genres,
    regions,
    lastFetched: new Date().toISOString(),
  };
}

/**
 * Get upcoming events only.
 */
export function getUpcomingEvents(events: SheetEvent[]): SheetEvent[] {
  const today = new Date().toISOString().split('T')[0];
  return events
    .filter(e => e.start_date >= today && ['announced', 'confirmed'].includes(e.status))
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
}

/**
 * Get events by city.
 */
export function getEventsByCity(events: SheetEvent[], citySlug: string): SheetEvent[] {
  return events.filter(e => e.city_slug === citySlug);
}

/**
 * Get events by genre.
 */
export function getEventsByGenre(events: SheetEvent[], genre: string): SheetEvent[] {
  const genreLower = genre.toLowerCase();
  return events.filter(e =>
    e.genres.some(g => g.toLowerCase() === genreLower)
  );
}

/**
 * Get events by month.
 */
export function getEventsByMonth(events: SheetEvent[], year: number, month: number): SheetEvent[] {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  return events.filter(e => e.start_date.startsWith(monthStr));
}
