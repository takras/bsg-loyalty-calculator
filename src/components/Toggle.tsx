/** Console-style on/off row: label on the left, ONLINE/OFFLINE pill on the right. */
export function Toggle({
  label,
  checked,
  disabled,
  onChange,
  hint,
  on = "On",
  off = "Off",
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  on?: string;
  off?: string;
}) {
  return (
    <label className={`sys-toggle ${disabled ? "disabled" : ""}`} title={hint}>
      <span className="sys-label">{label}</span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="pill" aria-hidden>
        {checked ? on : off}
      </span>
    </label>
  );
}
