import htmlLogo from "../assets/html5.svg";
import cssLogo from "../assets/css.svg";
import jsLogo from "../assets/javascript.svg";
import reactLogo from "../assets/react.svg";
import nodeLogo from "../assets/node.svg";
import pythonLogo from "../assets/python.svg";
import tailwindLogo from "../assets/tailwind.svg";
import dockerLogo from "../assets/docker.svg";
import LifeTimeline from "./LifeTimeline";

const skills = [
  { name: "HTML", logo: htmlLogo },
  { name: "CSS", logo: cssLogo },
  { name: "JavaScript", logo: jsLogo },
  { name: "React", logo: reactLogo },
  { name: "Node.js", logo: nodeLogo },
  { name: "Python", logo: pythonLogo },
  { name: "Tailwind", logo: tailwindLogo },
  { name: "Docker", logo: dockerLogo },
];

function About() {
  return (
    <section id="about" className="bg-white py-20 px-6">
      <div className="max-w-5xl mx-auto space-y-16">

        {/* Intro */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">About Me</h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            I’m Priitivi, a recent Computer Science graduate from the University of Warwick. I love building thoughtful web experiences that combine logic, clean UI, and purpose.
          </p>
        </div>
        
        <LifeTimeline />


        {/* Education */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">🎓 Education</h3>
          <ul className="space-y-4 text-gray-700">
            <li>
              <span className="font-medium">University of Warwick</span> – BSc Computer Science (2:2)  
              <br />
              <span className="text-sm italic">
                Dissertation: Predicting Bitcoin Price using LSTM & VADER Sentiment Analysis
              </span>
            </li>
            <li>
              <span className="font-medium">John Lyon School</span> – A-Levels: A*A*A*AA
              <br />
              <span className="text-sm">GCSEs: 9A*, 2A</span>
            </li>
          </ul>
        </div>

        {/* Skills Grid */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">🛠️ Technical Skills</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-6 place-items-center">
            {skills.map(({ name, logo }) => (
              <div key={name} className="group relative">
                <img
                  src={logo}
                  alt={name}
                  className="w-16 h-16 transition-transform duration-300 group-hover:scale-110"
                />
                <span className="absolute bottom-[-1.5rem] left-1/2 -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

export default About;
