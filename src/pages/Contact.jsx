import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: "", email: "", message: "" });
  };

  const contactInfo = [
    { icon: Mail, title: "Email", content: "hello@dewdrops.com", link: "mailto:hello@dewdrops.com" },
    { icon: Phone, title: "Phone", content: "+1 (555) 123-4567", link: "tel:+15551234567" },
    { icon: MapPin, title: "Address", content: "123 Reading Lane, NY 10001", link: null },
  ];

  return (
    <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-16 lg:py-20">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-transparent sm:text-5xl bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text">
          Get in Touch
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
          Have questions or suggestions? We'd love to hear from you
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Contact Form */}
        <div className="p-6 bg-white shadow-xl dark:bg-gray-800 rounded-2xl sm:p-8">
          <h2 className="mb-6 text-2xl font-bold">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-medium">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 transition-all border border-gray-200 outline-none rounded-xl dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 transition-all border border-gray-200 outline-none rounded-xl dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Message</label>
              <textarea
                required
                rows="5"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 transition-all border border-gray-200 outline-none resize-none rounded-xl dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Your message..."
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-white transition-all bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:shadow-lg"
            >
              {submitted ? (
                <>
                  <CheckCircle size={18} />
                  <span>Sent!</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div>
          <div className="p-8 mb-8 text-white bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
            <h2 className="mb-4 text-2xl font-bold">Let's Connect</h2>
            <p className="mb-6 opacity-90">
              Whether you have a question about a book, want to report an issue, or just want to say hello - we're here for you.
            </p>
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

          <div className="p-8 bg-white shadow-sm dark:bg-gray-800 rounded-2xl">
            <h3 className="mb-3 font-semibold">Response Time</h3>
            <p className="mb-4 text-sm text-gray-500">
              We typically respond within 24-48 hours during business days.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-500">Support team online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
