import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function DarwinDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const handleSelect = (val) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`darwin-dropdown-container ${disabled ? 'disabled' : ''} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className={`darwin-dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="darwin-dropdown-selected-wrap">
          {selectedOption?.icon && (
            <span className="darwin-dropdown-item-icon">{selectedOption.icon}</span>
          )}
          <div className="darwin-dropdown-text-group">
            <span
              className={`darwin-dropdown-label ${!selectedOption ? 'placeholder' : ''}`}
              title={selectedOption?.label || placeholder}
            >
              {selectedOption?.label || placeholder}
            </span>
            {selectedOption?.subLabel && (
              <span className="darwin-dropdown-sublabel" title={selectedOption.subLabel}>
                {selectedOption.subLabel}
              </span>
            )}
          </div>
          {selectedOption?.badge && (
            <span className="darwin-dropdown-badge">{selectedOption.badge}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`darwin-dropdown-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div className="darwin-dropdown-menu" role="listbox">
          {options.length === 0 ? (
            <div className="darwin-dropdown-empty">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  className={`darwin-dropdown-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="darwin-dropdown-item-left">
                    {opt.icon && <span className="darwin-dropdown-item-icon">{opt.icon}</span>}
                    <div className="darwin-dropdown-item-text">
                      <div className="darwin-dropdown-item-top">
                        <span className="darwin-dropdown-item-title" title={opt.label}>
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <span className="darwin-dropdown-badge">{opt.badge}</span>
                        )}
                      </div>
                      {opt.subLabel && (
                        <span className="darwin-dropdown-item-sub" title={opt.subLabel}>
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <Check size={16} className="darwin-dropdown-check-icon" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

