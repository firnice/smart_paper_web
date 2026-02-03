export default function FlowStepCard({ step }) {
  return (
    <article className="card">
      <div className="card-kicker">{step.action}</div>
      <h2>{step.title}</h2>
      <p>{step.detail}</p>
    </article>
  );
}
