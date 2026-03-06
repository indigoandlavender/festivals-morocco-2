import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoryBySlug, getStoryImages, getJourneys } from "@/lib/supabase";
import PhosphateContent from "./PhosphateContent";

const SLUG = "morocco-phosphate-mining";

export const revalidate = 3600;

export const metadata: Metadata = {
  title:
    "Morocco's Phosphate Kingdom — The Geology That Feeds the Planet | Slow Morocco",
  description:
    "Morocco holds 70% of the world's phosphate reserves. OCP Group, Khouribga, Jorf Lasfar, global fertiliser flows. An interactive data story on the mineral the world cannot live without.",
  keywords: [
    "Morocco phosphate",
    "OCP Group",
    "Khouribga",
    "Jorf Lasfar",
    "phosphate reserves",
    "Morocco mining",
    "phosphoric acid",
    "fertiliser exports",
    "Boucraa conveyor belt",
    "phosphate rock",
    "OCP Africa",
    "Morocco economy",
    "food security",
  ],
  openGraph: {
    title: "Morocco's Phosphate Kingdom | Slow Morocco",
    description:
      "5 mines, 2 processing hubs, 50 billion tonnes. How Morocco controls the mineral that feeds the world.",
    type: "article",
    siteName: "Slow Morocco",
  },
  twitter: {
    card: "summary_large_image",
    title: "Morocco's Phosphate Kingdom | Slow Morocco",
    description:
      "70% of the world's phosphate reserves sit under Moroccan soil. An interactive data story.",
  },
  alternates: {
    canonical: "https://www.slowmorocco.com/stories/morocco-phosphate-mining",
  },
};

const schemaGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Morocco's Phosphate Kingdom — The Geology That Feeds the Planet",
      description:
        "Morocco holds 70% of the world's phosphate reserves. An interactive data story on OCP Group, the mines, the value chain, and the export flows.",
      url: "https://www.slowmorocco.com/stories/morocco-phosphate-mining",
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
        "phosphate, OCP, mining, Khouribga, fertiliser, Jorf Lasfar, Morocco economy, export",
      about: [
        {
          "@type": "Thing",
          name: "Phosphate mining in Morocco",
          description:
            "Morocco contains approximately 70% of the world's phosphate rock reserves, primarily operated by OCP Group across four basins.",
        },
        {
          "@type": "Organization",
          name: "OCP Group",
          description:
            "Office Chérifien des Phosphates — Morocco's state-owned phosphate company. Founded 1920. Operates five mines and two processing complexes.",
        },
      ],
      inLanguage: "en",
    },
    {
      "@type": "Dataset",
      name: "Morocco Phosphate Industry Data",
      description:
        "Global phosphate reserve distribution, Morocco production (2010–2024), OCP revenue (2018–2024), export markets, mine profiles, value chain.",
      url: "https://www.slowmorocco.com/stories/morocco-phosphate-mining",
      creator: {
        "@type": "Organization",
        name: "Slow Morocco",
        url: "https://www.slowmorocco.com",
      },
      license: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
      isAccessibleForFree: true,
      inLanguage: "en",
    },
    {
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
            text: "OCP Group (Office Chérifien des Phosphates) is Morocco's state-owned phosphate mining and processing company. Founded in 1920, it operates all of Morocco's phosphate mines and two major chemical processing complexes.",
          },
        },
        {
          "@type": "Question",
          name: "Where are Morocco's phosphate mines?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Morocco's main phosphate operations are Khouribga (Ouled Abdoun basin), Benguerir and Youssoufia (Gantour basin), Boucraa (Southern Provinces, connected by a 102 km conveyor belt), and the new Mzinda mine.",
          },
        },
        {
          "@type": "Question",
          name: "Why is phosphate important for food security?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Phosphorus is essential for all plant growth and cannot be synthesised or substituted. Phosphate fertilisers are required to grow enough food for the global population, making Morocco's reserves a critical strategic resource.",
          },
        },
      ],
    },
    {
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
          name: "Morocco's Phosphate Kingdom",
          item: "https://www.slowmorocco.com/stories/morocco-phosphate-mining",
        },
      ],
    },
  ],
};

export default async function PhosphateMiningPage() {
  const [story, images, allJourneys] = await Promise.all([
    getStoryBySlug(SLUG),
    getStoryImages(SLUG),
    getJourneys(),
  ]);

  if (!story) return notFound();

  const relatedJourneys =
    allJourneys
      ?.filter(
        (j) =>
          j.title?.toLowerCase().includes("economy") ||
          j.title?.toLowerCase().includes("industry") ||
          j.title?.toLowerCase().includes("mining") ||
          j.category?.toLowerCase().includes("economy") ||
          j.category?.toLowerCase().includes("culture")
      )
      .slice(0, 2) || [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />
      <PhosphateContent
        story={story}
        images={images || []}
        relatedJourneys={relatedJourneys}
      />
    </>
  );
}
