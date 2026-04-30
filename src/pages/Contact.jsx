export default function Contact() {
  return (
    <div className="max-w-4xl px-6 py-4 mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 md:p-12 shadow-2xl border border-gray-50 dark:border-gray-700">
        <h1 className="mb-4 font-serif text-4xl font-bold dark:text-white">Get in Touch</h1>
        <p className="mb-8 text-gray-500 dark:text-gray-400">Have questions about your library? We'd love to hear from you.</p>
        <div className="grid gap-6">
          <input type="text" placeholder="Name" className="p-4 border-none outline-none rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 ring-blue-500/20" />
          <input type="email" placeholder="Email" className="p-4 border-none outline-none rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 ring-blue-500/20" />
          <textarea placeholder="Your message..." rows="4" className="p-4 border-none outline-none rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 ring-blue-500/20" />
          <button className="py-4 font-bold text-white transition bg-gray-900 dark:bg-white dark:text-gray-900 rounded-2xl hover:opacity-90">Send Message</button>
        </div>
      </div>
    </div>
  );
}
