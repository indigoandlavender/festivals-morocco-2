import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchEvents, getUpcomingEvents, getEventsByCity, getEventsByGenre, getEventsByMonth, SheetEvent } from '../src/sheets/client';

// Cache events for 5 minutes to avoid hitting Google Sheets too often
let cachedEvents: SheetEvent[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getEvents(): Promise<SheetEvent[]> {
  const now = Date.now();
  if (cachedEvents && now - cacheTime < CACHE_TTL) {
    return cachedEvents;
  }
  cachedEvents = await fetchEvents();
  cacheTime = now;
  return cachedEvents;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const events = await getEvents();
    const { city, genre, year, month, status, type, upcoming, slug } = req.query;

    // Single event by slug
    if (slug && typeof slug === 'string') {
      const event = events.find(e => e.slug === slug || e.id === slug);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      return res.status(200).json({ data: event });
    }

    let filtered = events;

    // Filter by city
    if (city && typeof city === 'string') {
      filtered = getEventsByCity(filtered, city);
    }

    // Filter by genre
    if (genre && typeof genre === 'string') {
      filtered = getEventsByGenre(filtered, genre);
    }

    // Filter by month
    if (year && month) {
      filtered = getEventsByMonth(filtered, parseInt(year as string), parseInt(month as string));
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
      filtered = getUpcomingEvents(filtered);
    }

    // Sort by start date
    filtered.sort((a, b) => {
      // Pinned first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // Then by date
      return a.start_date.localeCompare(b.start_date);
    });

    return res.status(200).json({
      data: filtered,
      meta: {
        total: filtered.length,
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
}
