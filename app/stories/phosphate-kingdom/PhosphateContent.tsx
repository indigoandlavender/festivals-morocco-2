"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as d3 from "d3";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface Story {
  title: string;
  subtitle?: string | null;
  hero_image?: string | null;
  hero_caption?: string | null;
  body?: string | null;
  year?: number | null;
  read_time?: number | null;
  text_by?: string | null;
  category?: string | null;
  region?: string | null;
  sources?: string | null;
}

interface StoryImage {
  image_url: string;
  caption: string | null;
  attribution: string | null;
  position: number;
}

interface Journey {
  slug: string;
  title: string;
  duration_days?: number | null;
  hero_image_url?: string | null;
  short_description?: string | null;
}

interface Props {
  story: Story;
  images: StoryImage[];
  relatedJourneys: Journey[];
}

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const GLOBAL_RESERVES = [
  { country: "Morocco", reserves: 50000, pct: 70, color: "#c9a96e" },
  { country: "China", reserves: 3200, pct: 4.5, color: "#737373" },
  { country: "Egypt", reserves: 2800, pct: 3.9, color: "#737373" },
  { country: "Algeria", reserves: 2200, pct: 3.1, color: "#737373" },
  { country: "Syria", reserves: 1800, pct: 2.5, color: "#737373" },
  { country: "Brazil", reserves: 1600, pct: 2.2, color: "#737373" },
  { country: "Saudi Arabia", reserves: 1400, pct: 2.0, color: "#737373" },
  { country: "Rest of world", reserves: 8500, pct: 11.8, color: "#d4d4d4" },
];

const PRODUCTION_HISTORY = [
  { year: 2010, morocco: 26.6, china: 68.0, world: 181 },
  { year: 2011, morocco: 28.0, china: 81.0, world: 198 },
  { year: 2012, morocco: 28.0, china: 89.0, world: 207 },
  { year: 2013, morocco: 26.4, china: 100.0, world: 224 },
  { year: 2014, morocco: 30.0, china: 100.0, world: 225 },
  { year: 2015, morocco: 29.0, china: 120.0, world: 235 },
  { year: 2016, morocco: 30.0, china: 138.0, world: 255 },
  { year: 2017, morocco: 33.0, china: 140.0, world: 263 },
  { year: 2018, morocco: 33.0, china: 140.0, world: 270 },
  { year: 2019, morocco: 36.0, china: 110.0, world: 240 },
  { year: 2020, morocco: 37.0, china: 90.0, world: 223 },
  { year: 2021, morocco: 38.0, china: 85.0, world: 220 },
  { year: 2022, morocco: 40.0, china: 85.0, world: 226 },
  { year: 2023, morocco: 40.0, china: 80.0, world: 220 },
  { year: 2024, morocco: 42.0, china: 80.0, world: 225 },
];

const MINES = [
  {
    name: "Khouribga",
    basin: "Ouled Abdoun",
    lat: 32.88,
    lng: -6.91,
    reserves: "26+ billion tonnes",
    output: "70% of OCP output",
    note: "The richest phosphate deposit on Earth. OCP's first mine, operational since 1921.",
    color: "#c9a96e",
  },
  {
    name: "Benguerir",
    basin: "Gantour",
    lat: 32.23,
    lng: -7.96,
    reserves: "Part of 37% share",
    output: "Open-pit extraction",
    note: "Home to UM6P — Mohammed VI Polytechnic University, Africa's leading research campus for sustainable mining.",
    color: "#2d7a5a",
  },
  {
    name: "Youssoufia",
    basin: "Gantour",
    lat: 32.25,
    lng: -8.53,
    reserves: "Part of 37% share",
    output: "Underground + open-pit",
    note: "Operating since 1931. Combined underground and surface extraction across the Gantour basin.",
    color: "#4a9aba",
  },
  {
    name: "Boucraa",
    basin: "Southern Provinces",
    lat: 26.35,
    lng: -12.85,
    reserves: "~2% of output",
    output: "Connected to Laayoune port",
    note: "Linked to Laayoune by the world's longest conveyor belt — 102 km of phosphate rock moving through the Sahara.",
    color: "#c04040",
  },
  {
    name: "Mzinda",
    basin: "Next generation",
    lat: 32.05,
    lng: -7.35,
    reserves: "New development",
    output: "Green technology",
    note: "Launching 2025 — the next generation of phosphate infrastructure, built from scratch with green technology.",
    color: "#9b8db0",
  },
];

