export default function StackItem({ item }) {
  return (
    <div className="stack-item">
      <strong>{item.name}</strong>
      <span>{item.detail}</span>
    </div>
  );
}
