export default function ReviewNavigator({ answers, current, onSelect, label = "Question review status" }) {
  return (
    <nav className="ga-review-map" aria-label={label}>
      {answers.map((answer, index) => {
        const timedOut = Number(answer?.selected) < 0;
        const state = timedOut ? "timed out" : answer?.correct ? "correct" : "needs review";
        return (
          <button
            type="button"
            key={answer?.questionId || index}
            className={`${answer?.correct ? "is-correct" : "is-review"}${current === index ? " is-current" : ""}`}
            aria-current={current === index ? "step" : undefined}
            aria-label={`Question ${index + 1}: ${state}`}
            onClick={() => onSelect(index)}
          >
            {index + 1}
          </button>
        );
      })}
    </nav>
  );
}
