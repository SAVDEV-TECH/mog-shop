"use client";

import React  from "react";

interface ProductGarageProps {
  setSlidetoleft: React.Dispatch<React.SetStateAction<boolean>>;
  slidetoleft: boolean;
  sortOption?: string;
  setSortOption?: React.Dispatch<React.SetStateAction<string>>;
}

function ProductGarage({ setSlidetoleft, slidetoleft, sortOption, setSortOption }: ProductGarageProps) {
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
          value={sortOption || ""}
          onChange={(e) => setSortOption && setSortOption(e.target.value)}
          title="sortproduct"
          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        >
          <option value="">Sort by: Recommended</option>
          <option value="low-price">Price: Low to High</option>
          <option value="high-price">Price: High to Low</option>
          <option value="a-z">Alphabetical: A-Z</option>
          <option value="z-a">Alphabetical: Z-A</option>
        </select>
      </div>
    </div>
  );
}

export default ProductGarage;
