import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// SUPABASE CLIENT (lazy-initialized)
// =============================================================================

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url =
      import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
      import.meta.env.PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "";

    const key =
      import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

    if (!url || !key) {
      throw new Error("Supabase URL and anon key are required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }

    _supabase = createClient(url, key);
  }
  return _supabase;
}

// =============================================================================
// BUILD-TIME CACHE
// =============================================================================
declare global {
  // eslint-disable-next-line no-var
  var __festivalsCache:
    | {
        siteSettings: SiteSettings | null;
        events: SheetEvent[] | null;
        legalPages: LegalPage[] | null;
      }
    | undefined;
}

if (!globalThis.__festivalsCache) {
  globalThis.__festivalsCache = {
    siteSettings: null,
    events: null,
    legalPages: null,
  };
}

const cache = globalThis.__festivalsCache!;

// =============================================================================
// NEXUS LEGAL PAGES — from Supabase
// =============================================================================

export interface LegalPage {
  label: string;
  href: string;
}

export async function getLegalPages(): Promise<LegalPage[]> {
  if (cache.legalPages !== null) {
    return cache.legalPages;
  }

  try {
    const { data, error } = await getSupabase()
      .from("nexus_legal_pages")
      .select("page_id, page_title")
      .order("page_id");

    if (error) throw error;
    if (!data || data.length === 0) {
      cache.legalPages = getFallbackLegalPages();
      return cache.legalPages;
    }

    // Deduplicate — table has multiple rows per page (one per section)
    const uniquePages = new Map<string, string>();
    for (const row of data) {
      if (row.page_id && row.page_title && !uniquePages.has(row.page_id)) {
        uniquePages.set(row.page_id, row.page_title);
      }
    }

    // Maintain consistent ordering
    const contentLegalPageIds = [
      "privacy",
      "terms",
      "disclaimer",
      "intellectual-property",
    ];

    const result: LegalPage[] = [];
    for (const pageId of contentLegalPageIds) {
      const pageTitle = uniquePages.get(pageId);
      if (pageTitle) {
        result.push({ label: pageTitle, href: `/${pageId}` });
      }
    }

    cache.legalPages = result.length > 0 ? result : getFallbackLegalPages();
    return cache.legalPages;
  } catch (error) {
    console.error("Could not fetch legal pages from Supabase:", error);
    cache.legalPages = getFallbackLegalPages();
    return cache.legalPages;
  }
}

function getFallbackLegalPages(): LegalPage[] {
  return [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
    { label: "Intellectual Property", href: "/intellectual-property" },
  ];
}

export interface LegalPageContent {
  page_id: string;
  page_title: string;
  sections: {
    section_title: string;
    section_content: string;
  }[];
}

