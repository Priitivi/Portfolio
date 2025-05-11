import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function Hero() {
  const whoamiCommand = "whoami";
  const whoamiResponse = "I'm Priitivi — software developer & creative engineer";

  const catCommand = "cat mission.txt";
  const catResponse =
    "I build clean, creative web experiences with purpose and polish.";

  const [typedCommand1, setTypedCommand1] = useState("");
  const [typedWhoami, setTypedWhoami] = useState("");
  const [typedCommand2, setTypedCommand2] = useState("");
  const [typedMission, setTypedMission] = useState("");
  const [typedCommand3, setTypedCommand3] = useState("");

  const [scrollTarget, setScrollTarget] = useState("");
  const [showButtons, setShowButtons] = useState(false);

  const [hasTypedWhoami, setHasTypedWhoami] = useState(false);
  const [hasTypedWhoamiResponse, setHasTypedWhoamiResponse] = useState(false);
  const [hasTypedCatCommand, setHasTypedCatCommand] = useState(false);
  const [hasTypedMission, setHasTypedMission] = useState(false);

  // Step 1: type 'whoami'
  useEffect(() => {
    let i = 0;
    let output = "";
    const interval = setInterval(() => {
      if (i < whoamiCommand.length) {
        output += whoamiCommand.charAt(i);
        setTypedCommand1(output);
        i++;
      } else {
        clearInterval(interval);
        setHasTypedWhoami(true);
      }
    }, 70);
    return () => clearInterval(interval);
  }, []);

  // Step 2: type whoami response
  useEffect(() => {
    if (!hasTypedWhoami) return;

    let i = 0;
    let output = "";
    const interval = setInterval(() => {
      if (i < whoamiResponse.length) {
        output += whoamiResponse.charAt(i);
        setTypedWhoami(output);
        i++;
      } else {
        clearInterval(interval);
        setHasTypedWhoamiResponse(true);
      }
    }, 70);
    return () => clearInterval(interval);
  }, [hasTypedWhoami]);

  // Step 3: type 'cat mission.txt'
  useEffect(() => {
    if (!hasTypedWhoamiResponse) return;

    let i = 0;
    let output = "";
    const interval = setInterval(() => {
      if (i < catCommand.length) {
        output += catCommand.charAt(i);
        setTypedCommand2(output);
        i++;
      } else {
        clearInterval(interval);
        setHasTypedCatCommand(true);
      }
    }, 70);
    return () => clearInterval(interval);
  }, [hasTypedWhoamiResponse]);

  // Step 4: type mission text
  useEffect(() => {
    if (!hasTypedCatCommand) return;

    let i = 0;
    let output = "";
    const interval = setInterval(() => {
      if (i < catResponse.length) {
        output += catResponse.charAt(i);
        setTypedMission(output);
        i++;
      } else {
        clearInterval(interval);
        setHasTypedMission(true);
        setTimeout(() => setShowButtons(true), 400);
      }
    }, 70);
    return () => clearInterval(interval);
  }, [hasTypedCatCommand]);

  // Step 5: user command (scroll or download)
  const handleCommand = (target, label, type = "scroll") => {
    const finalCommand =
      type === "download" ? `download ${label}.pdf` : `open ${label}.txt`;

    setTypedCommand3("");
    setScrollTarget(target);

    let i = 0;
    let output = "";
    const interval = setInterval(() => {
      if (i < finalCommand.length) {
        output += finalCommand.charAt(i);
        setTypedCommand3(output);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (type === "download") {
            const link = document.createElement("a");
            link.href = `/Priit.pdf`;
            link.download = "Priit.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();
          } else {
            document
              .getElementById(target)
              ?.scrollIntoView({ behavior: "smooth" });
          }
        }, 500);
      }
    }, 70);
  };

  return (
    <section
      id="hero"
      className="min-h-screen bg-black text-green-400 flex flex-col items-center justify-center px-4"
    >
      <div className="max-w-3xl w-full bg-[#0d0d0d] p-6 rounded-md shadow-md font-mono text-lg leading-relaxed border border-green-700 mb-8">
        {/* whoami command */}
        <div className="mb-2">
          <span className="text-green-500">$</span>{" "}
          <span>{typedCommand1}</span>
          {!hasTypedWhoami && <span className="animate-pulse">|</span>}
        </div>

        {/* whoami response */}
        {hasTypedWhoami && (
          <div className="mb-4">
            <span className="text-green-500">$</span>{" "}
            <span>{typedWhoami}</span>
            {!hasTypedWhoamiResponse && <span className="animate-pulse">|</span>}
          </div>
        )}

        {/* cat mission.txt command */}
        {hasTypedWhoamiResponse && (
          <div className="mb-2">
            <span className="text-green-500">$</span>{" "}
            <span>{typedCommand2}</span>
            {!hasTypedCatCommand && <span className="animate-pulse">|</span>}
          </div>
        )}

        {/* mission.txt response */}
        {hasTypedCatCommand && (
          <div className="mb-4">
            <span className="text-green-500">$</span>{" "}
            <span>{typedMission}</span>
            {!hasTypedMission && <span className="animate-pulse">|</span>}
          </div>
        )}

        {/* user-triggered command */}
        {showButtons && typedCommand3 && (
          <div className="mb-4">
            <span className="text-green-500">$</span>{" "}
            <span>{typedCommand3}</span>
            {typedCommand3.length < `open ${scrollTarget}.txt`.length && (
              <span className="animate-pulse">|</span>
            )}
          </div>
        )}
      </div>

      {/* Command buttons */}
      {showButtons && (
        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {[
            { label: "about", target: "about", type: "scroll" },
            { label: "projects", target: "projects", type: "scroll" },
            { label: "contact", target: "contact", type: "scroll" },
            { label: "cv", target: "cv", type: "download" },
          ].map((btn, index) => (
            <motion.button
              key={btn.label}
              onClick={() =>
                handleCommand(btn.target, btn.label, btn.type)
              }
              className="bg-green-600 text-black px-4 py-2 rounded hover:bg-green-700 font-mono"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.2, duration: 0.4 }}
            >
              {btn.type === "download"
                ? "download cv.pdf"
                : `open ${btn.label}.txt`}
            </motion.button>
          ))}
        </motion.div>
      )}
    </section>
  );
}

export default Hero;
