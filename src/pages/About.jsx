import { BookOpen, Feather, Globe, Sparkles } from "lucide-react";

const pillars = [
  {
    icon: Feather,
    title: "Imagination",
    description: "Every story is a doorway. I craft narratives that pull you beyond the world you know — into forests that breathe, rivers that remember, and moments that linger long after the last page.",
  },
  {
    icon: Globe,
    title: "Cultural Roots",
    description: "My stories are rooted in real places and real voices. Each one carries the soul of the land it comes from — the kind of truth that only lives between the lines.",
  },
  {
    icon: Sparkles,
    title: "Wonder",
    description: "I believe in the quiet magic of storytelling — the kind that finds you in the details: a flower pressed into a palm, a flute heard across the forest, a name spoken just once.",
  },
];

export default function About() {
  return (
    <div className="max-w-5xl px-4 py-10 mx-auto sm:px-6 lg:px-8 sm:py-14 lg:py-18">

      {/* HERO */}
      <div className="mb-12 text-center lg:mb-16">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400 dark:to-amber-700" />
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-amber-600 dark:text-amber-500">My Story</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400 dark:to-amber-700" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-transparent sm:text-5xl lg:text-6xl bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text">
          Where Stories Live
        </h1>
        <p className="max-w-2xl mx-auto text-base leading-relaxed text-gray-600 dark:text-gray-400 font-serif italic">
          A sanctuary for readers, dreamers, and wandering souls.
          Step into a world of forgotten tales and whispered legends —
          one chapter, one mystery, one world at a time.
        </p>
      </div>

      {/* MISSION + QUOTE */}
      <div className="grid items-center gap-10 mb-14 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">My Mission</h2>
          <p className="mb-4 leading-relaxed text-gray-600 dark:text-gray-400">
            To create immersive stories that spark imagination, awaken curiosity, and transport
            readers beyond the ordinary. Through every tale, I aim to preserve the magic of
            storytelling — crafting worlds filled with mystery, emotion, wonder, and unforgettable journeys.
          </p>
          <p className="leading-relaxed text-gray-600 dark:text-gray-400">
            This is a place for those who seek adventure between the pages, find comfort in words,
            and believe every story holds a little piece of magic.
          </p>
        </div>
        <div className="relative p-8 text-white overflow-hidden bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl shadow-xl">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
          <BookOpen size={40} className="mb-4 opacity-70 relative z-10" />
          <p className="font-serif text-base italic leading-relaxed relative z-10">
            "My stories are portals to worlds unseen, where imagination wanders and every page holds a new mystery."
          </p>
        </div>
      </div>

      {/* PILLARS */}
      <div className="mb-12">
        <h2 className="mb-6 text-xl font-bold text-center text-gray-900 dark:text-white">
          What I Write About
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {pillars.map(({ icon: Icon, title, description }) => {
            const Comp = Icon;
            return (
              <div
                key={title}
                className="p-5 rounded-2xl bg-white dark:bg-gray-800/60 border border-amber-100 dark:border-amber-900/20 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 mb-4">
                  <Comp size={20} className="text-amber-600 dark:text-amber-500" />
                </div>
                <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
