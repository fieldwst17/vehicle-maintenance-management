import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-styles";
import { Spinner } from "./spinner";

/** Disabled placeholder button shown while a form's option lists load */
export function ButtonFallback({ label, variant = "primary", size = "md" }: { label: string; variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button disabled className={buttonClasses(variant, size)}>
      <Spinner />
      {label}
    </button>
  );
}