const PROCESSING_HUBS = [
  {
    name: "Jorf Lasfar",
    lat: 33.12,
    lng: -8.63,
    desc: "World's largest phosphate processing complex. Converts raw rock into phosphoric acid and fertilizer for global export.",
  },
  {
    name: "Safi",
    lat: 32.30,
    lng: -9.23,
    desc: "Morocco's second processing hub. Specialises in phosphoric acid and fertilizer products for West African and European markets.",
  },
];

const VALUE_CHAIN = [
  { step: "01", title: "Extraction", desc: "Open-pit and underground mining across four basins. Draglines, excavators, and blasting to reach phosphate seams 10–40 metres below surface." },
  { step: "02", title: "Beneficiation", desc: "Raw rock is washed, screened, and concentrated. Removes clay, sand, and impurities. Raises P₂O₅ content from 25% to 32%+." },
  { step: "03", title: "Transport", desc: "Slurry pipeline (187 km, Khouribga → Jorf Lasfar), rail, and the world's longest conveyor belt (102 km, Boucraa → Laayoune)." },
  { step: "04", title: "Chemical processing", desc: "Sulphuric acid + phosphate rock → phosphoric acid. The base ingredient for virtually all phosphate fertilisers worldwide." },
  { step: "05", title: "Fertiliser production", desc: "100+ fertiliser grades — DAP, MAP, TSP, NPK blends. Customised for soil conditions across 160+ countries." },
  { step: "06", title: "Global export", desc: "Ships from Jorf Lasfar and Safi to Africa, South Asia, Latin America, and Europe. Morocco supplies nearly half the world's phosphoric acid." },
];

const EXPORT_REGIONS = [
  { region: "Africa", pct: 32, color: "#c9a96e", note: "OCP's largest growth market. 15+ subsidiaries across the continent." },
  { region: "South Asia", pct: 26, color: "#2d7a5a", note: "India is the single largest buyer. Long-term supply agreements with Indian fertiliser companies." },
  { region: "Latin America", pct: 18, color: "#4a9aba", note: "Brazil's industrial agriculture depends on Moroccan phosphate for soybean and corn production." },
  { region: "Europe", pct: 14, color: "#9b8db0", note: "Legacy market. Declining share as OCP pivots toward emerging economies." },
  { region: "Other", pct: 10, color: "#d4d4d4", note: "North America, Middle East, Southeast Asia." },
];

const TIMELINE = [
  { year: 1921, event: "OCP founded. First extraction at Khouribga begins under French protectorate." },
  { year: 1931, event: "Youssoufia mine opens. Morocco's second major phosphate basin enters production." },
  { year: 1956, event: "Independence. Morocco nationalises phosphate operations under OCP." },
  { year: 1975, event: "Boucraa mine integrated after the Green March. 102 km conveyor belt built." },
  { year: 1998, event: "Jorf Lasfar processing complex opens. Transforms Morocco from raw-rock exporter to chemical producer." },
  { year: 2008, event: "Global food crisis. Phosphate prices spike 800%. Morocco's strategic reserves become geopolitical leverage." },
  { year: 2014, event: "OCP Africa launched. Subsidiaries in 15+ countries to supply African farmers directly." },
  { year: 2016, event: "187 km slurry pipeline opens (Khouribga → Jorf Lasfar). Eliminates rail dependency, cuts water use 3×." },
  { year: 2023, event: "UM6P ranks as Africa's top research university. Green mining and circular economy programmes expand." },
  { year: 2025, event: "Mzinda mine launches. Next-generation green extraction. OCP targets 2040 carbon neutrality." },
];

const OCP_REVENUE = [
  { year: 2018, revenue: 5.6 },
  { year: 2019, revenue: 5.3 },
  { year: 2020, revenue: 5.4 },
  { year: 2021, revenue: 9.4 },
  { year: 2022, revenue: 11.3 },
  { year: 2023, revenue: 8.2 },
  { year: 2024, revenue: 9.8 },
];

// ─────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, vis };
}

