import { STEP_META } from "../helpers.js";

export default function PrintWorkbenchStepper({ currentStep, onStepClick }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-center gap-3">
        {STEP_META.map((step, index) => {
          const active = currentStep === step.id;
          const done = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                className={`flex min-w-[280px] items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition ${
                  active
                    ? "border-indigo-200 bg-white shadow-[0_4px_12px_rgba(99,91,255,0.08)]"
                    : done
                      ? "border-[#E8E8E8] bg-[#FCFCFD] opacity-75"
                      : "border-[#E8E8E8] bg-white hover:border-slate-300"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active
                      ? "bg-indigo-600 text-white"
                      : done
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {done ? "✓" : step.id}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-slate-900">{step.title}</div>
                  <div className="mt-0.5 text-[12px] text-slate-500">{step.hint}</div>
                </div>
              </button>
              {index < STEP_META.length - 1 ? <span className="text-sm text-slate-300">›</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
