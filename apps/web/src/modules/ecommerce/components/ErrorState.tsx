import { useTranslation } from "react-i18next";
import { MdErrorOutline } from "react-icons/md";
import { Button } from "../../../components/Button";

/** Inline error block with a retry action, used by data-driven sections. */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("ecommerce");

  return (
    <div className="flex flex-col items-start gap-stack-md border-2 border-error bg-error-container/20 p-stack-lg">
      <div className="flex items-center gap-stack-sm text-error">
        <MdErrorOutline aria-hidden size={24} />
        <p className="font-heading text-headline-md uppercase tracking-wide">
          {t("state.errorTitle")}
        </p>
      </div>
      <p className="font-body text-body-md text-on-surface-variant">
        {t("state.errorBody")}
      </p>
      <Button variant="secondary" onClick={onRetry} className="h-10 text-headline-md">
        {t("state.retry")}
      </Button>
    </div>
  );
}
