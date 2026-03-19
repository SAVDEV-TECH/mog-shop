"use client";

import React  from "react";

interface ProductGarageProps {
  setSlidetoleft: React.Dispatch<React.SetStateAction<boolean>>;
  slidetoleft: boolean;
}

function ProductGarage({ setSlidetoleft, slidetoleft}: ProductGarageProps) {
  const handleshow = () => {
    setSlidetoleft(prev => !prev);
  };

  return (
    <div className="flex w-full items-center justify-between p-4">
      <div> {/* Title Section */}</div>

      <div className="flex items-center gap-4">
        <div onClick={handleshow} className="cursor-pointer hidden md:flex items-center gap-2">
          {slidetoleft ? 'Hide filter' : 'Show filter'}
        </div>

        <select
          title="sortproduct"
          className="border px-2 py-1 rounded-md"
        >
          <option value="">Sort</option>
          <option value="a-z">A-Z</option>
          <option value="z-a">Z-A</option>
          <option value="low price">Low Price</option>
        </select>
      </div>
    </div>
  );
}

export default ProductGarage;
