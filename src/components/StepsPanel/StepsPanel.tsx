import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, RotateCcw } from 'lucide-react';
import { MOCK_STEPS } from '../../data/mockData';

export function StepsPanel() {
  const [currentStep, setCurrentStep] = useState(0);
  const total = MOCK_STEPS.length;

  const prev = () => setCurrentStep((s) => Math.max(0, s - 1));
  const next = () => setCurrentStep((s) => Math.min(total, s + 1));
  const reset = () => setCurrentStep(0);

  return (
    <div className="h-44 bg-slate-900 border-t border-slate-800 flex flex-col flex-shrink-0">
      {/* Header bar */}
      <div className="h-10 border-b border-slate-800 flex items-center px-4 gap-3 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Loading Timeline
        </span>

        <div className="flex-1" />

        {/* Step counter + nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            disabled={currentStep === 0}
            className="p-1 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
            title="Previous step"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-slate-500 w-14 text-center tabular-nums">
            {currentStep === 0 ? `— / ${total}` : `${currentStep} / ${total}`}
          </span>
          <button
            onClick={next}
            disabled={currentStep === total}
            className="p-1 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
            title="Next step"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 transition-colors">
          <Play size={10} />
          Auto-play
        </button>
        <button
          onClick={reset}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 transition-colors"
          title="Reset to start"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Step cards — horizontal scroll */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex items-center h-full px-4 gap-2 min-w-max">
          {/* Start marker */}
          <div
            className={`flex-shrink-0 flex items-center gap-2 px-3 h-20 rounded-lg border transition-all ${
              currentStep === 0
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-slate-700/40 bg-slate-800/30'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${currentStep === 0 ? 'bg-blue-500' : 'bg-slate-600'}`} />
            <div>
              <div className="text-xs font-medium text-slate-400">Start</div>
              <div className="text-xs text-slate-600 mt-0.5">Empty container</div>
            </div>
          </div>

          {/* Connector line */}
          <div className="w-6 h-px bg-slate-700/50 flex-shrink-0" />

          {MOCK_STEPS.map((step, idx) => {
            const isActive = currentStep === step.stepIndex;
            const isDone = currentStep > step.stepIndex;

            return (
              <div key={step.stepIndex} className="flex items-center gap-0 flex-shrink-0">
                <button
                  onClick={() => setCurrentStep(step.stepIndex)}
                  className={`flex-shrink-0 w-52 h-20 rounded-lg border p-3 text-left transition-all ${
                    isActive
                      ? 'border-blue-500/60 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                      : isDone
                      ? 'border-slate-600/50 bg-slate-800/60'
                      : 'border-slate-700/40 bg-slate-800/30 hover:border-slate-600'
                  }`}
                >
                  {/* Step number + cargo name */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : isDone
                          ? 'bg-slate-600 text-slate-300'
                          : 'bg-slate-700 text-slate-500'
                      }`}
                    >
                      {step.stepIndex}
                    </span>
                    <span className="text-xs font-medium text-slate-300 truncate">{step.cargoName}</span>
                  </div>
                  {/* Description */}
                  <div className="text-xs text-slate-500 leading-relaxed truncate">{step.description}</div>
                  {/* Position */}
                  <div className="text-xs text-slate-700 mt-0.5 font-mono">
                    ({step.position.x}, {step.position.y}, {step.position.z})
                  </div>
                </button>

                {/* Connector between steps (except last) */}
                {idx < MOCK_STEPS.length - 1 && (
                  <div className="w-2 h-px bg-slate-700/50 flex-shrink-0 mx-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
