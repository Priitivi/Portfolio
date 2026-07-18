import { useEffect, useRef, useState } from "react";

const fileSeed = [
  { name:"launch-notes.md", type:"MD", size:"12 KB", modified:"09:42" },
  { name:"release-brief.pdf", type:"PDF", size:"2.8 MB", modified:"Yesterday" },
  { name:"metrics.csv", type:"CSV", size:"84 KB", modified:"Yesterday" },
  { name:"obsolete-draft.txt", type:"TXT", size:"4 KB", modified:"12 Jul" },
];

export default function FakeFiles({ effect }) {
  const [files, setFiles] = useState(fileSeed);
  const [selected, setSelected] = useState([0]);
  const [path, setPath] = useState(["Project", "Release"]);
  const [notice, setNotice] = useState("4 items");
  const lastEffect = useRef(0);

  useEffect(() => {
    if (!effect?.nonce || effect.nonce === lastEffect.current) return;
    lastEffect.current = effect.nonce;
    switch (effect.action) {
      case "rename-file": setFiles((items) => items.map((file, index) => index === selected[0] ? { ...file, name:"release-notes.md" } : file)); setNotice("Renamed safely"); break;
      case "copy-file": setNotice("Copied to simulated clipboard"); break;
      case "cut-file": setNotice("Ready to move 1 item"); break;
      case "paste-file": setFiles((items) => [...items, { name:"launch-notes-copy.md", type:"MD", size:"12 KB", modified:"Now" }]); setNotice("Pasted 1 item"); break;
      case "select-all-files": setSelected(files.map((_, index) => index)); setNotice(`${files.length} selected`); break;
      case "delete-file": setFiles((items) => items.filter((_, index) => !selected.includes(index))); setSelected([]); setNotice("Moved to simulated recycle area"); break;
      case "parent-folder": setPath((parts) => parts.slice(0, -1)); setNotice("Parent folder"); break;
      default: break;
    }
  }, [effect, files, selected]);

  return (
    <div className="sl-files-app">
      <aside><header>PLACES</header><button type="button">⌂ Home</button><button type="button">◇ Desktop</button><button type="button">⇩ Downloads</button><button type="button" className="is-active">▣ Project</button><header>FAVOURITES</header><button type="button">☆ Release</button><button type="button">☆ Archive</button><div><span>STORAGE</span><i><b /></i><small>72 GB available</small></div></aside>
      <section><div className="sl-files-toolbar"><button type="button">←</button><button type="button">→</button><div>⌂ &nbsp;›&nbsp; {path.join("  ›  ") || "Home"}</div><button type="button">⌕</button></div><div className="sl-files-heading"><div><span>NAME</span><span>TYPE</span><span>SIZE</span><span>MODIFIED</span></div></div><div className="sl-file-list">{files.map((file, index) => <button type="button" className={selected.includes(index) ? "is-selected" : ""} onClick={() => setSelected([index])} key={`${file.name}-${index}`}><i>{file.type}</i><strong>{file.name}</strong><span>{file.type} file</span><span>{file.size}</span><span>{file.modified}</span></button>)}</div><footer><span>{notice}</span><span>All changes are simulated</span></footer></section>
    </div>
  );
}
