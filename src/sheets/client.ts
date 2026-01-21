/**
 * Data Client
 *
 * Fetches event data from embedded seed data or Google Sheets.
 * Uses local data by default for instant deployment.
 * Set USE_GOOGLE_SHEETS=true to fetch from Sheets instead.
 */

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
// SEED DATA (EMBEDDED)
// ============================================================================

const SEED_EVENTS = [
  {
    id: "gnaoua-2025",
    name: "Festival Gnaoua et Musiques du Monde",
    event_type: "festival",
    start_date: "2025-06-26",
    end_date: "2025-06-29",
    city: "Essaouira",
    region: "Marrakech-Safi",
    venue: "Place Moulay Hassan",
    genres: ["Gnawa", "World Music", "Jazz"],
    artists: ["Maalem Hamid El Kasri", "Hindi Zahra", "Oum"],
    organizer: "Association Yerma Gnaoua",
    official_website: "https://festival-gnaoua.net",
    ticket_url: "https://festival-gnaoua.net/billetterie",
    status: "confirmed",
    is_verified: true,
    is_pinned: true,
    cultural_significance: 10,
    description: "Annual celebration of Gnawa music and culture, bringing together Gnawa masters (Maalems) and international artists in the coastal town of Essaouira.",
    image_url: null
  },
  {
    id: "mawazine-2025",
    name: "Mawazine Rhythms of the World",
    event_type: "festival",
    start_date: "2025-06-20",
    end_date: "2025-06-28",
    city: "Rabat",
    region: "Rabat-Salé-Kénitra",
    venue: "OLM Souissi",
    genres: ["Pop", "World Music", "Hip Hop", "R&B"],
    artists: [],
    organizer: "Maroc Cultures",
    official_website: "https://mawazine.ma",
    ticket_url: null,
    status: "announced",
    is_verified: true,
    is_pinned: true,
    cultural_significance: 9,
    description: "One of the world's largest music festivals, attracting millions of attendees and featuring major international headliners alongside Moroccan artists.",
    image_url: null
  },
  {
    id: "timitar-2025",
    name: "Festival Timitar",
    event_type: "festival",
    start_date: "2025-07-10",
    end_date: "2025-07-13",
    city: "Agadir",
    region: "Souss-Massa",
    venue: null,
    genres: ["Amazigh", "World Music", "Folk"],
    artists: [],
    organizer: "Association Timitar",
    official_website: "https://festivaltimitar.ma",
    ticket_url: null,
    status: "announced",
    is_verified: true,
    is_pinned: false,
    cultural_significance: 8,
    description: "Festival celebrating Amazigh (Berber) music and culture, showcasing traditional and contemporary artists from Morocco and beyond.",
    image_url: null
  },
  {
    id: "jazzablanca-2025",
    name: "Jazzablanca",
    event_type: "festival",
    start_date: "2025-07-03",
    end_date: "2025-07-05",
    city: "Casablanca",
    region: "Casablanca-Settat",
    venue: "Anfa Park",
    genres: ["Jazz", "Soul", "Blues", "Electronic"],
    artists: [],
    organizer: "7MO",
    official_website: "https://jazzablanca.com",
    ticket_url: null,
    status: "announced",
    is_verified: true,
    is_pinned: false,
    cultural_significance: 7,
    description: "Casablanca's premier jazz festival bringing international jazz, soul, and blues artists to Morocco's economic capital.",
    image_url: null
  },
  {
    id: "visa-for-music-2025",
    name: "Visa For Music",
    event_type: "conference",
    start_date: "2025-11-19",
    end_date: "2025-11-22",
    city: "Rabat",
    region: "Rabat-Salé-Kénitra",
    venue: "Various venues",
    genres: ["World Music", "African", "Electronic"],
    artists: [],
    organizer: "Visa For Music",
    official_website: "https://visaformusic.com",
    ticket_url: null,
    status: "announced",
    is_verified: true,
    is_pinned: false,
    cultural_significance: 7,
    description: "Africa and Middle East's leading music market and showcase festival, connecting artists with industry professionals.",
    image_url: null
  },
  {
    id: "tanjazz-2025",
    name: "Tanjazz Festival",
    event_type: "festival",
    start_date: "2025-09-18",
    end_date: "2025-09-21",
    city: "Tangier",
    region: "Tanger-Tétouan-Al Hoceïma",
    venue: "Palais des Institutions Italiennes",
    genres: ["Jazz", "Blues", "Soul"],
    artists: [],
    organizer: "Tanjazz Association",
    official_website: "https://tanjazz.org",
    ticket_url: null,
    status: "announced",
    is_verified: true,
    is_pinned: false,
    cultural_significance: 6,
    description: "Tangier's international jazz festival featuring performances in historic venues across the city.",
    image_url: null
  },
  {
    id: "fes-sacred-music-2025",
    name: "Fes Festival of World Sacred Music",
    event_type: "festival",
    start_date: "2025-06-06",
    end_date: "2025-06-14",
    city: "Fes",
    region: "Fès-Meknès",
    venue: "Bab Al Makina",
    genres: ["Sufi", "Classical", "World Music", "Sacred"],
    artists: [],
    organizer: "Fes Festival Foundation",
    official_website: "https://fesfestival.com",
    ticket_url: null,
    status: "announced",
    is_verified: true,
    is_pinned: true,
    cultural_significance: 9,
    description: "Celebrating sacred music traditions from around the world in the spiritual heart of Morocco's oldest imperial city.",
    image_url: null
  },
  {
    id: "oasis-festival-2025",
    name: "Oasis Festival",
    event_type: "festival",
    start_date: "2025-09-12",
    end_date: "2025-09-14",
    city: "Marrakech",
    region: "Marrakech-Safi",
    venue: "The Source",
    genres: ["Electronic", "House", "Techno"],
    artists: [],
    organizer: "Oasis Festival",
    official_website: "https://theoasisfest.com",
    ticket_url: null,
    status: "announced",
    is_verified: true,
    is_pinned: false,
    cultural_significance: 6,
    description: "Boutique electronic music festival set in the foothills of the Atlas Mountains outside Marrakech.",
    image_url: null
  },
  {
    id: "atlas-electronic-2025",
    name: "Atlas Electronic",
    event_type: "festival",
    start_date: "2025-03-28",
    end_date: "2025-03-30",
    city: "Marrakech",
    region: "Marrakech-Safi",
    venue: "Fellah Hotel",
    genres: ["Electronic", "Ambient", "Experimental"],
    artists: [],
    organizer: "Atlas Electronic",
    official_website: "https://atlaselectronic.ma",
    ticket_url: null,
    status: "confirmed",
    is_verified: true,
    is_pinned: false,
    cultural_significance: 5,
    description: "Electronic music gathering focused on experimental and ambient sounds in the Moroccan countryside.",
    image_url: null
  },
  {
    id: "l-boulevard-2025",
    name: "L'Boulevard Festival",
    event_type: "festival",
    start_date: "2025-09-26",
    end_date: "2025-09-28",
    city: "Casablanca",
    region: "Casablanca-Settat",
    venue: "Ancienne Médina",
    genres: ["Hip Hop", "Rock", "Electronic", "Urban"],
    artists: [],
    organizer: "EAC L'Boulvard",
    official_website: "https://boulevard.ma",
    ticket_url: null,
    status: "announced",
    is_verified: true,
    is_pinned: false,
    cultural_significance: 7,
    description: "Casablanca's urban music festival and platform for emerging Moroccan artists in hip hop, rock, and electronic music.",
    image_url: null
  },
  {
    id: "jardin-des-arts-2025",
    name: "Festival du Jardin des Arts",
    event_type: "festival",
    start_date: "2025-05-15",
    end_date: "2025-05-18",
    city: "Tétouan",
    region: "Tanger-Tétouan-Al Hoceïma",
    venue: "Jardin Moulay Rachid",
    genres: ["Andalusian", "Classical", "Folk"],
    artists: [],
    organizer: null,
    official_website: null,
    ticket_url: null,
    status: "announced",
    is_verified: false,
    is_pinned: false,
    cultural_significance: 5,
    description: "Arts festival in Tétouan's gardens featuring Andalusian music traditions.",
    image_url: null
  },
  {
    id: "alegria-festival-2025",
    name: "Alegria Festival",
    event_type: "festival",
    start_date: "2025-04-25",
    end_date: "2025-04-27",
    city: "El Jadida",
    region: "Casablanca-Settat",
    venue: "Mazagan Beach Resort",
    genres: ["Electronic", "House", "Disco"],
    artists: [],
    organizer: "Alegria Events",
    official_website: "https://alegriafestival.com",
    ticket_url: null,
    status: "announced",
    is_verified: false,
    is_pinned: false,
    cultural_significance: 4,
    description: "Beach electronic music festival on Morocco's Atlantic coast.",
    image_url: null
  },
  {
    id: "merzouga-music-2025",
    name: "Merzouga Music Festival",
    event_type: "festival",
    start_date: "2025-10-17",
    end_date: "2025-10-19",
    city: "Merzouga",
    region: "Drâa-Tafilalet",
    venue: "Erg Chebbi Dunes",
    genres: ["World Music", "Gnawa", "Desert Blues"],
    artists: [],
    organizer: null,
    official_website: null,
    ticket_url: null,
    status: "announced",
    is_verified: false,
    is_pinned: false,
    cultural_significance: 5,
    description: "Music performances in the Sahara desert dunes near Merzouga.",
    image_url: null
  },
  {
    id: "chefchaouen-jazz-2025",
    name: "Jazz au Chefchaouen",
    event_type: "festival",
    start_date: "2025-08-07",
    end_date: "2025-08-09",
    city: "Chefchaouen",
    region: "Tanger-Tétouan-Al Hoceïma",
    venue: "Place Outa El Hammam",
    genres: ["Jazz", "Fusion"],
    artists: [],
    organizer: null,
    official_website: null,
    ticket_url: null,
    status: "announced",
    is_verified: false,
    is_pinned: false,
    cultural_significance: 4,
    description: "Jazz festival in the blue-painted mountain town of Chefchaouen.",
    image_url: null
  },
  {
    id: "awaln-art-2025",
    name: "Awaln'Art Festival",
    event_type: "festival",
    start_date: "2025-06-12",
    end_date: "2025-06-15",
    city: "Marrakech",
    region: "Marrakech-Safi",
    venue: "Various venues",
    genres: ["World Music", "Gnawa", "Electronic"],
    artists: [],
    organizer: "Awaln'Art Association",
    official_website: null,
    ticket_url: null,
    status: "announced",
    is_verified: false,
    is_pinned: false,
    cultural_significance: 5,
    description: "Contemporary arts and music festival in Marrakech's medina and gardens.",
    image_url: null
  }
];

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
  return SEED_EVENTS.map(event => ({
    id: event.id,
    name: event.name,
    slug: slugify(event.name),
    event_type: event.event_type as SheetEvent['event_type'],
    start_date: event.start_date,
    end_date: event.end_date || null,
    city: event.city,
    city_slug: slugify(event.city),
    region: event.region,
    region_slug: slugify(event.region),
    venue: event.venue || null,
    genres: event.genres,
    artists: event.artists,
    organizer: event.organizer || null,
    official_website: event.official_website || null,
    ticket_url: event.ticket_url || null,
    status: event.status as SheetEvent['status'],
    is_verified: event.is_verified,
    is_pinned: event.is_pinned,
    cultural_significance: event.cultural_significance,
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
