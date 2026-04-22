export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 md:p-12 shadow-2xl border border-gray-50 dark:border-gray-700">
        <h1 className="text-4xl font-serif font-bold mb-4 dark:text-white">Get in Touch</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Have questions about your library? We'd love to hear from you.</p>
        <div className="grid gap-6">
          <input type="text" placeholder="Name" className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none outline-none dark:text-white focus:ring-2 ring-blue-500/20" />
          <input type="email" placeholder="Email" className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none outline-none dark:text-white focus:ring-2 ring-blue-500/20" />
          <textarea placeholder="Your message..." rows="4" className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none outline-none dark:text-white focus:ring-2 ring-blue-500/20" />
          <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-4 rounded-2xl hover:opacity-90 transition">Send Message</button>
        </div>
      </div>
    </div>
  );
}