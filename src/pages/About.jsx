import { BookOpen } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-6xl px-4 py-12 mx-auto sm:px-6 lg:px-8 sm:py-16 lg:py-20">
      <div className="mb-12 text-center lg:mb-16">
        <h1 className="mb-4 text-4xl font-bold text-transparent sm:text-5xl lg:text-6xl bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text">
          My Story
        </h1>
        <p className="max-w-3xl mx-auto text-lg leading-relaxed text-gray-600 sm:text-xl dark:text-gray-400">
          Where stories come alive. ✨
          <br />
          Step into a world of forgotten tales and whispered legends.
          <br />
          A sanctuary for readers, dreamers, and wandering souls.
          <br />
          One chapter, one mystery, one world at a time.
        </p>
      </div>

      <div className="grid items-center gap-12 mb-16 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
          <p className="mb-4 leading-relaxed text-gray-600 dark:text-gray-400">
            To create immersive stories that spark imagination, awaken curiosity, and transport readers beyond the ordinary.
            Through every tale, we aim to preserve the magic of storytelling — crafting worlds filled with mystery,
            emotion, wonder, and unforgettable journeys.
          </p>
          <p className="leading-relaxed text-gray-600 dark:text-gray-400">
            This is a place for those who seek adventure between the pages, find comfort in words,
            and believe every story holds a little piece of magic.
          </p>

        </div>
        <div className="p-8 text-white bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
          <BookOpen size={48} className="mb-4 opacity-80" />
          <p className="font-serif text-lg italic">
            "My stories are portals to worlds unseen, where imagination wanders and every page holds a new mystery."
          </p>
        </div>
      </div>
    </div>
  );
}
