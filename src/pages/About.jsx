import { Users, BookOpen, Heart, Sparkles } from "lucide-react";

export default function About() {
  const stats = [
    { icon: BookOpen, value: "500+", label: "Books Available" },
    { icon: Users, value: "10k+", label: "Active Readers" },
    { icon: Heart, value: "99%", label: "Satisfaction Rate" },
    { icon: Sparkles, value: "24/7", label: "Reading Access" },
  ];

  return (
    <div className="max-w-6xl px-4 py-12 mx-auto sm:px-6 lg:px-8 sm:py-16 lg:py-20">
      {/* Hero Section */}
      <div className="mb-12 text-center lg:mb-16">
        <h1 className="mb-4 text-4xl font-bold text-transparent sm:text-5xl lg:text-6xl bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text">
          Our Story
        </h1>
        <p className="max-w-3xl mx-auto text-lg text-gray-600 sm:text-xl dark:text-gray-400">
          Creating a sanctuary for readers in a digital world
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6 mb-16 md:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="p-6 text-center bg-white shadow-sm dark:bg-gray-800 rounded-2xl">
            <stat.icon size={32} className="mx-auto mb-3 text-blue-500" />
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Mission Section */}
      <div className="grid items-center gap-12 mb-16 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
          <p className="mb-4 leading-relaxed text-gray-600 dark:text-gray-400">
            At DewDrops, we believe that reading should be a peaceful, immersive experience. 
            In today's fast-paced digital world, we've created a space where readers can escape, 
            explore, and lose themselves in stories without distractions.
          </p>
          <p className="leading-relaxed text-gray-600 dark:text-gray-400">
            Our platform is designed to replicate the joy of reading a physical book - with 
            intuitive controls, beautiful typography, and a focus on what matters most: the content.
          </p>
        </div>
        <div className="p-8 text-white bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
          <BookOpen size={48} className="mb-4 opacity-80" />
          <p className="font-serif text-lg italic">
            "Reading gives us somewhere to go when we have to stay where we are."
          </p>
          <p className="mt-4 text-sm opacity-80">— Mason Cooley</p>
        </div>
      </div>

      {/* Values */}
      <div className="text-center">
        <h2 className="mb-8 text-2xl font-bold">Our Values</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: "Simplicity", desc: "Clean, distraction-free interface" },
            { title: "Accessibility", desc: "Read anywhere, on any device" },
            { title: "Quality", desc: "Curated collection of great books" },
          ].map((value, i) => (
            <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-xl">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full dark:bg-blue-900/30">
                <Heart size={24} className="text-blue-500" />
              </div>
              <h3 className="mb-2 font-semibold">{value.title}</h3>
              <p className="text-sm text-gray-500">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
