import type { VercelRequest, VercelResponse } from '@vercel/node';

// ============================================================================
// TYPES
// ============================================================================

interface SheetEvent {
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
// SEED DATA
// ============================================================================

const EVENTS: SheetEvent[] = [
  {
    id: "gnaoua-2025",
    name: "Festival Gnaoua et Musiques du Monde",
    slug: "festival-gnaoua-et-musiques-du-monde",
    event_type: "festival",
    start_date: "2025-06-26",
    end_date: "2025-06-29",
    city: "Essaouira",
    city_slug: "essaouira",
    region: "Marrakech-Safi",
    region_slug: "marrakech-safi",
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
    description: "Annual celebration of Gnawa music and culture, bringing together Gnawa masters and international artists.",
    image_url: null
  },
  {
    id: "mawazine-2025",
    name: "Mawazine Rhythms of the World",
    slug: "mawazine-rhythms-of-the-world",
    event_type: "festival",
    start_date: "2025-06-20",
    end_date: "2025-06-28",
    city: "Rabat",
    city_slug: "rabat",
    region: "Rabat-Salé-Kénitra",
    region_slug: "rabat-sale-kenitra",
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
    description: "One of the world's largest music festivals with major international headliners.",
    image_url: null
  },
  {
    id: "fes-sacred-music-2025",
    name: "Fes Festival of World Sacred Music",
    slug: "fes-festival-of-world-sacred-music",
    event_type: "festival",
    start_date: "2025-06-06",
    end_date: "2025-06-14",
    city: "Fes",
    city_slug: "fes",
    region: "Fès-Meknès",
    region_slug: "fes-meknes",
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
    description: "Celebrating sacred music traditions from around the world in Morocco's oldest imperial city.",
    image_url: null
  },
  {
    id: "timitar-2025",
    name: "Festival Timitar",
    slug: "festival-timitar",
    event_type: "festival",
    start_date: "2025-07-10",
    end_date: "2025-07-13",
    city: "Agadir",
    city_slug: "agadir",
    region: "Souss-Massa",
    region_slug: "souss-massa",
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
    description: "Festival celebrating Amazigh (Berber) music and culture.",
    image_url: null
  },
  {
    id: "jazzablanca-2025",
    name: "Jazzablanca",
    slug: "jazzablanca",
    event_type: "festival",
    start_date: "2025-07-03",
    end_date: "2025-07-05",
    city: "Casablanca",
    city_slug: "casablanca",
    region: "Casablanca-Settat",
    region_slug: "casablanca-settat",
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
    description: "Casablanca's premier jazz festival.",
    image_url: null
  },
  {
    id: "l-boulevard-2025",
    name: "L'Boulevard Festival",
    slug: "l-boulevard-festival",
    event_type: "festival",
    start_date: "2025-09-26",
    end_date: "2025-09-28",
    city: "Casablanca",
    city_slug: "casablanca",
    region: "Casablanca-Settat",
    region_slug: "casablanca-settat",
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
    description: "Casablanca's urban music festival for emerging Moroccan artists.",
    image_url: null
  },
  {
    id: "visa-for-music-2025",
    name: "Visa For Music",
    slug: "visa-for-music",
    event_type: "conference",
    start_date: "2025-11-19",
    end_date: "2025-11-22",
    city: "Rabat",
    city_slug: "rabat",
    region: "Rabat-Salé-Kénitra",
    region_slug: "rabat-sale-kenitra",
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
    description: "Africa and Middle East's leading music market and showcase festival.",
    image_url: null
  },
  {
    id: "tanjazz-2025",
    name: "Tanjazz Festival",
    slug: "tanjazz-festival",
    event_type: "festival",
    start_date: "2025-09-18",
    end_date: "2025-09-21",
    city: "Tangier",
    city_slug: "tangier",
    region: "Tanger-Tétouan-Al Hoceïma",
    region_slug: "tanger-tetouan-al-hoceima",
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
    description: "Tangier's international jazz festival.",
    image_url: null
  },
  {
    id: "oasis-festival-2025",
    name: "Oasis Festival",
    slug: "oasis-festival",
    event_type: "festival",
    start_date: "2025-09-12",
    end_date: "2025-09-14",
    city: "Marrakech",
    city_slug: "marrakech",
    region: "Marrakech-Safi",
    region_slug: "marrakech-safi",
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
    description: "Boutique electronic music festival in the Atlas Mountains.",
    image_url: null
  },
  {
    id: "atlas-electronic-2025",
    name: "Atlas Electronic",
    slug: "atlas-electronic",
    event_type: "festival",
    start_date: "2025-03-28",
    end_date: "2025-03-30",
    city: "Marrakech",
    city_slug: "marrakech",
    region: "Marrakech-Safi",
    region_slug: "marrakech-safi",
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
    description: "Electronic music gathering in the Moroccan countryside.",
    image_url: null
  },
  {
    id: "alegria-festival-2025",
    name: "Alegria Festival",
    slug: "alegria-festival",
    event_type: "festival",
    start_date: "2025-04-25",
    end_date: "2025-04-27",
    city: "El Jadida",
    city_slug: "el-jadida",
    region: "Casablanca-Settat",
    region_slug: "casablanca-settat",
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
    id: "jardin-des-arts-2025",
    name: "Festival du Jardin des Arts",
    slug: "festival-du-jardin-des-arts",
    event_type: "festival",
    start_date: "2025-05-15",
    end_date: "2025-05-18",
    city: "Tétouan",
    city_slug: "tetouan",
    region: "Tanger-Tétouan-Al Hoceïma",
    region_slug: "tanger-tetouan-al-hoceima",
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
    description: "Arts festival featuring Andalusian music traditions.",
    image_url: null
  },
  {
    id: "awaln-art-2025",
    name: "Awaln'Art Festival",
    slug: "awalnart-festival",
    event_type: "festival",
    start_date: "2025-06-12",
    end_date: "2025-06-15",
    city: "Marrakech",
    city_slug: "marrakech",
    region: "Marrakech-Safi",
    region_slug: "marrakech-safi",
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
    description: "Contemporary arts and music festival in Marrakech.",
    image_url: null
  },
  {
    id: "chefchaouen-jazz-2025",
    name: "Jazz au Chefchaouen",
    slug: "jazz-au-chefchaouen",
    event_type: "festival",
    start_date: "2025-08-07",
    end_date: "2025-08-09",
    city: "Chefchaouen",
    city_slug: "chefchaouen",
    region: "Tanger-Tétouan-Al Hoceïma",
    region_slug: "tanger-tetouan-al-hoceima",
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
    description: "Jazz festival in the blue-painted mountain town.",
    image_url: null
  },
  {
    id: "merzouga-music-2025",
    name: "Merzouga Music Festival",
    slug: "merzouga-music-festival",
    event_type: "festival",
    start_date: "2025-10-17",
    end_date: "2025-10-19",
    city: "Merzouga",
    city_slug: "merzouga",
    region: "Drâa-Tafilalet",
    region_slug: "draa-tafilalet",
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
    description: "Music performances in the Sahara desert dunes.",
    image_url: null
  }
];

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { city, genre, type, status, upcoming, slug } = req.query;

    // Single event by slug
    if (slug && typeof slug === 'string') {
      const event = EVENTS.find(e => e.slug === slug || e.id === slug);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      return res.status(200).json({ data: event });
    }

    let filtered = [...EVENTS];

    // Filter by city
    if (city && typeof city === 'string') {
      filtered = filtered.filter(e => e.city_slug === city);
    }

    // Filter by genre
    if (genre && typeof genre === 'string') {
      const g = genre.toLowerCase();
      filtered = filtered.filter(e => e.genres.some(eg => eg.toLowerCase() === g));
    }

    // Filter by status
    if (status && typeof status === 'string') {
      filtered = filtered.filter(e => e.status === status);
    }

    // Filter by event type
    if (type && typeof type === 'string') {
      filtered = filtered.filter(e => e.event_type === type);
    }

    // Filter to upcoming only
    if (upcoming === 'true' || upcoming === '1') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(e => e.start_date >= today && ['announced', 'confirmed'].includes(e.status));
    }

    // Sort: pinned first, then by date
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return a.start_date.localeCompare(b.start_date);
    });

    return res.status(200).json({
      data: filtered,
      meta: { total: filtered.length },
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
}