function useCounter(target: number, duration = 1600, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return val;
}

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, vis } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(20px)",
        transition: `opacity 0.85s ease ${delay}s, transform 0.85s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function AnimStat({
  value,
  suffix = "",
  label,
  accent,
  prefix = "",
}: {
  value: number;
  suffix?: string;
  label: string;
  accent: string;
  prefix?: string;
}) {
  const { ref, vis } = useInView();
  const n = useCounter(value, 1600, vis);
  return (
    <div ref={ref} className="text-center">
      <div
        className="font-serif leading-none mb-2"
        style={{ fontSize: "clamp(2.4rem,5vw,3.6rem)", color: accent }}
      >
        {prefix}
        {n.toLocaleString()}
        {suffix}
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
    </div>
  );
}

function BodyChunk({ content }: { content: string }) {
  if (!content) return null;
  const isHtml = /<[a-z][^>]*>/i.test(content);
  if (isHtml) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        style={{ fontSize: 15, lineHeight: 1.85, color: "#262626" }}
      />
    );
  }
  return (
    <div>
      {content
        .split(/\n\n+/)
        .filter(Boolean)
        .map((p, i) => (
          <p
            key={i}
            className="mb-6 leading-[1.85]"
            style={{ fontSize: 15, color: "#262626" }}
          >
            {p}
          </p>
        ))}
    </div>
  );
}

function splitBody(content: string, breakAt: number[]): string[] {
  const isHtml = /<[a-z][^>]*>/i.test(content);
  const paragraphs = isHtml
    ? content
        .split(/(?<=<\/p>)/i)
        .map((s) => s.trim())
        .filter(Boolean)
    : content.split(/\n\n+/).filter(Boolean);
  const chunks: string[] = [];
  let last = 0;
  breakAt.forEach((bp) => {
    const end = Math.min(bp, paragraphs.length);
    chunks.push(paragraphs.slice(last, end).join(isHtml ? "\n" : "\n\n"));
    last = end;
  });
  if (last < paragraphs.length)
    chunks.push(paragraphs.slice(last).join(isHtml ? "\n" : "\n\n"));
  return chunks.filter(Boolean);
}

// ─────────────────────────────────────────────
// CHARTS
// ─────────────────────────────────────────────

function ReservesChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { ref, vis } = useInView(0.15);

  useEffect(() => {
    if (!svgRef.current || !vis) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const W = 820,
      H = 320;
    const m = { top: 8, right: 100, bottom: 8, left: 120 };
    const w = W - m.left - m.right,
      h = H - m.top - m.bottom;

    svg
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
    const g = svg
      .append("g")
      .attr("transform", `translate(${m.left},${m.top})`);

    const sorted = [...GLOBAL_RESERVES].sort((a, b) => b.reserves - a.reserves);
    const max = d3.max(sorted, (d) => d.reserves) || 1;
    const y = d3
      .scaleBand()
      .domain(sorted.map((d) => d.country))
      .range([0, h])
      .padding(0.3);
    const x = d3
      .scaleLinear()
      .domain([0, max * 1.15])
      .range([0, w]);

    g.selectAll(".bar")
      .data(sorted)
      .enter()
      .append("rect")
      .attr("y", (d) => y(d.country) ?? 0)
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("rx", 2)
      .attr("fill", (d) => d.color)
      .attr("width", 0)
      .transition()
      .duration(700)
      .delay((_, i) => i * 60)
      .attr("width", (d) => x(d.reserves));

    g.selectAll(".val")
      .data(sorted)
      .enter()
      .append("text")
      .attr("y", (d) => (y(d.country) ?? 0) + y.bandwidth() / 2 + 4)
      .attr("x", (d) => x(d.reserves) + 8)
      .attr("font-family", "monospace")
      .attr("font-size", 11)
      .attr("fill", "#888")
      .attr("opacity", 0)
      .text((d) => `${d.pct}%`)
      .transition()
      .duration(400)
      .delay((_, i) => i * 60 + 500)
      .attr("opacity", 1);

    g.selectAll(".lbl")
      .data(sorted)
      .enter()
      .append("text")
      .attr("y", (d) => (y(d.country) ?? 0) + y.bandwidth() / 2 + 4)
      .attr("x", -8)
      .attr("text-anchor", "end")
      .attr("font-family", "monospace")
      .attr("font-size", 11)
      .attr("fill", "#555")
      .text((d) => d.country);
  }, [vis]);

  return (
    <div ref={ref}>
      <svg ref={svgRef} className="w-full" />
      <p className="font-mono text-[10px] text-neutral-300 mt-3">
        Reserves in million tonnes · Source: USGS Mineral Commodity Summaries
        2024
      </p>
    </div>
  );
}

function ProductionChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { ref, vis } = useInView(0.15);

  useEffect(() => {
    if (!svgRef.current || !vis) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const W = 820,
      H = 340;
    const m = { top: 20, right: 60, bottom: 40, left: 50 };
    const w = W - m.left - m.right,
      h = H - m.top - m.bottom;

    svg
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
    const g = svg
      .append("g")
      .attr("transform", `translate(${m.left},${m.top})`);

    const x = d3
      .scaleLinear()
      .domain([2010, 2024])
      .range([0, w]);
    const y = d3
      .scaleLinear()
      .domain([0, 280])
      .range([h, 0]);

    // Grid lines
    g.selectAll(".grid")
      .data([50, 100, 150, 200, 250])
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", w)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", "#f0f0f0")
      .attr("stroke-width", 1);

    // Y-axis labels
    g.selectAll(".ylbl")
      .data([50, 100, 150, 200, 250])
      .enter()
      .append("text")
      .attr("x", -8)
      .attr("y", (d) => y(d) + 4)
      .attr("text-anchor", "end")
      .attr("font-family", "monospace")
      .attr("font-size", 10)
      .attr("fill", "#bbb")
      .text((d) => `${d}`);

    // X-axis labels
    g.selectAll(".xlbl")
      .data([2010, 2014, 2018, 2022, 2024])
      .enter()
      .append("text")
      .attr("x", (d) => x(d))
      .attr("y", h + 28)
      .attr("text-anchor", "middle")
      .attr("font-family", "monospace")
      .attr("font-size", 10)
      .attr("fill", "#bbb")
      .text((d) => d);

    const drawLine = (
      key: "morocco" | "china" | "world",
      color: string,
      label: string,
      dasharray?: string
    ) => {
      const line = d3
        .line<(typeof PRODUCTION_HISTORY)[0]>()
        .x((d) => x(d.year))
        .y((d) => y(d[key]))
        .curve(d3.curveMonotoneX);

      const path = g
        .append("path")
        .datum(PRODUCTION_HISTORY)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", key === "morocco" ? 2.5 : 1.5)
        .attr("d", line);

      if (dasharray) path.attr("stroke-dasharray", dasharray);

      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr("stroke-dasharray", dasharray || `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", dasharray ? 0 : totalLength)
        .transition()
        .duration(1400)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      const last = PRODUCTION_HISTORY[PRODUCTION_HISTORY.length - 1];
      g.append("text")
        .attr("x", x(last.year) + 8)
        .attr("y", y(last[key]) + 4)
        .attr("font-family", "monospace")
        .attr("font-size", 10)
        .attr("fill", color)
        .attr("opacity", 0)
        .text(label)
        .transition()
        .delay(1200)
        .duration(400)
        .attr("opacity", 1);
    };

    drawLine("world", "#d4d4d4", "World", "4,4");
    drawLine("china", "#737373", "China");
    drawLine("morocco", "#c9a96e", "Morocco");

    // Unit label
    g.append("text")
      .attr("x", 0)
      .attr("y", -8)
      .attr("font-family", "monospace")
      .attr("font-size", 9)
      .attr("fill", "#bbb")
      .text("Million tonnes");
  }, [vis]);

  return (
    <div ref={ref}>
      <svg ref={svgRef} className="w-full" />
      <p className="font-mono text-[10px] text-neutral-300 mt-3">
        Annual phosphate rock production · Source: USGS, OCP Annual Reports
      </p>
    </div>
  );
}

function RevenueChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { ref, vis } = useInView(0.15);

  useEffect(() => {
    if (!svgRef.current || !vis) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const W = 600,
      H = 260;
    const m = { top: 20, right: 40, bottom: 40, left: 50 };
    const w = W - m.left - m.right,
      h = H - m.top - m.bottom;

    svg
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
    const g = svg
      .append("g")
      .attr("transform", `translate(${m.left},${m.top})`);

    const x = d3
      .scaleBand()
      .domain(OCP_REVENUE.map((d) => String(d.year)))
      .range([0, w])
      .padding(0.35);
    const y = d3
      .scaleLinear()
      .domain([0, 13])
      .range([h, 0]);

    // Grid
    g.selectAll(".grid")
      .data([3, 6, 9, 12])
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", w)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", "#f5f5f5")
      .attr("stroke-width", 1);

    // Bars
    g.selectAll(".bar")
      .data(OCP_REVENUE)
      .enter()
      .append("rect")
      .attr("x", (d) => x(String(d.year)) ?? 0)
      .attr("width", x.bandwidth())
      .attr("y", h)
      .attr("height", 0)
      .attr("rx", 2)
      .attr("fill", (d) =>
        d.year === 2022 ? "#c9a96e" : d.year === 2024 ? "#c9a96e" : "#e5e5e5"
      )
      .transition()
      .duration(700)
      .delay((_, i) => i * 80)
      .attr("y", (d) => y(d.revenue))
      .attr("height", (d) => h - y(d.revenue));

    // Values
    g.selectAll(".val")
      .data(OCP_REVENUE)
      .enter()
      .append("text")
      .attr(
        "x",
        (d) => (x(String(d.year)) ?? 0) + x.bandwidth() / 2
      )
      .attr("y", (d) => y(d.revenue) - 8)
      .attr("text-anchor", "middle")
      .attr("font-family", "monospace")
      .attr("font-size", 10)
      .attr("fill", "#888")
      .attr("opacity", 0)
      .text((d) => `$${d.revenue}B`)
      .transition()
      .delay((_, i) => i * 80 + 500)
      .duration(300)
      .attr("opacity", 1);

    // X labels
    g.selectAll(".xlbl")
      .data(OCP_REVENUE)
      .enter()
      .append("text")
      .attr(
        "x",
        (d) => (x(String(d.year)) ?? 0) + x.bandwidth() / 2
      )
      .attr("y", h + 24)
      .attr("text-anchor", "middle")
      .attr("font-family", "monospace")
      .attr("font-size", 10)
      .attr("fill", "#bbb")
      .text((d) => d.year);
  }, [vis]);

  return (
    <div ref={ref}>
      <svg ref={svgRef} className="w-full" />
      <p className="font-mono text-[10px] text-neutral-300 mt-3">
        OCP Group annual revenue (USD billions) · Source: OCP Annual Reports
      </p>
    </div>
  );
}

