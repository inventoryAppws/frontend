import React, { useState } from 'react';
import {
  X,
  Cpu,
  Camera,
  Smartphone,
  HardDrive,
  BatteryCharging,
  Wifi,
  Shield,
  Info,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import './ProductSpecificationsSidepanel.css';

/**
 * Flipkart-style Product Specifications Sidepanel
 * Features:
 * - Product Highlights with visual badge cards
 * - All Details with tabs: Specifications, Warranty, Manufacturer Info
 * - Categorized two-column specification rows (Dimensions, Battery, Connectivity, Display, Processor, Camera, General)
 * - Light and Dark theme adaptive
 */
export default function ProductSpecificationsSidepanel({
  isOpen,
  onClose,
  product
}) {
  const [activeTab, setActiveTab] = useState('specifications'); // 'specifications', 'warranty', 'manufacturer'
  const [isHighlightsOpen, setIsHighlightsOpen] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  if (!isOpen || !product) return null;

  const specs = product.specifications || {};

  // Extract nested or flat specs
  const getCategorySpecs = (catName) => {
    if (specs instanceof Map) {
      return specs.get(catName) || {};
    }
    if (specs[catName] && typeof specs[catName] === 'object' && !(specs[catName] instanceof Array)) {
      return specs[catName];
    }
    return {};
  };

  // Extract or build Product Highlights from specs
  const buildHighlights = () => {
    const highlights = [];
    const general = getCategorySpecs('General');
    const processor = getCategorySpecs('Processor') || getCategorySpecs('Os & Processor Features');
    const display = getCategorySpecs('Display') || getCategorySpecs('Display Features');
    const camera = getCategorySpecs('Camera') || getCategorySpecs('Camera Features');
    const battery = getCategorySpecs('Battery') || getCategorySpecs('Battery & Power Features');
    const storage = getCategorySpecs('Memory & Storage Features');

    // Storage ROM
    const rom = storage['Internal Storage'] || specs['ROM'] || specs['Storage'] || general['ROM'] || '256 GB ROM';
    highlights.push({
      icon: <HardDrive size={18} className="text-primary" />,
      text: rom
    });

    // Processor
    const cpuName = processor['Processor Type'] || processor['Chip'] || processor['Processor'] || processor['Model'] || 'A19 Chip, 6 Core Processor';
    const cpuSpeed = processor['Primary Clock Speed'] || processor['Clock Speed'] || '4.26 GHz Clock Speed';
    highlights.push({
      icon: <Cpu size={18} className="text-primary" />,
      text: `${cpuName} | Hexa Core | ${cpuSpeed}`
    });

    // Rear Camera
    const rearCam = camera['Primary Camera'] || camera['Rear Camera'] || specs['Rear Camera'] || '48MP + 48MP Rear Camera';
    highlights.push({
      icon: <Camera size={18} className="text-primary" />,
      text: rearCam
    });

    // Front Camera
    const frontCam = camera['Secondary Camera'] || camera['Front Camera'] || specs['Front Camera'] || '18MP Front Camera';
    highlights.push({
      icon: <Camera size={18} className="text-primary" />,
      text: frontCam
    });

    // Display
    const dispSize = display['Display Size'] || specs['Screen Size'] || '6.3 inch';
    const dispType = display['Display Type'] || display['Resolution Type'] || 'All Screen OLED Display';
    highlights.push({
      icon: <Smartphone size={18} className="text-primary" />,
      text: `${dispSize} ${dispType}`
    });

    return highlights;
  };

  const highlightsList = buildHighlights();

  // Defined Category Sections matching Flipkart/Amazon e-commerce specs
  const specSections = [
    {
      title: 'Battery & Power Features',
      data: {
        'Battery Type': 'Lithium Ion',
        'Battery Capacity': getCategorySpecs('Battery')['Battery Capacity'] || '4685 mAh',
        'Charging Speed': getCategorySpecs('Battery')['Charging Speed'] || '45W Fast Charging (50% in 25 mins)',
        'Wireless Charging': 'Yes (MagSafe and Qi2 Wireless Charging support)'
      }
    },
    {
      title: 'Dimensions',
      data: {
        'Width': '71.5 mm (7.15 cm)',
        'Depth': '7.95 mm (0.8 cm)',
        'Height': '149.6 mm (14.96 cm)',
        'Weight': '187 g'
      }
    },
    {
      title: 'Connectivity Features',
      data: {
        'Network Type': '5G, 4G VOLTE, 4G, 3G, 2G',
        'Supported Networks': '5G, 4G VoLTE, 4G LTE, UMTS, GSM',
        'Internet Connectivity': '5G, 4G, 3G, Wi-Fi, EDGE',
        '3G': 'Yes',
        'GPRS': 'Yes',
        'Micro USB Port': 'Yes',
        'Micro USB Version': 'USB 2 (Type C)',
        'Mini USB Port': 'No',
        'Bluetooth Support': 'Yes',
        'Bluetooth Version': 'v6.0',
        'Wi-Fi': 'Yes',
        'Wi-Fi Hotspot': 'Yes',
        'NFC': 'Yes',
        'USB Tethering': 'Yes',
        'TV Out': 'Yes',
        'Infrared': 'No',
        'USB Connectivity': 'Yes',
        'EDGE': 'Yes',
        'Map Support': 'Yes',
        'GPS Support': 'Yes'
      }
    },
    {
      title: 'General',
      data: {
        'In The Box': getCategorySpecs('Box & Warranty')['In The Box'] || `${product.name}, USB-C Charge Cable (1m), Documentation`,
        'Model Number': getCategorySpecs('General')['Model Number'] || 'A3296 / IN',
        'Model Name': product.name,
        'Color': product.colors?.[0] || 'Space Black / Natural Titanium',
        'Browse Type': 'Smartphones',
        'SIM Type': 'Dual SIM (nano-SIM and eSIM)',
        'Hybrid Sim Slot': 'No',
        'Touchscreen': 'Yes',
        'OTG Compatible': 'Yes',
        'Quick Charging': 'Yes'
      }
    },
    {
      title: 'Display Features',
      data: {
        'Display Size': getCategorySpecs('Display')['Display Size'] || '16.0 cm (6.3 inch)',
        'Resolution': getCategorySpecs('Display')['Resolution'] || '2622 x 1206 Pixels',
        'Resolution Type': 'Super Retina XDR OLED Display',
        'GPU': '6-core GPU with Hardware-accelerated ray tracing',
        'Display Type': 'All-Screen OLED Display with Dynamic Island',
        'HD Game Support': 'Yes',
        'Refresh Rate': '120 Hz ProMotion adaptive refresh rate'
      }
    },
    {
      title: 'Os & Processor Features',
      data: {
        'Operating System': getCategorySpecs('Processor')['Operating System'] || 'Latest Generation OS',
        'Processor Brand': getCategorySpecs('Processor')['Processor Brand'] || 'Apple / Snapdragon',
        'Processor Type': getCategorySpecs('Processor')['Processor Type'] || 'A19 Pro Chip / Octa-Core Ultra',
        'Processor Core': 'Hexa Core (2 Performance + 4 Efficiency cores)',
        'Primary Clock Speed': '4.26 GHz'
      }
    },
    {
      title: 'Memory & Storage Features',
      data: {
        'Internal Storage': '256 GB',
        'RAM': '8 GB Unified Memory',
        'Expandable Storage': 'No',
        'Supported Memory Card Type': 'NA'
      }
    },
    {
      title: 'Camera Features',
      data: {
        'Primary Camera': '48MP + 48MP Ultra Wide + 12MP Telephoto',
        'Primary Camera Features': 'Optical Image Stabilization, Photonic Engine, Deep Fusion, Smart HDR 5, Night Mode Portraits',
        'Secondary Camera': '18MP TrueDepth Front Camera',
        'Secondary Camera Features': 'Autofocus with Focus Pixels, Retina Flash, Photonic Engine, 4K Dolby Vision HDR video recording',
        'Video Recording Resolution': '4K at 24 fps, 25 fps, 30 fps, or 60 fps; 1080p Cinematic mode'
      }
    }
  ];

  return (
    <div className="ps-sidepanel-overlay" onClick={onClose}>
      <div
        className="ps-sidepanel-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ps-sidepanel-header">
          <div className="ps-header-left">
            <h2 className="ps-drawer-title">Product Specifications</h2>
            <p className="ps-drawer-subtitle">{product.name}</p>
          </div>
          <button
            type="button"
            className="ps-close-btn"
            onClick={onClose}
            title="Close specifications"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="ps-sidepanel-body">
          {/* SECTION 1: Product Highlights (Flipkart visual icon cards) */}
          <div className="ps-section-box">
            <button
              type="button"
              className="ps-section-header-btn"
              onClick={() => setIsHighlightsOpen(!isHighlightsOpen)}
            >
              <h3 className="ps-section-title">Product highlights</h3>
              {isHighlightsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {isHighlightsOpen && (
              <div className="ps-highlights-list">
                {highlightsList.map((h, i) => (
                  <div key={i} className="ps-highlight-item">
                    <div className="ps-highlight-icon-box">{h.icon}</div>
                    <span className="ps-highlight-text">{h.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: All Details with Tabs */}
          <div className="ps-section-box">
            <button
              type="button"
              className="ps-section-header-btn"
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            >
              <h3 className="ps-section-title">All details</h3>
              {isDetailsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {isDetailsOpen && (
              <div className="ps-details-content">
                {/* Pill Tab Switchers */}
                <div className="ps-tab-pills-row">
                  {[
                    { id: 'specifications', label: 'Specifications' },
                    { id: 'warranty', label: 'Warranty' },
                    { id: 'manufacturer', label: 'Manufacturer info' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`ps-tab-pill ${activeTab === t.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* TAB CONTENT: Specifications */}
                {activeTab === 'specifications' && (
                  <div className="ps-specs-tables-wrap">
                    {specSections.map((sec, secIdx) => (
                      <div key={secIdx} className="ps-spec-category-block">
                        <h4 className="ps-spec-category-heading">{sec.title}</h4>
                        <div className="ps-spec-table">
                          {Object.entries(sec.data).map(([label, val], rIdx) => (
                            <div key={rIdx} className="ps-spec-row">
                              <span className="ps-spec-label">{label}</span>
                              <span className="ps-spec-val">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB CONTENT: Warranty */}
                {activeTab === 'warranty' && (
                  <div className="ps-specs-tables-wrap">
                    <div className="ps-spec-category-block">
                      <h4 className="ps-spec-category-heading">Warranty Details</h4>
                      <div className="ps-spec-table">
                        <div className="ps-spec-row">
                          <span className="ps-spec-label">Warranty Summary</span>
                          <span className="ps-spec-val">1 Year Domestic Manufacturer Warranty on Device and 6 Months on Accessories</span>
                        </div>
                        <div className="ps-spec-row">
                          <span className="ps-spec-label">Warranty Service Type</span>
                          <span className="ps-spec-val">Carry-in / On-Site Authorized Service Center Support across India</span>
                        </div>
                        <div className="ps-spec-row">
                          <span className="ps-spec-label">Covered in Warranty</span>
                          <span className="ps-spec-val">Manufacturing Defects, Motherboard, Display &amp; Internal Hardware failures</span>
                        </div>
                        <div className="ps-spec-row">
                          <span className="ps-spec-label">Not Covered in Warranty</span>
                          <span className="ps-spec-val">Physical damage, Liquid immersion, Unauthorized third-party repairs or alterations</span>
                        </div>
                        <div className="ps-spec-row">
                          <span className="ps-spec-label">Domestic Warranty</span>
                          <span className="ps-spec-val">1 Year</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: Manufacturer info */}
                {activeTab === 'manufacturer' && (
                  <div className="ps-specs-tables-wrap">
                    <div className="ps-spec-category-block">
                      <h4 className="ps-spec-category-heading">Manufacturer &amp; Origin</h4>
                      <div className="ps-spec-table">
                        <div className="ps-spec-row">
                          <span className="ps-spec-label">Manufacturer</span>
                          <span className="ps-spec-val">Foxconn Technology India / Authorized Assembly Partner</span>
                        </div>
                        <div className="ps-spec-row">
                          <span className="ps-spec-label">Country of Origin</span>
                          <span className="ps-spec-val">India / Global</span>
                        </div>
                        <div className="ps-spec-row">
                          <span className="ps-spec-label">Importer</span>
                          <span className="ps-spec-val">JK Retail Pvt Ltd, Bangalore, Karnataka - 560001</span>
                        </div>
                        <div className="ps-spec-row">
                          <span className="ps-spec-label">Packer Details</span>
                          <span className="ps-spec-val">JK Retail Regional Distribution Hub, Whitefield, Bangalore</span>
                        </div>
                        <div className="ps-spec-row">
                          <span className="ps-spec-label">Generic Name</span>
                          <span className="ps-spec-val">Consumer Electronics Product</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

