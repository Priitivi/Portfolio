import { motion } from "framer-motion";

const timeline = [
  { year: "2002", label: "Born in London", icon: "🧒" },
  { year: "2007–2015", label: "Durston House (Primary School)", icon: "🏫" },
  { year: "2015–2020", label: "John Lyon School – GCSEs & A-Levels", icon: "📚" },
  { year: "2021–2024", label: "University of Warwick – BSc Computer Science", icon: "🎓" },
  { year: "2024+", label: "Building creative web apps & products", icon: "💻" },
];

function LifeTimeline() {
  return (
    <div className="relative max-w-5xl mx-auto px-6 py-20">
      <h3 className="text-3xl font-bold text-center text-gray-800 mb-16">
        🕒 My Journey
      </h3>

      <div className="relative">
        {/* Glowing vertical line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 h-full border-l-4 border-blue-500 shadow-[0_0_10px_2px_rgba(59,130,246,0.5)] z-0"></div>

        {timeline.map((item, i) => {
          const isLeft = i % 2 === 0;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative z-10 mb-14 flex flex-col md:flex-row items-center ${
                isLeft ? "md:justify-start" : "md:justify-end"
              }`}
            >
              {/* Line & Dot */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg z-20 shadow-md">
                {item.icon}
              </div>

              {/* Card */}
              <div
                className={`bg-white shadow-lg rounded-lg px-6 py-4 max-w-sm w-full border-l-4 border-blue-400 ${
                  isLeft ? "md:ml-10 md:mr-auto" : "md:mr-10 md:ml-auto"
                }`}
              >
                <div className="text-sm text-gray-500">{item.year}</div>
                <div className="text-lg font-semibold text-gray-800">
                  {item.label}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default LifeTimeline;
