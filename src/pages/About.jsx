import { useState } from "react";
import { motion as framerMotion } from "framer-motion";
import { BookOpen, Feather, Globe, Sparkles } from "lucide-react";

const MotionDiv = framerMotion.div;

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
  const [isFlipped, setIsFlipped] = useState(false);

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

      {/* AUTHOR CARD — circle flip on click */}
      <div className="flex flex-col items-center mb-14">
        <div
          className="cursor-pointer mb-4 select-none"
          style={{ perspective: "600px", width: 112, height: 112 }}
          onClick={() => setIsFlipped((f) => !f)}
        >
          <MotionDiv
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d", width: "100%", height: "100%", position: "relative" }}
          >
            {/* FRONT — SG initials */}
            <div
              className="absolute inset-0 rounded-full flex items-center justify-center shadow-lg ring-4 ring-amber-100 dark:ring-amber-900/40"
              style={{ backfaceVisibility: "hidden", background: "linear-gradient(135deg, #FBBF24 0%, #D97706 55%, #92400E 100%)" }}
            >
              <span className="text-3xl font-extrabold text-white tracking-tight">SG</span>
            </div>

            {/* BACK — PowerPuff wiggle */}
            <div
              className="absolute inset-0 rounded-full shadow-lg ring-4 ring-pink-300 dark:ring-pink-900/50 overflow-hidden"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "#EE6FA0" }}
            >
              <MotionDiv
                className="w-full h-full"
                animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src="/covers/power.png"
                  alt="PowerPuff"
                  draggable={false}
                  className="w-full h-full"
                  style={{ objectFit: "cover", objectPosition: "50% 30%", transformOrigin: "50% 50%" }}
                />
              </MotionDiv>
            </div>
          </MotionDiv>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">Suzanne Gurung</h2>
        <p className="text-sm text-amber-600 dark:text-amber-500 font-medium tracking-wide">Author &amp; Storyteller</p>
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
          {pillars.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-5 rounded-2xl bg-white dark:bg-gray-800/60 border border-amber-100 dark:border-amber-900/20 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 mb-4">
                <Icon size={20} className="text-amber-600 dark:text-amber-500" />
              </div>
              <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
