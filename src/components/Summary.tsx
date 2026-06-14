type Props = {
  total: number;
};

export function Summary({ total }: Props) {
  return (
    <header className="summary">
      <div className="summary__value">{total.toLocaleString()}</div>
      <div className="summary__label">total kcal</div>
    </header>
  );
}
