import { Mail } from "lucide-react";

export default function Contact() {
  const contactInfo = [
    { icon: Mail, title: "Email", content: "thedewdropstories@gmail.com", link: "mailto:thedewdropstories@gmail.com" },
  ];

  return (
    <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-16 lg:py-20">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-transparent sm:text-5xl bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text">
          Get in Touch
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
          Have questions or suggestions? I'd love to hear from you
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <div>
          <div className="p-8 mb-8 text-white bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
            <h2 className="mb-4 text-2xl font-bold">Email</h2>
            <div className="space-y-4">
              {contactInfo.map((info, i) => (
                <div key={i} className="flex items-center gap-3">
                  <info.icon size={20} className="opacity-80" />
                  {info.link ? (
                    <a href={info.link} className="hover:underline opacity-90">
                      {info.content}
                    </a>
                  ) : (
                    <span className="opacity-90">{info.content}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
