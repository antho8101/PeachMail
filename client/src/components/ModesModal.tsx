export const UNLOCKED_MODES = ["basic"] as const;

type ModeId = "basic" | "fluid" | "clean" | "creative" | "complete";

type Mode = {
  id: ModeId;
  title: string;
  description: string;
  features: string[];
};

const MODES: Mode[] = [
  {
    id: "basic",
    title: "🌱 Mode Basique",
    description: "Gratuit",
    features: ["contacts manuels", "import CSV", "variables simples", "aperçu live", "envoi simple"]
  },
  {
    id: "fluid",
    title: "🌊 Mode Fluide",
    description: "Verrouillé",
    features: ["délais intelligents", "pause/reprise", "randomisation légère des délais", "reprise après erreur"]
  },
  {
    id: "clean",
    title: "🧾 Mode Propre",
    description: "Verrouillé",
    features: ["historique avancé", "export logs", "reprise campagne", "rapports détaillés"]
  },
  {
    id: "creative",
    title: "🎨 Mode Créatif",
    description: "Verrouillé",
    features: ["templates sauvegardés", "snippets", "variantes de messages"]
  },
  {
    id: "complete",
    title: "💎 Pack complet",
    description: "Verrouillé",
    features: ["tous les modes", "paiement unique plus tard"]
  }
];

type ModesModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ModesModal({ open, onClose }: ModesModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Modes PeachMail">
      <div className="modal-card modes-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">PeachMail grandit doucement</span>
            <h2>Modes</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>Fermer</button>
        </div>

        <div className="modes-grid">
          {MODES.map((mode) => {
            const unlocked = UNLOCKED_MODES.includes(mode.id as (typeof UNLOCKED_MODES)[number]);
            return (
              <article className={`mode-card ${unlocked ? "mode-unlocked" : "mode-locked"}`} key={mode.id}>
                <h3>{mode.title}</h3>
                <p>{unlocked ? "Actif maintenant" : mode.description}</p>
                <ul>
                  {mode.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
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
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Mode Fluide requis">
      <div className="modal-card locked-modal">
        <span className="sticker sticker-blue">✨</span>
        <h2>Mode Fluide requis</h2>
        <p>Vos emails s'envoient doucement, comme s'ils respiraient.</p>
        <div className="button-row">
          <button type="button" onClick={onShowModes}>Voir les modes</button>
          <button className="secondary-button" type="button" onClick={onClose}>Plus tard</button>
        </div>
      </div>
    </div>
  );
}
