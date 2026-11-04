import React from 'react';

const RoleScreen = ({ title }) => {
  return (
    <div className="max-w-[1400px] mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h2 className="m-0 text-xl sm:text-2xl lg:text-[28px] font-bold text-heading tracking-[-0.3px]">
        {title}
      </h2>
    </div>
  );
};

export default RoleScreen;
