import { ChevronLeft, Download, HelpCircle, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EVERNOTE_MIGRATION_GUIDE, type MigrationGuideStep } from "@/lib/evernote-migration-guide";

export const EvernoteImportGuidePane = ({ onClose }: { onClose: () => void }) => (
  <div className="flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden bg-slate-50">
    <header className="flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-end justify-between border-b border-slate-200 bg-white px-4 pb-3 pt-[env(safe-area-inset-top)] lg:h-16 lg:items-center lg:px-6 lg:pb-0 lg:pt-0">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          size="icon"
          variant="ghost"
          title="返回"
          aria-label="返回"
          onClick={onClose}
          className="h-9 w-9 rounded-lg hover:bg-slate-100"
        >
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </Button>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-base font-bold leading-tight text-slate-900">
            <HelpCircle className="h-4 w-4 text-emerald-700" />
            {EVERNOTE_MIGRATION_GUIDE.title}
          </h1>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-400">{EVERNOTE_MIGRATION_GUIDE.subtitle}</p>
        </div>
      </div>
    </header>

    <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 lg:px-6 lg:py-6">
      <article className="mx-auto grid w-full min-w-0 max-w-4xl gap-4">
        <section className="rounded-lg border border-emerald-100 bg-white p-5 shadow-none">
          <h2 className="text-lg font-bold text-slate-950">{EVERNOTE_MIGRATION_GUIDE.introTitle}</h2>
          {EVERNOTE_MIGRATION_GUIDE.intro.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-sm leading-6 text-slate-600">
              {paragraph}
            </p>
          ))}
        </section>

        {EVERNOTE_MIGRATION_GUIDE.steps.map((step) => (
          <GuideStep key={`${step.index}-${step.title}`} step={step} />
        ))}
      </article>
    </main>
  </div>
);

const GuideStep = ({ step }: { step: MigrationGuideStep }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700 shadow-none">
    <div className="mb-3 flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        {getStepIcon(step.index)}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold text-slate-400">步骤 {step.index}</div>
        <h2 className="text-base font-bold text-slate-950">{step.title}</h2>
      </div>
    </div>
    <div className="space-y-3">
      {step.paragraphs?.map((paragraph) => (
        <p key={paragraph}>
          <RichText text={paragraph} />
        </p>
      ))}

      {step.commands?.map((command) => (
        <div key={`${command.label}-${command.code}`} className="space-y-2">
          <div className="text-sm font-bold text-slate-900">{command.label}</div>
          <GuideCode>{command.code}</GuideCode>
        </div>
      ))}

      {step.list && (
        <ul className="list-disc space-y-1 pl-5">
          {step.list.map((item) => (
            <li key={item}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  </section>
);

const GuideCode = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-md border border-slate-100 bg-slate-950 p-3 text-xs leading-5 text-slate-100">
    <code>{children}</code>
  </pre>
);

const RichText = ({ text }: { text: string }) => {
  const pieces = text.split(/(`[^`]+`)/g);

  return (
    <>
      {pieces.map((piece, index) =>
        piece.startsWith("`") && piece.endsWith("`") ? (
          <code key={`${piece}-${index}`}>{piece.slice(1, -1)}</code>
        ) : (
          <span key={`${piece}-${index}`}>{piece}</span>
        )
      )}
    </>
  );
};

const getStepIcon = (index: string): ReactNode => {
  if (index === "1" || index === "1.1") {
    return <Download className="h-4 w-4" />;
  }

  if (index === "2" || index === "3" || index === "4") {
    return <UploadCloud className="h-4 w-4" />;
  }

  return <HelpCircle className="h-4 w-4" />;
};
