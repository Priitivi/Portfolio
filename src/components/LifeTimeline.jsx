import { motion as Motion } from "framer-motion";
import { journey } from "../data/portfolioData";

function LifeTimeline() {
  return (
    <ol className="pf-timeline">
      {journey.map((item, index) => (
        <Motion.li key={item.year} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }} viewport={{ once: true }}>
          <span>{item.year}</span>
          <div><strong>{item.label}</strong><p>{item.detail}</p></div>
        </Motion.li>
      ))}
    </ol>
  );
}

export default LifeTimeline;
