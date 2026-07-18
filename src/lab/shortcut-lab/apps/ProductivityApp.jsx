import { useEffect, useRef, useState } from "react";

export default function ProductivityApp({ app, effect }) {
  const [status, setStatus] = useState("Ready");
  const [findOpen, setFindOpen] = useState(false);
  const [bold, setBold] = useState(false);
  const lastEffect = useRef(0);

  useEffect(() => {
    if (!effect?.nonce || effect.nonce === lastEffect.current) return;
    lastEffect.current = effect.nonce;
    if (["search-mail","find-cell"].includes(effect.action)) setFindOpen(true);
    if (effect.action === "save-draft") setStatus("Draft saved just now");
    if (effect.action === "undo-note") setStatus("Edit undone");
    if (effect.action === "redo-note") setStatus("Edit restored");
    if (effect.action === "bold-note") { setBold((value) => !value); setStatus("Heading formatting updated"); }
    if (effect.action === "save-sheet") setStatus("Tracker saved just now");
  }, [effect]);

  if (app === "mail") return <FakeMail findOpen={findOpen} status={status} />;
  if (app === "sheet") return <FakeSheet findOpen={findOpen} status={status} />;
  return <FakeNotes bold={bold} status={status} />;
}

function FakeMail({ findOpen, status }) {
  return <div className="sl-mail-app"><aside><button type="button" className="sl-compose">＋ Compose</button><nav><b>Inbox <span>4</span></b><span>Starred</span><span>Sent</span><span>Drafts <em>1</em></span><span>Archive</span></nav><small>4.2 GB of 10 GB</small></aside><section><header>{findOpen ? <div className="sl-product-find">⌕ <strong>release approval</strong><span>1 result</span></div> : <h3>Inbox</h3>}<button type="button">Filter</button></header><div className="sl-mail-row is-active"><i>AL</i><div><strong>Alex Lin</strong><span>Release approved for 2.4</span><p>The final checks look good. You can proceed with…</p></div><time>09:14</time></div><div className="sl-mail-row"><i>MK</i><div><strong>Maya K.</strong><span>Metrics review</span><p>Latency is down across every monitored region.</p></div><time>Yesterday</time></div><article><small>STATUS UPDATE / DRAFT</small><h2>Release 2.4 is ready</h2><p>Hi team,</p><p>The final checks are complete and the release is ready to ship.</p><footer>{status}<button type="button">Send update ↗</button></footer></article></section></div>;
}

function FakeNotes({ bold, status }) {
  return <div className="sl-notes-app"><aside><header>NOTES</header><button type="button" className="is-active"><strong>Release handoff</strong><span>2 min ago</span></button><button type="button"><strong>Research notes</strong><span>Yesterday</span></button><button type="button"><strong>Weekly review</strong><span>12 Jul</span></button></aside><article><div className="sl-notes-tools"><button type="button" className={bold ? "is-active" : ""}>B</button><button type="button"><em>I</em></button><button type="button">↗</button><span>{status}</span></div><p>18 JULY 2026</p><h2 className={bold ? "is-bold" : ""}>Release handoff</h2><p>The 2.4 release is ready for final verification. The performance budget is healthy and the migration notes are complete.</p><blockquote>Keep the feedback loop short. Validate the smallest useful change.</blockquote><h3>Before shipping</h3><label><input type="checkbox" defaultChecked /> Run the complete test suite</label><label><input type="checkbox" defaultChecked /> Review deployment notes</label><label><input type="checkbox" /> Post the team update</label></article></div>;
}

function FakeSheet({ findOpen, status }) {
  const cells = [["2.4.0","Web","Ready","42 ms"],["2.3.9","API","Stable","47 ms"],["2.3.8","Worker","Stable","51 ms"],["2.3.7","Docs","Review","—"]];
  return <div className="sl-sheet-app"><header><strong>Release tracker</strong><span>{status}</span>{findOpen && <div>⌕ version 2.4.0 &nbsp; <b>1 / 1</b></div>}</header><div className="sl-sheet-formula"><span>A2</span><i>ƒx</i><strong>2.4.0</strong></div><table><thead><tr><th /><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead><tbody><tr><th>1</th><td>VERSION</td><td>SURFACE</td><td>STATUS</td><td>LATENCY</td></tr>{cells.map((row, index) => <tr key={row[0]}><th>{index + 2}</th>{row.map((cell, cellIndex) => <td className={index === 0 && cellIndex === 0 ? "is-selected" : ""} key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