export async function getLegalPageContent(
  pageId: string
): Promise<LegalPageContent | null> {
  try {
    const { data, error } = await getSupabase()
      .from("nexus_legal_pages")
      .select("page_id, page_title, section_order, section_title, section_content")
      .eq("page_id", pageId)
      .order("section_order", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const replacements: Record<string, string> = {
      "{{site_name}}": "Festivals in Morocco",
      "{{site_url}}": "https://festivalsinmorocco.com",
      "{{legal_entity}}": "Dancing with Lions",
      "{{contact_email}}": "hello@festivalsinmorocco.com",
      "{{jurisdiction_country}}": "Morocco",
      "{{jurisdiction_city}}": "Marrakech",
      "{{address_line1}}": "35 Derb Fhal Zfriti Kennaria",
      "{{address_line2}}": "Marrakech 40000 Morocco",
    };

    const replaceVariables = (text: string): string => {
      let result = text;
      for (const [key, value] of Object.entries(replacements)) {
        result = result.split(key).join(value);
      }
      return result;
    };

    return {
      page_id: pageId,
      page_title: data[0].page_title,
      sections: data.map((s: any) => ({
        section_title: replaceVariables(s.section_title || ""),
        section_content: replaceVariables(s.section_content || ""),
      })),
    };
  } catch (error) {
    console.error(`Error fetching legal page ${pageId}:`, error);
    return getFallbackLegalPageContent(pageId);
  }
}

function getFallbackLegalPageContent(pageId: string): LegalPageContent | null {
  const siteName = "Festivals in Morocco";
  const siteUrl = "https://festivalsinmorocco.com";
  const legalEntity = "Dancing with Lions";
  const contactEmail = "hello@festivalsinmorocco.com";
  const address = "35 Derb Fhal Zfriti Kennaria, Marrakech 40000 Morocco";

  const pages: Record<string, LegalPageContent> = {
    privacy: {
      page_id: "privacy",
      page_title: "Privacy Policy",
      sections: [
        {
          section_title: "Introduction",
          section_content: `${siteName} (${siteUrl}), operated by ${legalEntity}, is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you visit our website.`,
        },
        {
          section_title: "Information We Collect",
          section_content: `We may collect non-personal information such as browser type, language preference, referring site, and the date and time of each visitor request. We collect personal information only when you voluntarily provide it, such as when subscribing to our newsletter or submitting a festival listing.`,
        },
        {
          section_title: "How We Use Your Information",
          section_content: `We use the information we collect to operate and improve the website, send periodic emails if you have opted in, and respond to inquiries. We do not sell, trade, or otherwise transfer your personal information to third parties.`,
        },
        {
          section_title: "Cookies",
          section_content: `Our website may use cookies to enhance your experience. You can choose to disable cookies through your browser settings, though this may affect some functionality.`,
        },
        {
          section_title: "Contact Us",
          section_content: `If you have questions about this Privacy Policy, please contact us at ${contactEmail} or write to us at ${address}.`,
        },
      ],
    },
    terms: {
      page_id: "terms",
      page_title: "Terms of Service",
      sections: [
        {
          section_title: "Acceptance of Terms",
          section_content: `By accessing and using ${siteName} (${siteUrl}), you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use this website.`,
        },
        {
          section_title: "Use of Content",
          section_content: `All content on this website is provided for informational purposes only. Festival dates, times, locations, and details are subject to change without notice. We recommend verifying event details with official organizers before making travel plans.`,
        },
        {
          section_title: "User Submissions",
          section_content: `By submitting content to ${siteName}, you grant us a non-exclusive, royalty-free license to use, reproduce, and display the submitted content in connection with the website.`,
        },
        {
          section_title: "Limitation of Liability",
          section_content: `${legalEntity} shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of this website or reliance on any information provided.`,
        },
        {
          section_title: "Contact Us",
          section_content: `For questions about these Terms of Service, contact us at ${contactEmail}.`,
        },
      ],
    },
    disclaimer: {
      page_id: "disclaimer",
      page_title: "Disclaimer",
      sections: [
        {
          section_title: "General Disclaimer",
          section_content: `The information provided on ${siteName} (${siteUrl}) is for general informational purposes only. While we strive to keep the information up to date and accurate, we make no representations or warranties of any kind about the completeness, accuracy, reliability, or availability of the website or the information contained on it.`,
        },
        {
          section_title: "Event Information",
          section_content: `Festival and event listings are compiled from publicly available sources and direct submissions. Dates, venues, pricing, and other details may change without notice. Always verify event details with official organizers before making plans or purchasing tickets.`,
        },
        {
          section_title: "External Links",
          section_content: `This website may contain links to external sites that are not operated by us. We have no control over the content and practices of these sites and cannot accept responsibility for their privacy policies or content.`,
        },
        {
          section_title: "Contact Us",
          section_content: `If you have any concerns, please contact us at ${contactEmail} or write to ${address}.`,
        },
      ],
    },
    "intellectual-property": {
      page_id: "intellectual-property",
      page_title: "Intellectual Property",
      sections: [
        {
          section_title: "Ownership",
          section_content: `All original content on ${siteName} (${siteUrl}), including text, design, graphics, logos, and compilation of content, is the property of ${legalEntity} and is protected by international copyright laws.`,
        },
        {
          section_title: "Permitted Use",
          section_content: `You may view, download, and print pages from this website for your personal, non-commercial use, provided you do not modify the content and you retain all copyright and proprietary notices.`,
        },
        {
          section_title: "Third-Party Content",
          section_content: `Some images, festival descriptions, and other content may be owned by third parties and are used with permission or under applicable fair use provisions. Such content remains the property of its respective owners.`,
        },
        {
          section_title: "Contact Us",
          section_content: `For intellectual property inquiries, please contact us at ${contactEmail}.`,
        },
      ],
    },
  };

  return pages[pageId] || null;
}

// =============================================================================
// SITE SETTINGS — from Supabase
// =============================================================================

export interface SiteSettings {
  hero_image: string;
  hero_title: string;
  hero_subtitle: string;
  hero_label: string;
  newsletter_title: string;
  newsletter_description: string;
  newsletter_background_image: string;
  site_name: string;
  site_tagline: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  hero_image: "",
  hero_title: "Culture lives here",
  hero_subtitle:
    "From ancient festivals to contemporary celebrations — discover Morocco's vibrant cultural traditions",
  hero_label: "Festivals in Morocco",
  newsletter_title: "Stay connected",
  newsletter_description:
    "Festivals, events, and cultural moments — delivered when they matter.",
  newsletter_background_image: "",
  site_name: "Festivals in Morocco",
  site_tagline: "Discover festivals and cultural events in Morocco",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  if (cache.siteSettings !== null) {
    return cache.siteSettings;
  }

  try {
    const { data, error } = await getSupabase()
      .from("site_settings")
      .select("key, value");

    if (error) throw error;
    if (!data || data.length === 0) {
      cache.siteSettings = DEFAULT_SETTINGS;
      return DEFAULT_SETTINGS;
    }

    const settings: Record<string, string> = {};
    for (const row of data) {
      settings[row.key] = row.value;
    }

    console.log(
      "[Festivals] Loaded",
      Object.keys(settings).length,
      "site settings from Supabase"
    );

    cache.siteSettings = {
      hero_image: settings.hero_image || DEFAULT_SETTINGS.hero_image,
      hero_title: settings.hero_title || DEFAULT_SETTINGS.hero_title,
      hero_subtitle: settings.hero_subtitle || DEFAULT_SETTINGS.hero_subtitle,
      hero_label: settings.hero_label || DEFAULT_SETTINGS.hero_label,
      newsletter_title:
        settings.newsletter_title || DEFAULT_SETTINGS.newsletter_title,
      newsletter_description:
        settings.newsletter_description ||
        DEFAULT_SETTINGS.newsletter_description,
      newsletter_background_image:
        settings.newsletter_background_image ||
        DEFAULT_SETTINGS.newsletter_background_image,
      site_name: settings.site_name || DEFAULT_SETTINGS.site_name,
      site_tagline: settings.site_tagline || DEFAULT_SETTINGS.site_tagline,
    };
    return cache.siteSettings;
  } catch (error) {
    console.error("Error fetching site settings from Supabase:", error);
    cache.siteSettings = DEFAULT_SETTINGS;
    return DEFAULT_SETTINGS;
  }
}

// =============================================================================
// EVENTS — from Supabase
// =============================================================================

export interface SheetEvent {
  id: string;
  slug: string;
  title_en: string;
  title_fr?: string;
  title_es?: string;
  title_ar?: string;
  description_en: string;
  description_fr?: string;
  description_es?: string;
  description_ar?: string;
  category: string;
  region: string;
  city: string;
  venue?: string;
  startDate: string;
  endDate?: string;
  price_min?: number;
  price_max?: number;
  price_isFree: boolean;
  image?: string;
  tags: string[];
  lat?: number;
  lng?: number;
  organizer?: string;
  website?: string;
  email?: string;
  phone?: string;
  wheelchairAccess?: boolean;
  signLanguage?: boolean;
  audioDescription?: boolean;
  status: string;
}

export async function getSheetEvents(): Promise<SheetEvent[]> {
  if (cache.events !== null) {
    return cache.events;
  }

  try {
    const { data, error } = await getSupabase()
      .from("festivals")
      .select("*")
      .eq("status", "published")
      .order("start_date", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) {
      cache.events = [];
      return [];
    }

    const events: SheetEvent[] = data.map((row: any) => ({
      id: row.id,
      slug: row.id,
      title_en: row.title_en || row.id,
      title_fr: row.title_fr || "",
      title_es: row.title_es || "",
      title_ar: row.title_ar || "",
      description_en: row.description_en || "",
      description_fr: row.description_fr || "",
      description_es: row.description_es || "",
      description_ar: row.description_ar || "",
      category: row.category || "festival",
      region: row.region || "",
      city: row.city || "",
      venue: row.venue || "",
      startDate: row.start_date || "",
      endDate: row.end_date || row.start_date || "",
      price_min: parseFloat(row.price_min) || 0,
      price_max: parseFloat(row.price_max) || 0,
      price_isFree: row.price_is_free || false,
      image: row.image || "",
      tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [],
      lat: parseFloat(row.lat) || 0,
      lng: parseFloat(row.lng) || 0,
      organizer: row.organizer || "",
      website: row.website || "",
      email: row.email || "",
      phone: row.phone || "",
      wheelchairAccess: row.wheelchair_access || false,
      signLanguage: row.sign_language || false,
      audioDescription: row.audio_description || false,
      status: row.status || "published",
    }));

    console.log(
      "[Festivals] Loaded",
      events.length,
      "events from Supabase"
    );

    cache.events = events;
    return events;
  } catch (error) {
    console.error("Error fetching events from Supabase:", error);
    cache.events = [];
    return [];
  }
}

// Legacy compatibility — getSheetData for any generic table
export async function getSheetData(tabName: string): Promise<any[]> {
  if (tabName === "Festivals") {
    return getSheetEvents();
  }
  if (tabName === "Site_Settings") {
    const settings = await getSiteSettings();
    return Object.entries(settings).map(([key, value]) => ({ key, value }));
  }
  // Fallback — shouldn't be called for migrated tables
  console.warn(`[Festivals] getSheetData called for unmigrated tab: ${tabName}`);
  return [];
}
