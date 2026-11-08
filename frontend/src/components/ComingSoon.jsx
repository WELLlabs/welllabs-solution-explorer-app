import React from 'react';

const ComingSoon = ({ title, description, steps = [], actions = [], compact = false }) => {
  return (
    <div className={`bg-white border border-dashed border-[#C8D7BC] rounded-2xl text-left ${compact ? 'p-4' : 'p-6 sm:p-8'}`}>
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#F2C230]/20 text-[#1F2A24] border border-[#F2C230]/40">
        Coming soon
      </span>
      <h3 className={`m-0 mt-3 font-bold text-[#1F2A24] ${compact ? 'text-sm' : 'text-lg sm:text-xl'}`}>{title}</h3>
      {description && (
        <p className="m-0 mt-2 text-sm text-[#6E6455] leading-relaxed max-w-[70ch]">{description}</p>
      )}
      {steps.length > 0 && (
        <ol className="m-0 mt-4 pl-5 flex flex-col gap-1.5 text-sm text-[#1F2A24]">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      {actions.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {actions.map(({ label, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#3669A9] hover:bg-[#347745] text-white cursor-pointer border-none"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComingSoon;
