import { memo } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { evaluatePassword } from "../../utils/passwordValidation";

/**
 * Purely presentational — recomputes from `password` on every render, which
 * is cheap (5 small regex tests) so no memoization of the evaluation itself
 * is needed. The component itself is memoized so it doesn't re-render when
 * sibling form fields change but `password` hasn't.
 */
function PasswordChecklist({ password }) {
  const { results } = evaluatePassword(password);

  // Don't show a wall of red X's before the user has typed anything.
  if (!password) return null;

  return (
    <ul className="mt-2 space-y-1" aria-label="Password requirements">
      {results.map((rule) => (
        <li
          key={rule.id}
          className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
            rule.passed ? "text-emerald-600" : "text-slate-400"
          }`}
        >
          {rule.passed ? (
            <CheckCircle2 size={12} className="shrink-0" aria-hidden="true" />
          ) : (
            <XCircle size={12} className="shrink-0" aria-hidden="true" />
          )}
          <span>{rule.label}</span>
          <span className="sr-only">{rule.passed ? "requirement met" : "requirement not met"}</span>
        </li>
      ))}
    </ul>
  );
}

export default memo(PasswordChecklist);
