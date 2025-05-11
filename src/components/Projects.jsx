import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const projects = [
  {
    title: "CS2Squad",
    description:
      "A full-stack web app to find and manage CS2 teammates based on Premier rank, region, and preferences. Built with a real PostgreSQL + Docker backend and Steam login integration.",
    tags: ["React", "Node.js", "PostgreSQL", "Docker", "Steam API"],
    github: "https://github.com/priitivi/cs2squad",
    image: "/src/assets/cs2squad.png",
    details: `🧠 Key Features:
- Steam OpenID login integration
- Team management with invites
- Find players by rank and region
- PostgreSQL + Docker for backend
- Modular architecture ready for scaling

💡 What I Learned:
- Working with authentication strategies
- Using relational databases in a real-world setup
- Improving UI/UX using animated cards and modals`,
  },
  {
    title: "CSShield",
    description:
      "A lightweight Electron app that blocks CS2 gambling websites by modifying system-level DNS and hosts files. Built to protect myself and others from addiction patterns.",
    tags: ["Electron", "JavaScript", "Cybersecurity", "Windows"],
    github: "https://github.com/priitivi/csshield",
    image: "/src/assets/csshield.png",
    details: `🧠 Key Features:
- Dynamically blocks known gambling domains
- Electron desktop GUI for Windows
- Self-healing mode to auto-reapply protection
- Lightweight and runs on startup

💡 What I Learned:
- Using Node.js for low-level file operations
- Building cross-platform desktop apps with Electron
- UX considerations for personal recovery tools`,
  },
];

function Projects() {
  const [selected, setSelected] = useState(null);

  return (
    <section id="projects" className="bg-gray-100 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
          Projects
        </h2>

        <div className="grid md:grid-cols-2 gap-10">
          {projects.map((project) => (
            <div
              key={project.title}
              onClick={() => setSelected(project)}
              className="bg-white shadow-lg rounded-lg overflow-hidden transition hover:shadow-2xl cursor-pointer group"
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-2 text-gray-800">
                  {project.title}
                </h3>
                <p className="text-gray-600 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-blue-500 text-center group-hover:opacity-100 opacity-75 transition">
                  Click for more info
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 px-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-xl max-w-4xl w-full p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-6 text-gray-600 hover:text-black text-2xl"
                >
                  &times;
                </button>
                <div className="flex flex-col md:flex-row gap-8">
                  <img
                    src={selected.image}
                    alt={selected.title}
                    className="w-full md:w-1/2 h-64 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-800 mb-2">
                      {selected.title}
                    </h3>
                    <p className="text-gray-700 mb-4">{selected.description}</p>
                    <pre className="text-sm bg-gray-100 p-4 rounded text-gray-800 whitespace-pre-wrap mb-4">
                      {selected.details}
                    </pre>
                    <a
                      href={selected.github}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-medium text-sm"
                    >
                      🔗 View GitHub →
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default Projects;
