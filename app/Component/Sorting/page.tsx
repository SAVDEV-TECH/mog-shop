 "use client";

import React, { useState, useEffect } from "react";

const sortproduct = [
  "Apple",
  "Banana",
  "Cherry",
  "Grapes",
  "Orange",
  "Pineapple",
  "Strawberry",
  "Watermelon",
];

function Page() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(sortproduct);
  const [sortType, setSortType] = useState("");

  useEffect(() => {
    let filteredArray = sortproduct.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase())
    );

    if (sortType === "az") {
      filteredArray.sort((a, b) => a.localeCompare(b));
    } else if (sortType === "za") {
      filteredArray.sort((a, b) => b.localeCompare(a));
    }

    setFilter(filteredArray);
  }, [query, sortType]); // ✅ Update whenever query or sortType changes

  return (
    <div className="p-5">
      {/* Search Input */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        type="text"
        placeholder="Search..."
        className="border p-2 rounded w-full mb-4"
      />

      {/* Sorting Dropdown */}
      <select title="iiii"
        onChange={(e) => setSortType(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      >
        <option value="">Sort By</option>
        <option value="az">A-Z</option>
        <option value="za">Z-A</option>
      </select>

      {/* Display Filtered and Sorted Results */}
      <ul className="space-y-2">
        {filter.length > 0 ? (
          filter.map((item, index) => (
            <li key={index} className="border p-2 rounded shadow">
              {item}
            </li>
          ))
        ): (
          <p>No results found</p>
        )}
      </ul>
    </div>
  );
}

export default Page;
