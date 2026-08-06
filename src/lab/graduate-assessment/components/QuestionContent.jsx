import { describePattern } from "../engine/questions.js";

function QuestionContext({ context }) {
  if (!context) return null;
  if (context.type === "table") {
    return (
      <figure className="ga-data-card">
        <figcaption>{context.title}</figcaption>
        <table>
          <thead><tr>{context.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{context.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index ? <td key={`${row[0]}-${index}`}>{cell}</td> : <th key={cell}>{cell}</th>)}</tr>)}</tbody>
        </table>
      </figure>
    );
  }
  if (context.type === "bars") {
    const max = Math.max(...context.values.map((item) => item.value));
    return (
      <figure className="ga-data-card ga-bar-card">
        <figcaption>{context.title}</figcaption>
        <div className="ga-bars">{context.values.map((item) => <div key={item.label}><span><i style={{ height: `${(item.value / max) * 100}%` }} /></span><strong>{item.value}</strong><small>{item.label}</small></div>)}</div>
      </figure>
    );
  }
  return null;
}

export function PatternGlyph({ pattern, label = "Pattern tile" }) {
  const count = Math.max(1, Math.min(pattern.count || 1, 4));
  const positions = count === 1 ? [[50, 50]] : count === 2 ? [[34, 50], [66, 50]] : count === 3 ? [[50, 28], [33, 67], [67, 67]] : [[33, 33], [67, 33], [33, 67], [67, 67]];
  const shape = (x, y, index) => {
    const common = { fill: pattern.filled ? "currentColor" : "none", stroke: "currentColor", strokeWidth: 4, vectorEffect: "non-scaling-stroke" };
    if (pattern.shape === "circle") return <circle key={index} cx={x} cy={y} r="10" {...common} />;
    if (pattern.shape === "triangle") return <path key={index} d={`M ${x} ${y - 12} L ${x + 12} ${y + 10} L ${x - 12} ${y + 10} Z`} {...common} />;
    if (pattern.shape === "diamond") return <rect key={index} x={x - 9} y={y - 9} width="18" height="18" transform={`rotate(45 ${x} ${y})`} {...common} />;
    return <rect key={index} x={x - 10} y={y - 10} width="20" height="20" {...common} />;
  };
  const markerPositions = [[18, 18], [82, 18], [82, 82], [18, 82]];
  const marker = markerPositions[pattern.accent || 0];
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={`${label}: ${describePattern(pattern)}`}>
      <g transform={`rotate(${pattern.rotation || 0} 50 50)`}>{positions.map(([x, y], index) => shape(x, y, index))}</g>
      {pattern.accent !== undefined && <circle cx={marker[0]} cy={marker[1]} r="5" className="ga-pattern-accent" />}
    </svg>
  );
}

function LogicalSequence({ question }) {
  return (
    <div className="ga-pattern-sequence" aria-label="Visual pattern sequence">
      {question.sequence.map((pattern, index) => <span key={`${question.id}-${index}`}><PatternGlyph pattern={pattern} label={`Sequence tile ${index + 1}`} /></span>)}
      <span className="ga-pattern-missing" aria-label="Missing tile">?</span>
    </div>
  );
}

export function QuestionBody({ question }) {
  return (
    <>
      {question.passage && <blockquote className="ga-passage"><span>PASSAGE</span>{question.passage}</blockquote>}
      {question.scenario && <blockquote className="ga-passage ga-scenario"><span>{question.competency}</span>{question.scenario}</blockquote>}
      <QuestionContext context={question.context} />
      {question.category === "logical" && <LogicalSequence question={question} />}
      <p className="ga-question-prompt">{question.statement || question.prompt}</p>
    </>
  );
}
