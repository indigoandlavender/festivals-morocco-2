import type { Metadata } from "next";
import { getStoryBySlug, getStoryImages } from "@/lib/supabase";
import { matchJourneys } from "@/lib/content-matcher";
import PhosphateContent from "./PhosphateContent";

export const revalidate = 86400;

const SLUG = "phosphate-kingdom";

export const metadata: Metadata = {
  title: "The Phosphate Kingdom — Morocco's Geological Empire | Slow Morocco",
  description:
    "Morocco holds 70% of the world's phosphate reserves. OCP Group, Khouribga, Jorf Lasfar, global fertiliser flows, $9.8B revenue. The geology that feeds the planet.",
  keywords: [
    "Morocco phosphate",
    "OCP Group",
    "Khouribga mine",
    "Jorf Lasfar",
    "phosphate reserves",
    "Morocco economy",
    "phosphoric acid",
    "fertiliser",
    "Morocco mining",
    "phosphate rock",
    "OCP Africa",
    "Boucraa",
    "Morocco exports",
  ],
  openGraph: {
    title: "The Phosphate Kingdom | Slow Morocco",
    description:
      "5 mines, 2 processing hubs, 50 billion tonnes. How Morocco controls the mineral that feeds the world.",
    type: "article",
    siteName: "Slow Morocco",
  },
  alternates: {
    canonical: "https://www.slowmorocco.com/stories/phosphate-kingdom",
  },
};

// ── JSON-LD structured data ──────────────────────────────────────

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The Phosphate Kingdom — Morocco's Geological Empire",
  description:
    "Morocco holds 70% of the world's phosphate reserves. An interactive data story exploring OCP Group, the mines, the value chain, and the export flows that feed the planet.",
  url: "https://www.slowmorocco.com/stories/phosphate-kingdom",
  author: {
    "@type": "Organization",
    name: "Slow Morocco",
    url: "https://www.slowmorocco.com",
  },
  publisher: {
    "@type": "Organization",
    name: "Slow Morocco",
    url: "https://www.slowmorocco.com",
  },
  articleSection: "Economy",
  keywords:
    "phosphate, ocp, mining, khouribga, fertiliser, jorf lasfar, morocco economy, export",
  about: [
    {
      "@type": "Thing",
      name: "Phosphate mining in Morocco",
      description:
        "Morocco contains approximately 70% of the world's phosphate rock reserves, primarily operated by OCP Group.",
    },
    {
      "@type": "Organization",
      name: "OCP Group",
      description:
        "Office Chérifien des Phosphates — Morocco's state-owned phosphate mining and processing company, one of the world's largest fertiliser producers.",
    },
  ],
  inLanguage: "en",
};

const datasetSchema = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Morocco Phosphate Industry Data — Reserves, Production, Revenue, Exports",
  description:
    "Global phosphate reserve distribution, Morocco production history (2010–2024), OCP Group revenue (2018–2024), export market breakdown, mine profiles, and value chain data.",
  url: "https://www.slowmorocco.com/stories/phosphate-kingdom",
  creator: {
    "@type": "Organization",
    name: "Slow Morocco",
    url: "https://www.slowmorocco.com",
  },
  license: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  keywords:
    "phosphate reserves, OCP revenue, Morocco production, fertiliser exports, Khouribga, Jorf Lasfar",
  isAccessibleForFree: true,
  inLanguage: "en",
  distribution: {
    "@type": "DataDownload",
    contentUrl: "https://www.slowmorocco.com/stories/phosphate-kingdom",
    encodingFormat: "text/html",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much of the world's phosphate does Morocco have?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Morocco holds approximately 70% of the world's known phosphate rock reserves — roughly 50 billion tonnes, primarily in the Ouled Abdoun and Gantour basins.",
      },
    },
    {
      "@type": "Question",
      name: "What is OCP Group?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OCP Group (Office Chérifien des Phosphates) is Morocco's state-owned phosphate mining and chemical processing company. Founded in 1920, it operates all five of Morocco's phosphate mines and reported $9.8 billion in revenue in 2024.",
      },
    },
    {
      "@type": "Question",
      name: "Where are Morocco's phosphate mines?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Morocco's five main phosphate operations are Khouribga (Ouled Abdoun basin), Benguerir and Youssoufia (Gantour basin), Boucraa (Southern Provinces), and the upcoming Mzinda mine launching in 2025.",
      },
    },
    {
      "@type": "Question",
      name: "Why is phosphate important for food security?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Phosphorus is an essential nutrient for all plant growth and cannot be synthesised or substituted. Phosphate-based fertilisers are required to feed the world's population, making Morocco's reserves a strategic global resource.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Stories",
      item: "https://www.slowmorocco.com/stories",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Economy",
      item: "https://www.slowmorocco.com/stories/category/economy",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "The Phosphate Kingdom",
      item: "https://www.slowmorocco.com/stories/phosphate-kingdom",
    },
  ],
};

// ── Page component ───────────────────────────────────────────────

async function fetchData() {
  try {
    const [story, images] = await Promise.all([
      getStoryBySlug(SLUG),
      getStoryImages(SLUG),
    ]);

    const relatedJourneys = story
      ? await matchJourneys(story, { limit: 2, tags: ["economy", "industry", "khouribga"] })
      : [];

    return { story, images, relatedJourneys };
  } catch (error) {
    console.error("Error fetching phosphate story data:", error);
    return { story: null, images: [], relatedJourneys: [] };
  }
}

export default async function PhosphateKingdomPage() {
  const { story, images, relatedJourneys } = await fetchData();

  const storyData = {
    title: story?.title || "The Phosphate Kingdom",
    subtitle:
      story?.subtitle ||
      "Morocco holds 70% of the world's phosphate. OCP Group mines it, processes it, and ships it to 160 countries. The geology that feeds the planet.",
    hero_image: story?.hero_image || null,
    hero_caption: story?.hero_caption || null,
    body: story?.body || null,
    year: story?.year || 2025,
    read_time: story?.read_time || 12,
    text_by: story?.text_by || "Slow Morocco",
    category: story?.category || "Economy",
    region: story?.region || "Casablanca-Settat",
    sources: story?.sources || null,
  };

  const storyImages = (images || []).map(
    (img: { image_url: string; caption: string | null; attribution: string | null; position: number }) => ({
      image_url: img.image_url,
      caption: img.caption,
      attribution: img.attribution,
      position: img.position,
    })
  );

  const journeys = (relatedJourneys || []).map(
    (j: { slug: string; title: string; duration_days?: number | null; hero_image_url?: string | null; short_description?: string | null }) => ({
      slug: j.slug,
      title: j.title,
      duration_days: j.duration_days || null,
      hero_image_url: j.hero_image_url || null,
      short_description: j.short_description || null,
    })
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            articleSchema,
            datasetSchema,
            faqSchema,
            breadcrumbSchema,
          ]),
        }}
      />
      <PhosphateContent
        story={storyData}
        images={storyImages}
        relatedJourneys={journeys}
      />
    </>
  );
}
