'use client';
import { useMemo, useState } from "react";
import Image from "next/image";
import { photos } from "@/lib/photos";

type Project = {
  category: string;
  title: string;
  place: string;
  date: string;
  description: string;
  image: typeof photos[keyof typeof photos];
  wide?: boolean;
};

const projects: Project[] = [
  {
    category: "Tree Felling",
    title: "Large blue gum removal",
    place: "Kempton Park",
    date: "June 2026",
    description: "Sectional dismantling of a 20-metre blue gum leaning over a home — brought down safely, branch by branch.",
    image: photos.treeFelling,
    wide: true,
  },
  {
    category: "Emergency",
    title: "Storm-damage call-out",
    place: "Boksburg",
    date: "March 2026",
    description: "Midnight response after severe winds dropped a tree onto a roof. Crane lift and full clear in hours.",
    image: photos.emergency,
  },
  {
    category: "Site Clearing",
    title: "Development site clearing",
    place: "Benoni",
    date: "April 2026",
    description: "1.5 hectares cleared and chipped on site to prepare for a new residential development.",
    image: photos.siteClearing,
  },
  {
    category: "Stump Grinding",
    title: "Stump grinding & lawn prep",
    place: "Edenvale",
    date: "May 2026",
    description: "Complete stump removal below grade, leaving a clean surface ready for new lawn.",
    image: photos.stumpGrinding,
  },
  {
    category: "Pruning",
    title: "Mature oak crown pruning",
    place: "Modderfontein",
    date: "February 2026",
    description: "Crown thinning and deadwooding to improve light, airflow and the long-term health of the tree.",
    image: photos.pruning,
  },
  {
    category: "Wood Sales",
    title: "Seasoned firewood supply",
    place: "East Rand",
    date: "Year-round",
    description: "Responsibly sourced, properly seasoned hardwood and softwood — collection or delivery.",
    image: photos.woodSales,
  },
  {
    category: "Stump Grinding",
    title: "Garden stump grinding",
    place: "Kempton Park",
    date: "January 2026",
    description: "Quick, tidy stump grinding in a suburban back garden with full clean-up of the chips.",
    image: photos.teamGrinding,
  },
  {
    category: "Tree Felling",
    title: "Hazardous tree felling",
    place: "Edenvale",
    date: "December 2025",
    description: "Controlled felling of a hazardous tree close to the house, with cones marking the safe zone.",
    image: photos.hero,
  },
];

const categories = ["All", "Tree Felling", "Stump Grinding", "Site Clearing", "Pruning", "Emergency", "Wood Sales"];

export default function Gallery() {
  const [active, setActive] = useState("All");

  const filtered = useMemo(
    () => (active === "All" ? projects : projects.filter((p) => p.category === active)),
    [active]
  );

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2.5">
        {categories.map((c) => {
          const isActive = active === c;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-forest-900 text-white"
                  : "bg-forest-50 text-forest-700 hover:bg-forest-100"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <article
            key={p.title}
            className={`group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-forest-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-forest-950/5 ${
              p.wide ? "sm:col-span-2 lg:col-span-1" : ""
            }`}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={p.image}
                alt={`${p.title} — ${p.place}`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-forest-800">
                {p.category}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold text-forest-900">{p.title}</h3>
              <p className="mt-0.5 text-sm font-medium text-forest-500">{p.place} • {p.date}</p>
              <p className="mt-2 text-sm text-forest-600">{p.description}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
