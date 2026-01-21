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

// Get legal pages from Nexus
export async function getLegalPages(): Promise<LegalPage[]> {
  try {
    const legalPages = await getNexusData("Nexus_Legal_Pages");

    const siteLegalPages = legalPages.filter((p: any) =>
      !p.brand_id || p.brand_id === SITE_ID || p.brand_id === "all"
    );

    return siteLegalPages
      .filter((p: any) => p.page_slug && p.page_title)
      .map((p: any) => ({
        label: p.page_title,
        href: `/${p.page_slug}`,
      }));
  } catch (error) {
    console.error("Could not fetch legal pages from Nexus:", error);
    // Fallback legal pages
    return [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ];
  }
}
