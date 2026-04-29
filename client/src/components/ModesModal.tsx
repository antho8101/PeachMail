import { useState } from "react";
import { useI18n } from "../lib/i18n";

export const UNLOCKED_MODES = ["basic"] as const;

type ModeId = "basic" | "fluid" | "clean" | "creative" | "complete";

type Mode = {
  id: ModeId;
  badgeKey?: "modes.recommended" | "modes.simplest";
};

type ModePricing = {
  price: string;
  compareAt?: string;
  cta: string;
};

export const MODES_PRICING: Record<ModeId, ModePricing> = {
  basic: { price: "0€", cta: "modes.included" },
  fluid: { price: "9€", cta: "modes.unlock" },
  clean: { price: "7€", cta: "modes.unlock" },
  creative: { price: "7€", cta: "modes.unlock" },
  complete: { price: "19€", compareAt: "modes.compare", cta: "modes.unlockAll" }
};

const MODES: Mode[] = [
  {
    id: "basic"
  },
  {
    id: "fluid",
    badgeKey: "modes.recommended"
  },
  {
    id: "clean"
  },
  {
    id: "creative"
  },
  {
    id: "complete",
    badgeKey: "modes.simplest"
  }
];

type ModesModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ModesModal({ open, onClose }: ModesModalProps) {
  const { t } = useI18n();
  const [unlockedModes, setUnlockedModes] = useState<ModeId[]>([...UNLOCKED_MODES]);

  if (!open) return null;

  function unlockMode(modeId: ModeId) {
    if (modeId === "complete") {
      setUnlockedModes(["basic", "fluid", "clean", "creative", "complete"]);
      return;
    }

    setUnlockedModes((current) => (current.includes(modeId) ? current : [...current, modeId]));
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Modes PeachMail">
      <div className="modal-card modes-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">{t("modes.eyebrow")}</span>
            <h2>{t("modes.title")}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>{t("modes.close")}</button>
        </div>

        <div className="modes-grid">
          {MODES.map((mode) => {
            const pricing = MODES_PRICING[mode.id];
            const unlocked = unlockedModes.includes(mode.id);
            const isComplete = mode.id === "complete";
            return (
              <article
                className={`mode-card ${unlocked ? "mode-unlocked" : "mode-locked"} ${isComplete ? "mode-complete" : ""}`}
                key={mode.id}
              >
                <div className="mode-card-top">
                  <h3>{t(`modes.${mode.id}.title`)}</h3>
                  {mode.badgeKey && <span className="mode-badge">{t(mode.badgeKey)}</span>}
                </div>
                <p>{t(`modes.${mode.id}.description`)}</p>
                <div className="mode-price-row">
                  <strong>{pricing.price}</strong>
                  {pricing.compareAt && <span>{t(pricing.compareAt)}</span>}
                </div>
                <ul>
                  {t(`modes.${mode.id}.features`).split("|").map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <button
                  className={isComplete ? "primary-button mode-pack-button" : "mode-unlock-button"}
                  disabled={unlocked && mode.id !== "basic"}
                  type="button"
                  onClick={() => unlockMode(mode.id)}
                >
                  {unlocked ? t("modes.unlocked") : t(pricing.cta)}
                </button>
              </article>
            );
          })}
        </div>

        <p className="modes-reassurance">
          {t("modes.reassurance")}
        </p>
      </div>
    </div>
  );
}

type LockedFeatureModalProps = {
  open: boolean;
  onClose: () => void;
  onShowModes: () => void;
};

export function LockedFeatureModal({ open, onClose, onShowModes }: LockedFeatureModalProps) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Mode Fluide requis">
      <div className="modal-card locked-modal">
        <span className="sticker sticker-blue">✨</span>
        <h2>{t("locked.title")}</h2>
        <div className="button-row">
          <button type="button" onClick={onShowModes}>{t("locked.showModes")}</button>
          <button className="secondary-button" type="button" onClick={onClose}>{t("locked.later")}</button>
        </div>
      </div>
    </div>
  );
}
