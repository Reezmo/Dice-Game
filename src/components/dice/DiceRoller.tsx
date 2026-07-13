import React, { useState } from "react";
import DiceScene from "./DiceScene";
import { BACKGROUNDS, VARIANTS, DEFAULT_CONFIG, MIN_DICE, MAX_DICE } from "./config";
import type { DiceSceneConfig } from "./config";
import "./DiceRoller.css";

export interface DiceRollerProps {
  /** Called once every die has landed, with the final face values. */
  onAllSettled?: (values: number[]) => void;
  /**
   * Optional externally-driven roll trigger (e.g. from Teams Live Share
   * LiveState). If provided, incrementing this number starts a roll for
   * everyone in the meeting instead of the local Roll button alone.
   */
  externalRollId?: number;
}

export default function DiceRoller({ onAllSettled, externalRollId }: DiceRollerProps) {
  const [config, setConfig] = useState<DiceSceneConfig>(DEFAULT_CONFIG);
  const [rollId, setRollId] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [results, setResults] = useState<number[] | null>(null);

  const effectiveRollId = externalRollId ?? rollId;

  const roll = () => {
    if (rolling) return;
    setResults(null);
    setRolling(true);
    setRollId((n) => n + 1);
    // matches IceDie tumble (0.9s) + settle (0.3s) duration
    window.setTimeout(() => setRolling(false), 1300);
  };

  const handleSettled = (values: number[]) => {
    setResults(values);
    onAllSettled?.(values);
  };

  return (
    <div className="dice-roller-shell">
      <div className="dice-scene-wrap">
        <DiceScene config={config} rollId={effectiveRollId} onAllSettled={handleSettled} />
      </div>

      <aside className="dice-control-panel">
        <h1>Glacier Dice</h1>

        <section>
          <label>Background</label>
          <select
            value={config.background}
            onChange={(e) =>
              setConfig((c) => ({ ...c, background: e.target.value as DiceSceneConfig["background"] }))
            }
          >
            {Object.entries(BACKGROUNDS).map(([id, meta]) => (
              <option key={id} value={id}>
                {meta.label}
              </option>
            ))}
          </select>
          <p className="dice-hint">{BACKGROUNDS[config.background].description}</p>
        </section>

        <section>
          <label>Dice variant</label>
          <select
            value={config.variant}
            onChange={(e) =>
              setConfig((c) => ({ ...c, variant: e.target.value as DiceSceneConfig["variant"] }))
            }
          >
            {Object.entries(VARIANTS).map(([id, meta]) => (
              <option key={id} value={id}>
                {meta.label}
              </option>
            ))}
          </select>
          <p className="dice-hint">{VARIANTS[config.variant].description}</p>
        </section>

        <section>
          <label htmlFor="dice-count">Number of dice: {config.diceCount}</label>
          <input
            id="dice-count"
            type="range"
            min={MIN_DICE}
            max={MAX_DICE}
            value={config.diceCount}
            onChange={(e) => setConfig((c) => ({ ...c, diceCount: Number(e.target.value) }))}
          />
        </section>

        <button className="dice-roll-btn" onClick={roll} disabled={rolling}>
          {rolling ? "Rolling…" : "Roll the dice"}
        </button>

        <div className="dice-results" aria-live="polite">
          {results && (
            <>
              <span className="dice-results-label">Result</span>
              <span className="dice-results-values">
                {results.join("  ·  ")}{" "}
                {results.length > 1 && `(total ${results.reduce((a, b) => a + b, 0)})`}
              </span>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