function ExportDonut() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { ref, vis } = useInView(0.15);

  useEffect(() => {
    if (!svgRef.current || !vis) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const W = 400,
      H = 400;
    const radius = 160;
    const inner = 90;

    svg
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
    const g = svg.append("g").attr("transform", `translate(${W / 2},${H / 2})`);

    const pie = d3
      .pie<(typeof EXPORT_REGIONS)[0]>()
      .value((d) => d.pct)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<(typeof EXPORT_REGIONS)[0]>>()
      .innerRadius(inner)
      .outerRadius(radius);

    const arcs = g
      .selectAll(".arc")
      .data(pie(EXPORT_REGIONS))
      .enter()
      .append("g");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("opacity", 0)
      .transition()
      .duration(600)
      .delay((_, i) => i * 120)
      .attr("opacity", 1);

    // Labels
    arcs
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-family", "monospace")
      .attr("font-size", 11)
      .attr("fill", "#fff")
      .attr("font-weight", "600")
      .attr("opacity", 0)
      .text((d) => `${d.data.pct}%`)
      .transition()
      .delay((_, i) => i * 120 + 400)
      .duration(300)
      .attr("opacity", 1);

    // Center text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("y", -8)
      .attr("font-family", "serif")
      .attr("font-size", 28)
      .attr("font-style", "italic")
      .attr("fill", "#262626")
      .text("160+");
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 16)
      .attr("font-family", "monospace")
      .attr("font-size", 9)
      .attr("fill", "#999")
      .attr("text-transform", "uppercase")
      .attr("letter-spacing", "0.1em")
      .text("COUNTRIES");
  }, [vis]);

  return (
    <div ref={ref}>
      <svg ref={svgRef} className="w-full max-w-sm mx-auto" />
    </div>
  );
}

// ─────────────────────────────────────────────
// MINE MAP (static fallback — no Mapbox token)
// ─────────────────────────────────────────────

