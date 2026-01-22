import { google } from "googleapis";

const getGoogleSheetsClient = () => {
  const base64Creds = import.meta.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64Creds) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_BASE64 is not set");
  }

  const credentials = JSON.parse(
    Buffer.from(base64Creds, "base64").toString("utf-8")
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
};

// Nexus shared database (legal pages, etc.)
const NEXUS_SHEET_ID = "1OIw-cgup17vdimqveVNOmSBSrRbykuTVM39Umm-PJtQ";

// Festivals Morocco sheet
const SHEET_ID = import.meta.env.GOOGLE_SHEET_ID || "1LjfPpLzpuQEkeb34MYrrTFad_PM1wjiS4vPS67sNML0";

const SITE_ID = "festivals-morocco";

export interface LegalPage {
  label: string;
  href: string;
}

// Fetch data from Nexus shared database
export async function getNexusData(tabName: string): Promise<any[]> {
  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: NEXUS_SHEET_ID,
      range: `${tabName}!A1:ZZ`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return [];

    const headers = rows[0];
    return rows.slice(1).map((row) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });
  } catch (error: any) {
    console.error(`Error fetching Nexus sheet "${tabName}":`, error.message);
    return [];
  }
}

// Get legal pages from Nexus - filtered for content sites
export async function getLegalPages(): Promise<LegalPage[]> {
  try {
    const legalPages = await getNexusData("Nexus_Legal_Pages");

    // Get unique pages (sheet has multiple rows per page for sections)
    const uniquePages = new Map<string, string>();
    for (const p of legalPages) {
      if (p.page_id && p.page_title && !uniquePages.has(p.page_id)) {
        uniquePages.set(p.page_id, p.page_title);
      }
    }

    // Content sites need these specific legal pages in this order
    const contentLegalPageIds = ['privacy', 'terms', 'disclaimer', 'intellectual-property'];
    
    const result: LegalPage[] = [];
    for (const pageId of contentLegalPageIds) {
      const pageTitle = uniquePages.get(pageId);
      if (pageTitle) {
        result.push({
          label: pageTitle,
          href: `/${pageId}`,
        });
      }
    }

    console.log("[Festivals] Legal pages from Nexus:", result.map(p => p.label));
    return result.length > 0 ? result : getFallbackLegalPages();
  } catch (error) {
    console.error("Could not fetch legal pages from Nexus:", error);
    return getFallbackLegalPages();
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

// Get full content for a specific legal page
export async function getLegalPageContent(pageId: string): Promise<LegalPageContent | null> {
  try {
    const allPages = await getNexusData("Nexus_Legal_Pages");
    
    // Filter for the specific page
    const pageSections = allPages.filter((p: any) => p.page_id === pageId);
    
    if (pageSections.length === 0) {
      console.warn(`Legal page not found: ${pageId}`);
      return null;
    }
    
    // Sort by section_order and build content
    const sorted = pageSections.sort((a: any, b: any) => 
      parseInt(a.section_order) - parseInt(b.section_order)
    );
    
    // Replace template variables for Festivals Morocco
    const replacements: Record<string, string> = {
      '{{site_name}}': 'Festivals in Morocco',
      '{{site_url}}': 'https://festivalsinmorocco.com',
      '{{legal_entity}}': 'Dancing with Lions',
      '{{contact_email}}': 'hello@festivalsinmorocco.com',
      '{{jurisdiction_country}}': 'Morocco',
      '{{jurisdiction_city}}': 'Marrakech',
      '{{address_line1}}': '35 Derb Fhal Zfriti Kennaria',
      '{{address_line2}}': 'Marrakech 40000 Morocco',
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
      page_title: sorted[0].page_title,
      sections: sorted.map((s: any) => ({
        section_title: replaceVariables(s.section_title || ''),
        section_content: replaceVariables(s.section_content || ''),
      })),
    };
  } catch (error) {
    console.error(`Error fetching legal page ${pageId}:`, error);
    return null;
  }
}

// =============================================================================
// SITE SETTINGS - Hero & Newsletter Banners
// =============================================================================

export interface SiteSettings {
  // Hero section
  hero_image: string;
  hero_title: string;
  hero_subtitle: string;
  hero_label: string;
  
  // Newsletter section
  newsletter_title: string;
  newsletter_description: string;
  newsletter_background_image: string;
  
  // Site info
  site_name: string;
  site_tagline: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  hero_image: '',
  hero_title: 'Music lives here',
  hero_subtitle: 'From Gnawa trance ceremonies to world-class festivals — discover Morocco\'s living musical traditions',
  hero_label: 'Festivals in Morocco',
  newsletter_title: 'Stay in the rhythm',
  newsletter_description: 'Festivals, concerts, and cultural moments — delivered when they matter.',
  newsletter_background_image: '',
  site_name: 'Festivals in Morocco',
  site_tagline: 'Discover festivals and music events in Morocco',
};

// Fetch data from Festivals Morocco sheet
export async function getSheetData(tabName: string): Promise<any[]> {
  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${tabName}!A1:ZZ`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return [];

    const headers = rows[0];
    return rows.slice(1).map((row) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });
  } catch (error: any) {
    console.error(`Error fetching sheet "${tabName}":`, error.message);
    return [];
  }
}

// Get site settings from Google Sheets
// Sheet tab: Site_Settings with columns: key, value
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    console.log("[Festivals] Fetching Site_Settings from sheet:", SHEET_ID);
    const rows = await getSheetData("Site_Settings");
    
    console.log("[Festivals] Site_Settings rows returned:", rows.length);
    
    if (rows.length === 0) {
      console.log("[Festivals] No Site_Settings found, using defaults");
      return DEFAULT_SETTINGS;
    }
    
    // Convert rows to key-value object
    const settings: Record<string, string> = {};
    for (const row of rows) {
      console.log("[Festivals] Row:", row.key, "=", row.value?.substring?.(0, 50) || row.value);
      if (row.key && row.value !== undefined) {
        settings[row.key] = row.value;
      }
    }
    
    console.log("[Festivals] Loaded site settings keys:", Object.keys(settings));
    console.log("[Festivals] newsletter_background_image:", settings.newsletter_background_image?.substring(0, 60) || "(empty)");
    
    return {
      hero_image: settings.hero_image || DEFAULT_SETTINGS.hero_image,
      hero_title: settings.hero_title || DEFAULT_SETTINGS.hero_title,
      hero_subtitle: settings.hero_subtitle || DEFAULT_SETTINGS.hero_subtitle,
      hero_label: settings.hero_label || DEFAULT_SETTINGS.hero_label,
      newsletter_title: settings.newsletter_title || DEFAULT_SETTINGS.newsletter_title,
      newsletter_description: settings.newsletter_description || DEFAULT_SETTINGS.newsletter_description,
      newsletter_background_image: settings.newsletter_background_image || DEFAULT_SETTINGS.newsletter_background_image,
      site_name: settings.site_name || DEFAULT_SETTINGS.site_name,
      site_tagline: settings.site_tagline || DEFAULT_SETTINGS.site_tagline,
    };
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return DEFAULT_SETTINGS;
  }
}
