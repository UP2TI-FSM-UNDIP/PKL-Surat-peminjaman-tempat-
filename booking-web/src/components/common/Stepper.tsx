import { Check } from 'lucide-react';
import { cn } from "@/lib/utils";

type Step = {
  number: number;
  title: string;
};

type StepperProps = {
  steps: Step[];
  currentStep: number;
};

export function Stepper({ steps, currentStep }: StepperProps) {
  // Hitung padding agar garis pas di tengah lingkaran
  // Rumusnya: 100% / (jumlah step * 2)
  const offsetPercentage = `${100 / (steps.length * 2)}%`;

  return (
    <div className='w-full max-w-4xl mx-auto py-4 px-4'>
      <div className='relative flex items-start justify-between'>

        {/* Container Garis (Dibatasi agar tidak keluar dari lingkaran 1 & 3) */}
        <div
          className="absolute top-5 left-0 w-full -z-10"
          style={{ paddingLeft: offsetPercentage, paddingRight: offsetPercentage }}
        >
          {/* Garis Abu-abu (Background) */}
          <div className="relative w-full h-[2px] bg-slate-100">
            {/* Garis Biru (Progress) */}
            <div
              className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <div key={step.number} className="flex flex-col items-center flex-1">
              {/* Lingkaran */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white shadow-sm",
                  isCompleted
                    ? "bg-primary border-primary text-white"
                    : isActive
                      ? "border-primary text-primary ring-4 ring-primary/10 font-bold"
                      : "border-slate-200 text-slate-400"
                )}
              >
                {isCompleted ? (
                  <Check className='w-5 h-5 stroke-[3px]' />
                ) : (
                  <span className="text-sm">{step.number}</span>
                )}
              </div>

              {/* Label Teks */}
              <div className="mt-4 text-center">
                <p className={cn(
                  "text-[11px] font-bold uppercase tracking-widest transition-colors",
                  isActive || isCompleted ? "text-slate-900" : "text-slate-400"
                )}>
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}