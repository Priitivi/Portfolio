import htmlLogo from "../assets/html5.svg";
import cssLogo from "../assets/css.svg";
import jsLogo from "../assets/javascript.svg";
import reactLogo from "../assets/react.svg";
import nodeLogo from "../assets/node.svg";
import pythonLogo from "../assets/python.svg";
import tailwindLogo from "../assets/tailwind.svg";
import dockerLogo from "../assets/docker.svg";
import LifeTimeline from "./LifeTimeline";
import { motion as Motion } from "framer-motion";
import javaLogo from "../assets/java.svg";

const skills = [
  { name: "HTML", logo: htmlLogo, description: "Markup language" },
  { name: "CSS", logo: cssLogo, description: "Styling language" },
  { name: "JavaScript", logo: jsLogo, description: "Web programming" },
  { name: "React", logo: reactLogo, description: "JS library" },
  { name: "Node.js", logo: nodeLogo, description: "Backend runtime" },
  { name: "Python", logo: pythonLogo, description: "General purpose" },
  { name: "Tailwind", logo: tailwindLogo, description: "CSS framework" },
  { name: "Docker", logo: dockerLogo, description: "Container platform" },
  { name: "Java", logo:javaLogo, description: "Programming language"}
];


function About() {
  return (
    <section id="about" className="bg-white py-20 px-6">
      <div className="max-w-5xl mx-auto space-y-16">



        {/* Skills Grid */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">🛠️ Technical Skills</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {skills.map(({ name, logo, description }) => (
              <div
                key={name}
                className="flex items-center gap-4 bg-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md hover:brightness-105 transition duration-300 group"
              >
                <img src={logo} alt={name} className="w-10 h-10 object-contain" />
                <div>
                  <h4 className="text-md font-semibold text-gray-800">{name}</h4>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>



        {/* Intro */}
        <Motion.div
          className="text-center relative"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            About Me
          </h2>

          <p className="text-gray-700 max-w-2xl mx-auto text-lg leading-relaxed">
            I’m{" "}
            <span className="text-blue-600 font-semibold transition duration-300 hover:text-blue-800 hover:underline hover:scale-105 inline-block">
              Priitivi
            </span>
            , a Computer Science graduate from the University of Warwick. I love building{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1 rounded-sm transition-all duration-300 hover:brightness-110 hover:shadow-lg">
              thoughtful web experiences
            </span>{" "}
            that blend logic, clean UI, and creative problem solving.
          </p>

          {/* Optional: Background glow */}
          <div className="absolute inset-0 -z-10 flex justify-center">
            <div className="w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-40 mt-10"></div>
          </div>
        </Motion.div>


        
        <LifeTimeline />

      </div>
    </section>
  );
}

export default About;
