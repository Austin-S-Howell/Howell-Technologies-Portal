export interface HowellLogoSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  inline?: boolean;
  className?: string;
}

export function HowellLogoSpinner({ size = "md", label, inline = false, className = "" }: HowellLogoSpinnerProps) {
  const rootClass = ["howell-spinner", `howell-spinner--${size}`, inline ? "howell-spinner--inline" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={rootClass} role="status" aria-live="polite" aria-label={label ?? "Loading"}>
      <span className="howell-spinner__visual" aria-hidden="true">
        <svg viewBox="0 0 120 120" className="howell-spinner__svg" focusable="false">
          <g className="howell-spinner__emblem">
            <circle className="howell-spinner__emblem-ring" cx="60" cy="60" r="29" />
            <g className="howell-spinner__emblem-ring-rotor">
              <path className="howell-spinner__emblem-ring-top" d="M 31 60 A 29 29 0 0 1 89 60" />
              <path className="howell-spinner__emblem-ring-bottom" d="M 89 60 A 29 29 0 0 1 31 60" />
            </g>
            <path className="howell-spinner__glyph-h" d="M 31 60 H 59 M 59 42 V 78" />
            <path className="howell-spinner__glyph-t" d="M 62 42 H 80 M 71 42 V 78" />
          </g>
        </svg>
      </span>
      {label ? <span className="howell-spinner__label">{label}</span> : null}
    </span>
  );
}
