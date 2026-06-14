import { useEffect, useRef, useState } from 'react';

type Props = {
  onSave: (kcal: number, description: string) => void | Promise<void>;
};

export function LogForm({ onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [kcal, setKcal] = useState('');
  const [description, setDescription] = useState('');
  const kcalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) kcalRef.current?.focus();
  }, [open]);

  function reset() {
    setKcal('');
    setDescription('');
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number.parseInt(kcal, 10);
    if (!Number.isInteger(value) || value <= 0) return;
    await onSave(value, description);
    reset();
  }

  if (!open) {
    return (
      <button className="log-button" onClick={() => setOpen(true)}>
        + Log
      </button>
    );
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={reset}>
      <form className="log-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <input
          ref={kcalRef}
          className="log-form__kcal"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min="1"
          step="1"
          placeholder="kcal"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
        />
        <input
          className="log-form__desc"
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="log-form__actions">
          <button type="button" className="btn btn--ghost" onClick={reset}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
