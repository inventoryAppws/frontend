import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Monitor, Camera, BatteryCharging, Wifi, Layers, ShieldCheck, Box, CheckCircle2 } from 'lucide-react';
import './ProductSpecificationsAccordion.css';

/**
 * Categorized Specification Accordion
 * Groups technical specifications logically. Cleanly hidden if no specifications exist.
 * Supports nested groups (e.g. { General: { Brand: 'Apple' } }) as well as flat key-value pairs.
 */
export default function ProductSpecificationsAccordion({ specifications, category, brand, productName, onOpenSidepanel }) {
  if (!specifications) return null;

  // Convert Map to plain object if needed
  let rawSpecs = specifications;
  if (specifications instanceof Map) {
    rawSpecs = Object.fromEntries(specifications);
  } else if (typeof specifications === 'string') {
    try {
      rawSpecs = JSON.parse(specifications);
    } catch {
      return null;
    }
  }

  if (typeof rawSpecs !== 'object' || Object.keys(rawSpecs).length === 0) {
    return null;
  }

  // Helper to pick section icon
  const getSectionIcon = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('processor') || t.includes('performance') || t.includes('chip') || t.includes('memory')) return <Cpu size={18} className="spec-icon" />;
    if (t.includes('display') || t.includes('screen') || t.includes('graphic')) return <Monitor size={18} className="spec-icon" />;
    if (t.includes('camera') || t.includes('optics') || t.includes('video')) return <Camera size={18} className="spec-icon" />;
    if (t.includes('battery') || t.includes('charge') || t.includes('power')) return <BatteryCharging size={18} className="spec-icon" />;
    if (t.includes('connect') || t.includes('port') || t.includes('wireless') || t.includes('network')) return <Wifi size={18} className="spec-icon" />;
    if (t.includes('warranty') || t.includes('box') || t.includes('package')) return <ShieldCheck size={18} className="spec-icon" />;
    if (t.includes('general') || t.includes('overview') || t.includes('design')) return <Layers size={18} className="spec-icon" />;
    return <Box size={18} className="spec-icon" />;
  };

  // Build categorized sections
  const categorizedSections = [];

  // Check if rawSpecs is nested (e.g. { General: { ... }, Processor: { ... } })
  const isNested = Object.values(rawSpecs).some(val => val && typeof val === 'object' && !Array.isArray(val));

  if (isNested) {
    Object.entries(rawSpecs).forEach(([sectionTitle, sectionContent], idx) => {
      if (sectionContent && typeof sectionContent === 'object' && !Array.isArray(sectionContent)) {
        const items = Object.entries(sectionContent)
          .filter(([_, val]) => val !== undefined && val !== null && val !== '')
          .map(([label, val]) => ({
            label,
            value: typeof val === 'object' ? JSON.stringify(val) : String(val)
          }));

        if (items.length > 0) {
          categorizedSections.push({
            id: `sec_${idx}`,
            title: sectionTitle,
            icon: getSectionIcon(sectionTitle),
            items
          });
        }
      } else if (sectionContent !== undefined && sectionContent !== null && sectionContent !== '') {
        // Flat item in top level
        let addSec = categorizedSections.find(s => s.id === 'general');
        if (!addSec) {
          addSec = { id: 'general', title: 'General Specifications', icon: <Layers size={18} className="spec-icon" />, items: [] };
          categorizedSections.unshift(addSec);
        }
        addSec.items.push({
          label: sectionTitle,
          value: String(sectionContent)
        });
      }
    });
  } else {
    // Flat mapping into logical sections
    const sectionDefinitions = [
      {
        id: 'general',
        title: 'General Information',
        icon: <Layers size={18} className="spec-icon" />,
        keys: ['brand', 'model', 'model name', 'series', 'color', 'sim type', 'launch year', 'dimensions', 'weight', 'material', 'in the box']
      },
      {
        id: 'processor',
        title: 'Processor & Memory',
        icon: <Cpu size={18} className="spec-icon" />,
        keys: ['processor', 'chipset', 'cpu', 'gpu', 'ram', 'internal storage', 'storage', 'storage type', 'clock speed', 'memory']
      },
      {
        id: 'display',
        title: 'Display & Graphics',
        icon: <Monitor size={18} className="spec-icon" />,
        keys: ['display', 'screen size', 'resolution', 'panel type', 'refresh rate', 'brightness', 'aspect ratio', 'hdr support', 'graphics']
      },
      {
        id: 'camera',
        title: 'Camera & Optics',
        icon: <Camera size={18} className="spec-icon" />,
        keys: ['rear camera', 'primary camera', 'secondary camera', 'front camera', 'video recording', 'flash', 'optical zoom', 'camera']
      },
      {
        id: 'battery',
        title: 'Battery & Power',
        icon: <BatteryCharging size={18} className="spec-icon" />,
        keys: ['battery capacity', 'battery', 'charging speed', 'fast charging', 'wireless charging', 'battery life', 'power consumption']
      },
      {
        id: 'connectivity',
        title: 'Connectivity & Ports',
        icon: <Wifi size={18} className="spec-icon" />,
        keys: ['5g', '4g volte', 'wi-fi', 'bluetooth', 'nfc', 'usb ports', 'hdmi ports', 'audio jack', 'sim slots', 'connectivity']
      },
      {
        id: 'warranty',
        title: 'Warranty & Services',
        icon: <ShieldCheck size={18} className="spec-icon" />,
        keys: ['warranty', 'warranty summary', 'domestic warranty', 'service type', 'in the box & warranty']
      }
    ];

    const assignedKeys = new Set();

    sectionDefinitions.forEach(sec => {
      const matched = [];
      sec.keys.forEach(k => {
        const foundKey = Object.keys(rawSpecs).find(rk => rk.toLowerCase().trim() === k);
        if (foundKey && rawSpecs[foundKey]) {
          matched.push({ label: foundKey, value: String(rawSpecs[foundKey]) });
          assignedKeys.add(foundKey);
        }
      });
      if (matched.length > 0) {
        categorizedSections.push({ id: sec.id, title: sec.title, icon: sec.icon, items: matched });
      }
    });

    // Unassigned keys
    const remaining = [];
    Object.keys(rawSpecs).forEach(k => {
      if (!assignedKeys.has(k) && rawSpecs[k]) {
        remaining.push({ label: k, value: String(rawSpecs[k]) });
      }
    });

    if (remaining.length > 0) {
      categorizedSections.push({
        id: 'additional',
        title: 'Additional Specifications',
        icon: <Box size={18} className="spec-icon" />,
        items: remaining
      });
    }
  }

  if (categorizedSections.length === 0) return null;

  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    categorizedSections.forEach(s => { initial[s.id] = true; });
    return initial;
  });

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="product-specs-container" id="product-specifications-section">
      <div className="product-specs-header">
        <div className="specs-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className="specs-main-title">Technical Specifications</h2>
            <span className="specs-badge">
              <CheckCircle2 size={12} /> Verified Product Details
            </span>
          </div>
          {onOpenSidepanel && (
            <button
              type="button"
              className="specs-sidepanel-trigger-btn"
              onClick={onOpenSidepanel}
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#2563eb',
                background: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>More Specifications</span>
              <span>&rarr;</span>
            </button>
          )}
        </div>
        <p className="specs-subtitle">
          Comprehensive hardware &amp; engineering specifications for <strong>{productName || 'this product'}</strong>
        </p>
      </div>

      <div className="specs-accordions-list">
        {categorizedSections.map((sec) => {
          const isOpen = openSections[sec.id];
          return (
            <div key={sec.id} className={`spec-accordion-card ${isOpen ? 'open' : 'closed'}`}>
              <button
                type="button"
                className="spec-accordion-trigger"
                onClick={() => toggleSection(sec.id)}
                aria-expanded={isOpen}
              >
                <div className="spec-trigger-left">
                  {sec.icon}
                  <span className="spec-trigger-title">{sec.title}</span>
                  <span className="spec-item-count">({sec.items.length})</span>
                </div>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isOpen && (
                <div className="spec-table-container">
                  <table className="spec-table">
                    <tbody>
                      {sec.items.map((item, idx) => (
                        <tr key={idx} className="spec-table-row">
                          <td className="spec-table-label">{item.label}</td>
                          <td className="spec-table-value">{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
