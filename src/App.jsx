import { lazy, Suspense, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import { supportsWebGL } from "./utils/webgl";

const GameExperience = lazy(() => import("./game/GameExperience"));

function StandardPortfolio({ onExplore, webglError }) {
  return (
    <div className="standard-portfolio">
      <Navbar onExplore={onExplore} />
      <main>
        <Hero onExplore={onExplore} />
        <About />
        <Projects />
        <Contact />
      </main>

      <div className="fixed bottom-5 right-5 z-40 flex max-w-xs flex-col items-end gap-2">
        {webglError && (
          <p
            className="rounded-md border border-amber-400 bg-black px-4 py-3 text-sm text-white shadow-xl"
            role="status"
          >
            3D mode is unavailable in this browser. The standard portfolio remains fully accessible.
          </p>
        )}
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState("standard");
  const [webglError, setWebglError] = useState(false);

  const enterGame = () => {
    if (!supportsWebGL()) {
      setWebglError(true);
      return;
    }

    setWebglError(false);
    setMode("game");
  };

  if (mode === "game") {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-black font-mono text-yellow-300">
            Loading fight engine…
          </div>
        }
      >
        <GameExperience onStandardView={() => setMode("standard")} />
      </Suspense>
    );
  }

  return (
    <StandardPortfolio
      onExplore={enterGame}
      webglError={webglError}
    />
  );
}

export default App;
