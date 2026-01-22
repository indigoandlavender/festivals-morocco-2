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
