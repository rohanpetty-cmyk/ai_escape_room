import { CheckCircle2, XCircle, Zap } from "lucide-react";

export type ActionFeedbackTone = "success" | "failure" | "neutral";

export interface ActionFeedbackState {
  tone: ActionFeedbackTone;
  title: string;
  message: string;
}

interface ActionFeedbackProps {
  feedback: ActionFeedbackState | null;
}

const toneClass: Record<ActionFeedbackTone, string> = {
  success: "border-emerald-300/40 bg-emerald-300/10 text-emerald-50",
  failure: "border-rose-300/40 bg-rose-400/10 text-rose-50",
  neutral: "border-teal-300/30 bg-teal-300/10 text-teal-50",
};

export function ActionFeedback({ feedback }: ActionFeedbackProps) {
  if (!feedback) return null;

  const Icon =
    feedback.tone === "success"
      ? CheckCircle2
      : feedback.tone === "failure"
        ? XCircle
        : Zap;

  return (
    <section
      className={`action-feedback rounded-lg border px-4 py-3 shadow-xl shadow-black/20 ${toneClass[feedback.tone]}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em]">
            {feedback.title}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-200">
            {feedback.message}
          </p>
        </div>
      </div>
    </section>
  );
}
