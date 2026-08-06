import { answerLabels } from "../engine/questions.js";
import { answerReview } from "../engine/learning.js";

export default function AnswerExplanation({ question, selected }) {
  const review = answerReview(question, selected);
  const correct = Number(selected) === Number(question.answer);
  return (
    <div className="ga-explanation-grid">
      <section>
        <strong>{question.category === "situational" ? "Why the strongest model response leads" : "Why the answer works"}</strong>
        <p>{review.model}</p>
      </section>
      {!correct && <section className="is-miss">
        <strong>{Number(selected) < 0 ? "What to do after a timeout" : question.category === "situational" ? `Why option ${answerLabels[selected]} ranks lower` : "Why your choice missed"}</strong>
        <p>{review.selected}</p>
      </section>}
    </div>
  );
}
