import { useEffect, useRef, useState } from "react";

const initialTabs = [
  { id:"brief", title:"Launch brief", page:"PROJECT / AURORA" },
  { id:"api", title:"API reference", page:"EDGE CACHE / REFERENCE" },
  { id:"metrics", title:"Latency notes", page:"PERFORMANCE / METRICS" },
];

export default function FakeBrowser({ effect }) {
  const [tabs, setTabs] = useState(initialTabs);
  const [active, setActive] = useState(0);
  const [closed, setClosed] = useState([{ id:"docs", title:"Deployment docs", page:"DOCUMENTATION / DEPLOY" }]);
  const [overlay, setOverlay] = useState(null);
  const lastEffect = useRef(0);

  useEffect(() => {
    if (!effect?.nonce || effect.nonce === lastEffect.current) return;
    lastEffect.current = effect.nonce;
    switch (effect.action) {
      case "focus-address": setOverlay("address"); break;
      case "find-page": setOverlay("find"); break;
      case "next-tab": setActive((index) => (index + 1) % tabs.length); break;
      case "previous-tab": setActive((index) => (index - 1 + tabs.length) % tabs.length); break;
      case "restore-tab": setClosed((history) => {
        if (!history.length) return history;
        setTabs((items) => [...items, history.at(-1)]);
        setActive(tabs.length);
        return history.slice(0, -1);
      }); break;
      case "close-tab": setTabs((items) => {
        if (items.length <= 1) return items;
        setClosed((history) => [...history, items[active]]);
        setActive(Math.max(0, active - 1));
        return items.filter((_, index) => index !== active);
      }); break;
      case "new-tab": setTabs((items) => [...items, { id:`new-${effect.nonce}`, title:"New research", page:"NEW TAB / READY" }]); setActive(tabs.length); break;
      default: break;
    }
  }, [effect, tabs.length, active]);

  const current = tabs[active] || tabs[0];
  return (
    <div className="sl-browser-app">
      <div className="sl-browser-tabs">
        {tabs.map((tab, index) => <button type="button" className={index === active ? "is-active" : ""} onClick={() => setActive(index)} key={tab.id}><i />{tab.title}<span>×</span></button>)}
        <button type="button" className="sl-new-tab" aria-label="New simulated tab">+</button>
      </div>
      <div className="sl-browser-toolbar"><button type="button">←</button><button type="button">→</button><button type="button">↻</button><div className={overlay === "address" ? "is-focused" : ""}><span>◆</span> lab://aurora/{current?.id}</div><em title={`${closed.length} recently closed tab${closed.length === 1 ? "" : "s"}`}>⋯</em></div>
      {overlay === "find" && <div className="sl-find-popover"><strong>latency</strong><span>2 / 4</span><button type="button" onClick={() => setOverlay(null)}>×</button></div>}
      <div className="sl-browser-page">
        <aside><span>DOCS / 2.4</span><strong>Overview</strong><a>Quick start</a><a>Edge runtime</a><a>Performance</a><a>Deployments</a></aside>
        <article><p>{current?.page}</p><h2>Ship reliable software<br /><em>at the speed of thought.</em></h2><div className="sl-browser-metric"><span>MEDIAN LATENCY<strong>42<small>ms</small></strong></span><span>EDGE REGIONS<strong>18</strong></span><span>STATUS<strong className="is-ok">STABLE</strong></span></div><h3>Reduce <mark>latency</mark> without losing clarity</h3><p>Keep the feedback loop short, validate every change, and move through technical context with intent.</p></article>
      </div>
    </div>
  );
}
