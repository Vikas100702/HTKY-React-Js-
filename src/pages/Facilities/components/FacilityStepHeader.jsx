import { AlertCircle, Check, FileText, Home } from "lucide-react";
import { APP_COLORS } from "../../../constants/appColors";

export const FacilityStepHeader = ({
  steps = [],
  currentStep = 1,
  onStepClick,
  validationBanner = "",
}) => {
  const progressPercent =
    steps.length > 0 ? Math.min(100, (currentStep / steps.length) * 100) : 0;

  return (
    <>
      {/* 3-Step Timeline Header */}
      <div className="w-full bg-white border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isClickable = step.id <= currentStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  className={`flex flex-col items-center justify-center group focus:outline-none ${
                    isClickable ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-xs ${
                      isActive || isCompleted
                        ? "text-white"
                        : "bg-stone-300 text-white"
                    }`}
                    style={
                      isActive || isCompleted
                        ? { backgroundColor: APP_COLORS.primary }
                        : undefined
                    }
                  >
                    {step.id === 1 && <FileText className="w-4 h-4" />}
                    {step.id === 2 && <Home className="w-4 h-4" />}
                    {step.id === 3 && <Check className="w-4 h-4" />}
                  </div>

                  <span
                    className={`mt-2 text-xs sm:text-sm font-bold tracking-wide ${
                      isActive || isCompleted
                        ? "text-stone-900"
                        : "text-stone-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Striped Timeline Progress Bar */}
        <div className="w-full h-2.5 bg-stone-200 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: APP_COLORS.primary,
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 6px, transparent 6px, transparent 12px)",
            }}
          />
        </div>
      </div>

      {/* Validation Alert Banner */}
      {validationBanner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
          <div
            role="alert"
            className="p-3.5 rounded-lg border border-red-300 bg-red-50 text-red-900 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0" />
            <span>{validationBanner}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default FacilityStepHeader;