function MineMap() {
  const [active, setActive] = useState(0);
  const { ref, vis } = useInView(0.1);

  return (
    <div
      ref={ref}
      style={{ opacity: vis ? 1 : 0, transition: "opacity 0.8s ease" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-neutral-100">
        {/* Mine list */}
        <div className="border-r border-neutral-100">
          {MINES.map((mine, i) => (
            <button
              key={mine.name}
              onClick={() => setActive(i)}
              className="w-full text-left px-6 py-5 border-b border-neutral-100 transition-all"
              style={{
                background: active === i ? "#0a0a0a" : "transparent",
                color: active === i ? "#fff" : "#555",
              }}
            >
              <span
                className="font-mono text-[9px] uppercase tracking-[0.2em] block mb-0.5"
                style={{ color: active === i ? mine.color : "#bbb" }}
              >
                {mine.basin}
              </span>
              <span className="font-serif text-base">{mine.name}</span>
            </button>
          ))}
        </div>
        {/* Detail panel */}
        <div className="p-8 flex items-start" style={{ minHeight: 280 }}>
          <div>
            <div
              className="w-3 h-3 rounded-full mb-4"
              style={{ background: MINES[active].color }}
            />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-3">
              Mine {String(active + 1).padStart(2, "0")} of {MINES.length}
            </p>
            <h3 className="font-serif text-2xl mb-4">{MINES[active].name}</h3>
            <p
              style={{ fontSize: 14, lineHeight: 1.85, color: "#555" }}
              className="mb-4"
            >
              {MINES[active].note}
            </p>
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <div className="flex justify-between">
                <span className="font-mono text-[10px] text-neutral-400">
                  Reserves
                </span>
                <span className="font-mono text-[11px] text-neutral-700">
                  {MINES[active].reserves}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[10px] text-neutral-400">
                  Output
                </span>
                <span className="font-mono text-[11px] text-neutral-700">
                  {MINES[active].output}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

export default function PhosphateContent({
  story,
  images,
  relatedJourneys,
}: Props) {
  const chunks = story.body ? splitBody(story.body, [3, 6]) : [];
  const [c1 = "", c2 = "", c3 = ""] = chunks;
  const sources = story.sources
    ? story.sources
        .split(";;")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section>
        {story.hero_image ? (
          <div
            className="relative w-full"
            style={{ height: "70vh", minHeight: 480 }}
          >
            <img
              src={story.hero_image}
              alt={story.title}
              className="w-full h-full object-cover absolute inset-0"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.80) 100%)",
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 px-8 md:px-[8%] lg:px-[12%] pb-14">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">
                <Link
                  href="/stories/category/economy"
                  className="hover:text-white/80 transition-colors"
                >
                  Economy
                </Link>
                {" · "}
                <Link
                  href="/stories"
                  className="hover:text-white/80 transition-colors"
                >
                  Stories
                </Link>
              </p>
              <h1
                className="font-serif text-white leading-[0.92] tracking-tight mb-4"
                style={{ fontSize: "clamp(2.4rem,6.5vw,4.8rem)" }}
              >
                {story.title}
              </h1>
              {story.subtitle && (
                <p className="font-serif italic text-white/70 text-xl max-w-2xl">
                  {story.subtitle}
                </p>
              )}
              <div className="flex items-center gap-4 mt-5 font-mono text-[11px] text-white/40">
                {story.text_by && <span>By {story.text_by}</span>}
                {story.year && <span>{story.year}</span>}
                {story.read_time && <span>{story.read_time} min read</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-8 md:px-[8%] lg:px-[12%] pt-32 pb-16 border-b border-neutral-100">
            <Link
              href="/stories"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-300 hover:text-neutral-600 transition-colors inline-block mb-10"
            >
              ← Stories
            </Link>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
              Economy
            </p>
            <h1
              className="font-serif leading-[0.92] tracking-tight mb-5"
              style={{ fontSize: "clamp(2.4rem,6.5vw,4.8rem)" }}
            >
              {story.title}
            </h1>
            {story.subtitle && (
              <p className="font-serif italic text-2xl text-neutral-500">
                {story.subtitle}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ━━━ STATS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="px-8 md:px-[8%] lg:px-[12%] py-14 border-b border-neutral-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <AnimStat value={70} suffix="%" label="of world reserves" accent="#c9a96e" />
          <AnimStat value={50} suffix="B" label="tonnes in reserve" accent="#2d7a5a" />
          <AnimStat value={42} suffix="M" label="tonnes / year" accent="#4a9aba" />
          <AnimStat
            value={9} suffix=".8B" label="OCP revenue (USD)" accent="#c04040" prefix="$"
          />
        </div>
      </section>

      {/* ━━━ BODY 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {c1 && (
        <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7">
              <Reveal>
                <BodyChunk content={c1} />
              </Reveal>
            </div>
            <div className="lg:col-span-4 lg:col-start-9">
              <Reveal delay={0.15}>
                <div className="sticky top-24 border-l-2 border-neutral-200 pl-6 space-y-5">
                  <p className="font-serif italic text-xl leading-snug text-neutral-600">
                    &ldquo;Without phosphate, the world doesn&rsquo;t eat. And
                    70% of the world&rsquo;s phosphate sits under Moroccan
                    soil.&rdquo;
                  </p>
                  <div className="space-y-4 pt-2">
                    {[
                      {
                        label: "OCP Group",
                        note: "Office Chérifien des Phosphates · founded 1920 · sole operator of all Moroccan phosphate mines and processing",
                      },
                      {
                        label: "P\u2082O\u2085",
                        note: "Phosphorus pentoxide · the active ingredient measured in fertiliser · Morocco's rock averages 30-33%",
                      },
                      {
                        label: "Jorf Lasfar",
                        note: "World's largest integrated phosphate processing complex · converts rock into acid and fertiliser for 160+ countries",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="border-t border-neutral-100 pt-3"
                      >
                        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-neutral-400 mb-0.5">
                          {item.label}
                        </p>
                        <p className="font-mono text-[11px] text-neutral-500 leading-relaxed">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ━━━ GLOBAL RESERVES ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
        <Reveal>
          <div className="mb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
              The reserves
            </p>
            <h2 className="font-serif text-3xl leading-tight max-w-md">
              <em>
                One country holds
                <br />
                what everyone needs
              </em>
            </h2>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <ReservesChart />
        </Reveal>
      </section>

      {/* ━━━ MINE MAP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
        <Reveal>
          <div className="mb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
              The mines
            </p>
            <h2 className="font-serif text-3xl leading-tight max-w-md">
              <em>
                Five operations,
                <br />
                one geological empire
              </em>
            </h2>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <MineMap />
        </Reveal>
      </section>

      {/* ━━━ PRODUCTION HISTORY ━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-10">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
                Production
              </p>
              <h2 className="font-serif text-3xl leading-tight">
                <em>
                  China mines more.
                  <br />
                  Morocco owns more.
                </em>
              </h2>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.85, color: "#737373" }}>
              China leads annual production. But it&rsquo;s burning through its
              reserves — projected to run out within 35 years. Morocco&rsquo;s
              50 billion tonnes will last centuries. The geology is the strategy.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <ProductionChart />
        </Reveal>
      </section>

      {/* ━━━ BODY 2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {c2 && (
        <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
          <div className="max-w-2xl">
            <Reveal>
              <BodyChunk content={c2} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ━━━ VALUE CHAIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
        <Reveal>
          <div className="mb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
              The value chain
            </p>
            <h2 className="font-serif text-3xl leading-tight max-w-md">
              <em>
                From rock face
                <br />
                to rice paddy
              </em>
            </h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
          {VALUE_CHAIN.map((step, i) => (
            <Reveal key={step.step} delay={i * 0.06}>
              <div
                className="border border-neutral-100 p-8"
                style={{ minHeight: 200 }}
              >
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.2em] block mb-3"
                  style={{ color: "#c9a96e" }}
                >
                  {step.step}
                </span>
                <h3 className="font-serif text-lg mb-3">{step.title}</h3>
                <p
                  style={{ fontSize: 13, lineHeight: 1.85, color: "#737373" }}
                >
                  {step.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ━━━ EXPORT FLOWS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
        <Reveal>
          <div className="mb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
              Export markets
            </p>
            <h2 className="font-serif text-3xl leading-tight max-w-md">
              <em>
                Where the fertiliser
                <br />
                goes
              </em>
            </h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <Reveal>
            <ExportDonut />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-6">
              {EXPORT_REGIONS.map((er) => (
                <div
                  key={er.region}
                  className="border-t border-neutral-100 pt-4"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: er.color }}
                    />
                    <span className="font-mono text-[11px] font-medium text-neutral-700">
                      {er.region}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-400 ml-auto">
                      {er.pct}%
                    </span>
                  </div>
                  <p
                    className="pl-[22px]"
                    style={{ fontSize: 13, lineHeight: 1.7, color: "#999" }}
                  >
                    {er.note}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ━━━ OCP REVENUE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-10">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
                The money
              </p>
              <h2 className="font-serif text-3xl leading-tight">
                <em>
                  Revenue that tracks
                  <br />
                  global hunger
                </em>
              </h2>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.85, color: "#737373" }}>
              When the world panics about food — as it did in 2022 — phosphate
              prices spike and OCP&rsquo;s revenue doubles. The company posted
              $11.3 billion in 2022, its highest ever, driven by the Ukraine war
              and supply chain disruption.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <RevenueChart />
        </Reveal>
      </section>

      {/* ━━━ BODY 3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {c3 && (
        <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
          <div className="max-w-2xl">
            <Reveal>
              <BodyChunk content={c3} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ━━━ TIMELINE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
        <Reveal>
          <div className="mb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
              105 years
            </p>
            <h2 className="font-serif text-3xl leading-tight max-w-md">
              <em>A century of extraction</em>
            </h2>
          </div>
        </Reveal>
        <div className="max-w-2xl">
          {TIMELINE.map((t, i) => (
            <Reveal key={t.year} delay={i * 0.05}>
              <div className="grid grid-cols-[80px_1fr] gap-6 py-5 border-b border-neutral-100">
                <span
                  className="font-mono text-[13px] font-medium tabular-nums"
                  style={{ color: "#c9a96e" }}
                >
                  {t.year}
                </span>
                <p
                  style={{ fontSize: 14, lineHeight: 1.75, color: "#555" }}
                >
                  {t.event}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ━━━ STORY IMAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {images.length > 0 && (
        <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {images.map((img, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <figure>
                  <div
                    className="w-full overflow-hidden"
                    style={{ aspectRatio: "16/9", background: "#f0f0f0" }}
                  >
                    <img
                      src={img.image_url}
                      alt={img.caption || ""}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  {(img.caption || img.attribution) && (
                    <figcaption className="font-mono text-[10px] text-neutral-400 mt-2 italic">
                      {img.caption}
                      {img.caption && img.attribution ? " — " : ""}
                      {img.attribution}
                    </figcaption>
                  )}
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ━━━ JOURNEY CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
        <Reveal>
          <div className="flex items-center justify-between gap-8 flex-wrap">
            <p className="font-serif italic text-xl text-neutral-600 max-w-lg">
              Phosphate built modern Morocco. Come see what it made.
            </p>
            <Link
              href="/plan-your-trip"
              className="font-mono text-[11px] uppercase tracking-[0.15em] border border-neutral-900 px-7 py-3.5 hover:bg-neutral-900 hover:text-white transition-all duration-200 whitespace-nowrap"
            >
              Plan a journey →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ━━━ RELATED JOURNEYS ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {relatedJourneys.length > 0 && (
        <section className="px-8 md:px-[8%] lg:px-[12%] py-16 border-b border-neutral-100">
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-8">
              Journeys
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {relatedJourneys.map((j, i) => (
              <Reveal key={j.slug} delay={i * 0.1}>
                <Link href={`/journeys/${j.slug}`} className="group block">
                  {j.hero_image_url && (
                    <div
                      className="w-full mb-4 overflow-hidden"
                      style={{ aspectRatio: "16/9", background: "#f0f0f0" }}
                    >
                      <img
                        src={j.hero_image_url}
                        alt={j.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  {j.duration_days && (
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-1">
                      {j.duration_days} days
                    </p>
                  )}
                  <h3 className="font-serif text-xl group-hover:opacity-60 transition-opacity">
                    {j.title}
                  </h3>
                  {j.short_description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#737373",
                        marginTop: 4,
                        lineHeight: 1.6,
                      }}
                      className="line-clamp-2"
                    >
                      {j.short_description}
                    </p>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ━━━ SOURCES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="px-8 md:px-[8%] lg:px-[12%] py-16"
        style={{ background: "#141414" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-4xl">
          <div>
            <p
              className="font-mono text-[9px] uppercase tracking-[0.2em] mb-4"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Sources
            </p>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.9,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              {sources.length > 0 ? (
                sources.map((s, i) => (
                  <p key={i} className="mb-2">
                    {s}
                  </p>
                ))
              ) : (
                <>
                  <p className="mb-2">
                    USGS. <em>Mineral Commodity Summaries: Phosphate Rock</em>{" "}
                    (2024).
                  </p>
                  <p className="mb-2">
                    OCP Group. <em>Annual Report</em> (2023).
                  </p>
                  <p className="mb-2">
                    International Fertilizer Association (IFA). Global
                    production and trade data (2024).
                  </p>
                  <p className="mb-2">
                    Jasinski, Stephen M.{" "}
                    <em>Phosphate Rock: Statistics and Information</em>. USGS.
                  </p>
                  <p>
                    Van Kauwenbergh, Steven J.{" "}
                    <em>World Phosphate Rock Reserves and Resources</em>. IFDC
                    (2010).
                  </p>
                </>
              )}
            </div>
          </div>
          <div>
            <p
              className="font-mono text-[9px] uppercase tracking-[0.2em] mb-4"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Data notes
            </p>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.9,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              <p className="mb-2">
                Reserve estimates from USGS 2024. Production figures in metric
                tonnes (rock equivalent).
              </p>
              <p className="mb-2">
                OCP revenue in USD, converted at year-end rates where reported
                in MAD.
              </p>
              <p>
                Export percentages approximate, based on OCP Group disclosures
                and IFA trade flow data.
              </p>
            </div>
          </div>
        </div>
        <p className="font-mono text-[10px] mt-10" style={{ color: "#c9a96e" }}>
          © Slow Morocco
        </p>
      </section>
    </div>
  );
}
