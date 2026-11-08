import React from 'react';
import { INT_COLOUR, INT_LABEL } from './NewProjectsView';

const CATEGORIES = [
  {
    id: 'blue',
    label: 'Blue',
    summary: 'Lakes, wetlands, floodplains, swales',
    dot: 'bg-[#3669A9]',
    border: 'border-[#3669A9]/30',
  },
  {
    id: 'green',
    label: 'Green',
    summary: 'Parks, tree canopies, bioswales, green roofs',
    dot: 'bg-[#347745]',
    border: 'border-[#347745]/30',
  },
  {
    id: 'grey',
    label: 'Grey',
    summary: 'Storm drains, culverts, pumping stations',
    dot: 'bg-[#A99E8A]',
    border: 'border-[#A99E8A]/50',
  },
];

const PRINCIPLES = [
  {
    title: 'Retention & Detention',
    text: 'Holding stormwater at source to delay runoff peaks and prevent flash flooding',
  },
  {
    title: 'Infiltration & Recharge',
    text: 'Allowing rainwater to soak into the ground, replenishing over-extracted aquifers',
  },
  {
    title: 'Biofiltration',
    text: 'Using soils and vegetation to naturally remove pollutants and sediments from runoff',
  },
  {
    title: 'Co-Benefits',
    text: 'Urban cooling, enhanced biodiversity, public amenity spaces, and climate resilience',
  },
];

const interventionsIn = (category) =>
  Object.keys(INT_COLOUR)
    .filter((type) => type !== 'other' && INT_COLOUR[type] === category)
    .map((type) => INT_LABEL[type] || type);

const BggGuidelines = () => {
  return (
    <div className="max-w-[1400px] mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8 text-left flex flex-col gap-6">
      <div>
        <h2 className="m-0 text-xl sm:text-2xl lg:text-[28px] font-bold text-heading tracking-[-0.3px]">BGG guidelines</h2>
        <p className="m-0 mt-2 text-sm sm:text-base text-[#6E6455] leading-relaxed max-w-[80ch]">
          Blue-Green-Grey infrastructure combines natural water systems (blue), ecological landscapes (green), and
          engineered drainage (grey) for holistic urban resilience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CATEGORIES.map((category) => (
          <section key={category.id} className={`bg-white border ${category.border} rounded-2xl p-5`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${category.dot}`} />
              <h3 className="m-0 text-base font-bold text-[#1F2A24]">{category.label}</h3>
            </div>
            <p className="m-0 mt-1 text-xs text-[#6E6455]">{category.summary}</p>
            <div className="mt-3 text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E6455]">
              Interventions on this platform
            </div>
            <ul className="m-0 mt-1.5 pl-4 flex flex-col gap-1 text-sm text-[#1F2A24]">
              {interventionsIn(category.id).map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRINCIPLES.map((principle) => (
          <div key={principle.title} className="bg-white border border-[#C8D7BC] rounded-2xl p-5">
            <div className="text-sm font-bold text-[#1F2A24]">{principle.title}</div>
            <div className="mt-1 text-xs text-[#6E6455] leading-relaxed">{principle.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BggGuidelines;
