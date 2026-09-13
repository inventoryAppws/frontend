import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * Reusable CustomSelect dropdown component that replaces native <select>.
 * 
 * Props:
 *  - value: currently selected value
 *  - onChange: callback with new value
 *  - options: Array of { value, label, icon, badge } OR array of strings
 *  - placeholder: default placeholder text (default: "Select option")
 *  - disabled: boolean
 *  - className: additional container CSS classes
 *  - size: "sm" | "md" | "lg"
 *  - required: boolean
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  disabled = false,
  className = "",
  size = "md",
  ariaLabel = "Dropdown select",
  prefixIcon = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Normalize options to objects { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "string" || typeof opt === "number") {
      return { value: String(opt), label: String(opt) };
    }
    return {
      value: opt.value !== undefined ? String(opt.value) : "",
      label: opt.label || opt.name || String(opt.value || ""),
      icon: opt.icon,
      badge: opt.badge
    };
  });

  const selectedOption = normalizedOptions.find((o) => o.value === String(value));
  const displayText = selectedOption ? selectedOption.label : placeholder;
  const hasValue = Boolean(selectedOption && selectedOption.value !== "");

  // Close when clicked outside or Escape pressed
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    if (onChange) onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`custom-select-wrapper ${size} ${isOpen ? "open" : ""} ${disabled ? "disabled" : ""} ${className}`}
    >
      <button
        type="button"
        className={`custom-select-trigger ${hasValue ? "has-value" : "placeholder"}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        <span className="custom-select-text">
          {prefixIcon ? (
            <span className="custom-select-icon prefix">{prefixIcon}</span>
          ) : selectedOption?.icon ? (
            <span className="custom-select-icon">{selectedOption.icon}</span>
          ) : null}
          {displayText}
        </span>
        <ChevronDown
          size={16}
          className={`custom-select-chevron ${isOpen ? "rotated" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="custom-select-dropdown" role="listbox">
          <ul className="custom-select-options">
            {normalizedOptions.map((opt) => {
              const isSelected = String(value) === opt.value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`custom-select-option ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="custom-select-opt-left">
                    {opt.icon && <span className="custom-select-opt-icon">{opt.icon}</span>}
                    <span className="custom-select-opt-label">{opt.label}</span>
                  </span>
                  <span className="custom-select-opt-right">
                    {opt.badge && <span className="custom-select-badge">{opt.badge}</span>}
                    {isSelected && <Check size={14} className="custom-select-check" />}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

