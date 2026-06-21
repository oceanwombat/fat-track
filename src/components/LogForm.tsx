import { useEffect, useRef, useState } from 'react';
import { estimateCalories, isEstimateConfigured } from '../llm/estimate';

type Props = {
  onSave: (kcal: number, description: string) => void | Promise<void>;
};

type Estimate =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; kcal: number; note?: string }
  | { status: 'error'; reason: string };

export function LogForm({ onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [kcal, setKcal] = useState('');
  const [description, setDescription] = useState('');
  const [estimate, setEstimate] = useState<Estimate>({ status: 'idle' });
  const kcalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) kcalRef.current?.focus();
  }, [open]);

  function reset() {
    setKcal('');
    setDescription('');
    setEstimate({ status: 'idle' });
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number.parseInt(kcal, 10);
    if (!Number.isInteger(value) || value <= 0) return;
    await onSave(value, description);
    reset();
  }

  async function handleEstimate() {
    setEstimate({ status: 'loading' });
    const result = await estimateCalories(description);
    if (result.ok) {
      setEstimate({ status: 'done', kcal: result.kcal, note: result.note });
    } else {
      setEstimate({ status: 'error', reason: result.reason });
    }
  }

  function useEstimate(value: number) {
    setKcal(String(value));
    setEstimate({ status: 'idle' });
  }

  if (!open) {
    return (
      <button className="log-button" onClick={() => setOpen(true)}>
        + Log
      </button>
    );
  }

  const showEstimate = isEstimateConfigured();

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
          onChange={(e) => {
            setDescription(e.target.value);
            setEstimate({ status: 'idle' });
          }}
        />

        {showEstimate && (
          <div className="estimate">
            <button
              type="button"
              className="btn btn--estimate"
              onClick={handleEstimate}
              disabled={!description.trim() || estimate.status === 'loading'}
            >
              {estimate.status === 'loading' ? 'Estimating…' : '✨ Estimate'}
            </button>
            {estimate.status === 'done' && (
              <button
                type="button"
                className="estimate__use"
                onClick={() => useEstimate(estimate.kcal)}
                title={estimate.note}
              >
                Use ≈ {estimate.kcal}
                {estimate.note ? <span className="estimate__note"> · {estimate.note}</span> : null}
              </button>
            )}
            {estimate.status === 'error' && (
              <span className="estimate__error">{estimate.reason} — enter manually</span>
            )}
          </div>
        )}

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
