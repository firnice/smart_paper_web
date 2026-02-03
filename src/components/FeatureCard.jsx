export default function FeatureCard({ feature }) {
  return (
    <article className="card card-compact">
      <h3>{feature.title}</h3>
      <p>{feature.detail}</p>
    </article>
  );
}
