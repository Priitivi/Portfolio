import htmlLogo from "../assets/html5.svg";
import cssLogo from "../assets/css.svg";
import jsLogo from "../assets/javascript.svg";
import reactLogo from "../assets/react.svg";
import nodeLogo from "../assets/node.svg";
import pythonLogo from "../assets/python.svg";
import tailwindLogo from "../assets/tailwind.svg";
import dockerLogo from "../assets/docker.svg";
import javaLogo from "../assets/java.svg";
import csshieldImage from "../assets/csshield.png";
import cs2squadImage from "../assets/cs2squad.png";
import portfolioImage from "../assets/portfolio.png";

export const skills = [
  { name: "HTML", logo: htmlLogo, category: "Structure" },
  { name: "CSS", logo: cssLogo, category: "Visual systems" },
  { name: "JavaScript", logo: jsLogo, category: "Web engineering" },
  { name: "React", logo: reactLogo, category: "Interfaces" },
  { name: "Node.js", logo: nodeLogo, category: "Backend" },
  { name: "Python", logo: pythonLogo, category: "General purpose" },
  { name: "Tailwind", logo: tailwindLogo, category: "Rapid UI" },
  { name: "Docker", logo: dockerLogo, category: "Infrastructure" },
  { name: "Java", logo: javaLogo, category: "Software development" },
];

export const journey = [
  { year: "2002", label: "Born in London", detail: "The story starts here." },
  { year: "2015—2020", label: "John Lyon School", detail: "GCSEs: 7A*, 3A · A-Levels: A*A*A*AA" },
  { year: "2021—2024", label: "University of Warwick", detail: "BSc Computer Science · Dissertation on Bitcoin price prediction using LSTM and VADER sentiment analysis." },
  { year: "NOW", label: "Building creative software", detail: "Combining clean engineering, product thinking, and memorable interfaces." },
];

export const projects = [
  {
    number: "01",
    title: "CS2Squad",
    strapline: "Find your five.",
    description: "A full-stack platform for finding and managing CS2 teammates by Premier rank, region, and play preferences.",
    tags: ["React", "Node.js", "PostgreSQL", "Docker", "Steam API"],
    github: "https://github.com/priitivi/cs2squad",
    image: cs2squadImage,
    imageAlt: "CS2Squad interface preview",
    challenge: "Connecting Steam identity, relational team data, invitations, and player discovery without making the workflow feel heavy.",
    contribution: "Designed and built the full-stack application, authentication flow, database-backed team tools, and responsive interface.",
  },
  {
    number: "02",
    title: "CSShield",
    strapline: "Software with a boundary.",
    description: "A lightweight Electron application that blocks CS2 gambling websites through system-level DNS and hosts-file controls.",
    tags: ["Electron", "JavaScript", "Cybersecurity", "Windows"],
    github: "https://github.com/priitivi/csshield",
    image: csshieldImage,
    imageAlt: "CSShield desktop application preview",
    challenge: "Applying reliable system-level protection while keeping setup, recovery, and day-to-day use understandable.",
    contribution: "Built the desktop interface, domain-blocking logic, startup behaviour, and self-healing protection mode.",
  },
  {
    number: "03",
    title: "Portfolio Fighter",
    strapline: "The portfolio fights back.",
    description: "A portfolio experiment that turns personal storytelling into a character creator and a playable 3D boss fight.",
    tags: ["React", "Three.js", "React Three Fiber", "Vite"],
    github: "https://github.com/priitivi/Portfolio",
    live: "https://priitivi.com",
    image: portfolioImage,
    imageAlt: "Priitivi portfolio preview",
    challenge: "Balancing game mechanics, accessibility, performance, and recruiter-friendly access to the underlying content.",
    contribution: "Created the visual direction, portfolio content, interaction concept, responsive experience, and playable narrative structure.",
  },
];

export const heroModes = [
  { id: "build", label: "BUILD", command: "project.init()", output: "Full-stack products with practical foundations." },
  { id: "design", label: "DESIGN", command: "interface.compose()", output: "Clear systems with a memorable visual point of view." },
  { id: "play", label: "PLAY", command: "portfolio.break_rules()", output: "Interactive ideas that make the work worth exploring." },
];
