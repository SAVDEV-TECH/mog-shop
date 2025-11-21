"use client";
// import { useTheme } from "@/app/Component/ThemeProvider/ThemeProvider";
import { useTheme } from "@/app/Component/ThemeProvider/ThemeProvider";
import { FiSun, FiMoon } from "react-icons/fi";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <FiMoon size={20} className="text-gray-800" />
      ) : (
        <FiSun size={20} className="text-gray-200" />
      )}
    </button>
  );
}