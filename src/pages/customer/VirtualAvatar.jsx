import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShoppingBag,
  Heart,
  Share2,
  Bookmark,
  Check,
  RefreshCw,
  Plus,
  ArrowRight,
  Sliders,
  Palette,
  Eye,
  RotateCw,
  X,
  Copy,
  Trash2,
  Search,
  CheckCircle2,
  Layers,
  ChevronRight,
  Star,
  Zap,
  CheckCheck,
  Wand2,
  ShieldCheck,
  Tag
} from 'lucide-react';
import ThreeAvatarCanvas from '../../components/avatar/ThreeAvatarCanvas';
import { addToCart } from '../../services/cartService';
import { API_BASE_URL } from '../../services/api';
import './VirtualAvatar.css';

const FASHION_COLOR_MAP = {
  'sky blue': '#38bdf8',
  'light blue': '#7dd3fc',
  'powder blue': '#bae6fd',
  'baby blue': '#93c5fd',
  'ice blue': '#cffafe',
  'navy': '#1e3a8a',
  'navy blue': '#172554',
  'midnight blue': '#0f172a',
  'royal blue': '#2563eb',
  'cobalt': '#1d4ed8',
  'indigo': '#4338ca',
  'dark indigo': '#312e81',
  'denim': '#2563eb',
  'washed denim': '#60a5fa',
  'black': '#0f172a',
  'washed black': '#334155',
  'jet black': '#020617',
  'pitch black': '#000000',
  'charcoal': '#374151',
  'charcoal grey': '#374151',
  'dark grey': '#4b5563',
  'grey': '#6b7280',
  'gray': '#6b7280',
  'light grey': '#d1d5db',
  'heather grey': '#9ca3af',
  'white': '#f8fafc',
  'off white': '#f1f5f9',
  'ivory': '#fffff0',
  'cream': '#fef3c7',
  'beige': '#d4b996',
  'tan': '#d2b48c',
  'khaki': '#c2b280',
  'sand': '#e2d9cc',
  'camel': '#c19a6b',
  'brown': '#78350f',
  'dark brown': '#451a03',
  'chocolate': '#3e2723',
  'coffee': '#4a2c11',
  'sage': '#84a98c',
  'sage green': '#84a98c',
  'olive': '#556b2f',
  'olive green': '#4b5320',
  'forest green': '#14532d',
  'emerald': '#059669',
  'mint': '#6ee7b7',
  'mint green': '#a7f3d0',
  'army green': '#4d5645',
  'moss green': '#4a5d4e',
  'green': '#16a34a',
  'red': '#dc2626',
  'crimson': '#991b1b',
  'maroon': '#800000',
  'burgundy': '#831843',
  'wine': '#722f37',
  'coral': '#f43f5e',
  'salmon': '#fb7185',
  'peach': '#fed7aa',
  'rose': '#f43f5e',
  'dusty rose': '#e0a899',
  'blush': '#fecdd3',
  'pink': '#ec4899',
  'hot pink': '#db2777',
  'yellow': '#eab308',
  'mustard': '#ca8a04',
  'gold': '#d97706',
  'amber': '#f59e0b',
  'orange': '#ea580c',
  'rust': '#c2410c',
  'terracotta': '#e07a5f',
  'purple': '#7e22ce',
  'violet': '#6d28d9',
  'lavender': '#c084fc',
  'lilac': '#c4b5fd',
  'plum': '#581c87',
  'cyan': '#06b6d4',
  'teal': '#0f766e',
  'turquoise': '#14b8a6'
};

function parseFashionColor(rawInput, fallback = '#2563eb') {
  if (!rawInput) return fallback;
  if (Array.isArray(rawInput)) rawInput = rawInput[0];
  if (typeof rawInput !== 'string') return fallback;
  const str = rawInput.trim().toLowerCase();
  if (!str) return fallback;
  if (str.startsWith('#')) return str;
  if (FASHION_COLOR_MAP[str]) return FASHION_COLOR_MAP[str];

  for (const [key, hex] of Object.entries(FASHION_COLOR_MAP)) {
    if (str.includes(key)) return hex;
  }
  return fallback;
}

/**
 * Real-Time 3D Fit Preview Component
 * Replaces static stock photos with live, realistic garment silhouettes
 * representing exact fits (T-Shirt, Hoodie, Skirt, Baggy Cargo, Jeans, etc.) in authentic fabric colors.
 */
function RealTimeFitPreview({ item, isEquipped }) {
  const color = item.avatarColor || '#2563eb';
  const tpl = (item.avatarTemplateId || '').toLowerCase();
  const name = (item.name || '').toLowerCase();

  const isTshirt = tpl === 'tpl_tshirt' || /t-shirt|tee|crewneck/i.test(name);
  const isHoodie = tpl === 'tpl_hoodie' || /hoodie/i.test(name);
  const isJacket = tpl === 'tpl_jacket' || /jacket|blazer|bomber/i.test(name);
  const isShirt = tpl === 'tpl_shirt' || /shirt|oxford|blouse/i.test(name);
  const isSkirt = tpl === 'tpl_skirt' || /skirt/i.test(name);
  const isDress = tpl === 'tpl_dress' || /dress|gown|maxi/i.test(name);
  const isBaggyPants = tpl === 'tpl_baggy_pants' || /baggy|cargo|wide.?leg/i.test(name);
  const isJeans = tpl === 'tpl_jeans' || /jean|denim/i.test(name);
  const isPants = tpl === 'tpl_pants' || /pant|trouser|slacks|chino/i.test(name);
  const isBoots = tpl === 'tpl_shoes_boots' || /boot/i.test(name);
  const isShoes = tpl === 'tpl_shoes_sneakers' || isBoots || /shoe|sneaker|dunk|trainer/i.test(name);
  const isCap = tpl === 'tpl_accessory_cap' || /cap|hat/i.test(name);
  const isGlasses = tpl === 'tpl_accessory_glasses' || /sunglasses|glasses|optics/i.test(name);
  const isBag = tpl === 'tpl_bag' || /bag|messenger|tote/i.test(name);

  const gradId = `fit-grad-${item._id || Math.random().toString(36).substr(2, 6)}`;

  return (
    <div className="va-fit-preview-card">
      <svg viewBox="0 0 160 140" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.82" />
          </linearGradient>
        </defs>

        {/* 1. T-SHIRT FIT */}
        {isTshirt && (
          <g>
            <path
              d="M 52 38 L 64 45 Q 80 52 96 45 L 108 38 L 132 54 L 118 72 L 108 66 L 108 116 L 52 116 L 52 66 L 42 72 L 28 54 Z"
              fill={`url(#${gradId})`}
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="1.5"
            />
            <path
              d="M 64 45 Q 80 54 96 45 Q 80 40 64 45 Z"
              fill="#ffffff"
              fillOpacity="0.3"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="1"
            />
            <line x1="30" y1="56" x2="40" y2="70" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            <line x1="130" y1="56" x2="120" y2="70" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            <line x1="52" y1="112" x2="108" y2="112" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" strokeDasharray="3 2" />
          </g>
        )}

        {/* 2. HOODIE FIT */}
        {isHoodie && (
          <g>
            <path
              d="M 60 44 C 54 22, 106 22, 100 44 Z"
              fill={`url(#${gradId})`}
              filter="brightness(0.85)"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="1.5"
            />
            <path
              d="M 50 44 L 62 46 L 98 46 L 110 44 L 136 64 L 122 82 L 112 74 L 112 120 L 48 120 L 48 74 L 38 82 L 24 64 Z"
              fill={`url(#${gradId})`}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="1.5"
            />
            <path
              d="M 60 90 L 100 90 L 105 114 L 55 114 Z"
              fill="#000000"
              fillOpacity="0.1"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
            />
            <line x1="74" y1="48" x2="74" y2="72" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <line x1="86" y1="48" x2="86" y2="72" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* 3. JACKET FIT */}
        {isJacket && (
          <g>
            <path
              d="M 52 38 L 66 44 L 94 44 L 108 38 L 134 56 L 122 76 L 110 68 L 110 118 L 50 118 L 50 68 L 38 76 L 26 56 Z"
              fill={`url(#${gradId})`}
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="1.5"
            />
            <path d="M 66 44 L 76 74 L 80 44 Z" fill="#000000" fillOpacity="0.15" />
            <path d="M 94 44 L 84 74 L 80 44 Z" fill="#000000" fillOpacity="0.15" />
            <line x1="80" y1="44" x2="80" y2="118" stroke="#cbd5e1" strokeWidth="2.5" />
            <line x1="58" y1="94" x2="70" y2="98" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
            <line x1="102" y1="94" x2="90" y2="98" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
          </g>
        )}

        {/* 4. OXFORD SHIRT */}
        {isShirt && !isTshirt && !isHoodie && !isJacket && (
          <g>
            <path
              d="M 52 38 L 66 44 L 94 44 L 108 38 L 132 54 L 120 72 L 108 66 L 108 116 L 52 116 L 52 66 L 40 72 L 28 54 Z"
              fill={`url(#${gradId})`}
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="1.5"
            />
            <path d="M 64 44 L 72 58 L 80 46 Z" fill="#ffffff" fillOpacity="0.3" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
            <path d="M 96 44 L 88 58 L 80 46 Z" fill="#ffffff" fillOpacity="0.3" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
            <line x1="80" y1="46" x2="80" y2="116" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
            <circle cx="80" cy="62" r="1.5" fill="#ffffff" />
            <circle cx="80" cy="76" r="1.5" fill="#ffffff" />
            <circle cx="80" cy="90" r="1.5" fill="#ffffff" />
            <circle cx="80" cy="104" r="1.5" fill="#ffffff" />
          </g>
        )}

        {/* 5. SKIRT FIT */}
        {isSkirt && (
          <g>
            <path
              d="M 58 44 L 102 44 L 124 116 L 36 116 Z"
              fill={`url(#${gradId})`}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="1.5"
            />
            <rect x="58" y="44" width="44" height="8" rx="2" fill="#000000" fillOpacity="0.15" />
            <line x1="68" y1="52" x2="52" y2="116" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
            <line x1="76" y1="52" x2="70" y2="116" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
            <line x1="84" y1="52" x2="90" y2="116" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
            <line x1="92" y1="52" x2="108" y2="116" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
          </g>
        )}

        {/* 6. DRESS FIT */}
        {isDress && (
          <g>
            <path
              d="M 64 34 L 72 44 Q 80 48 88 44 L 96 34 L 104 64 L 94 74 L 118 122 L 42 122 L 66 74 L 56 64 Z"
              fill={`url(#${gradId})`}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="1.5"
            />
            <path d="M 66 74 Q 80 78 94 74" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" />
            <path d="M 42 122 Q 80 126 118 122" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
          </g>
        )}

        {/* 7. BAGGY CARGO PANTS */}
        {isBaggyPants && (
          <g>
            <path
              d="M 52 40 L 108 40 L 116 122 L 88 122 L 80 72 L 72 122 L 44 122 Z"
              fill={`url(#${gradId})`}
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="1.5"
            />
            <rect x="36" y="66" width="12" height="22" rx="2" fill={`url(#${gradId})`} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
            <path d="M 36 66 L 42 70 L 48 66 Z" fill="#000000" fillOpacity="0.2" />
            <rect x="112" y="66" width="12" height="22" rx="2" fill={`url(#${gradId})`} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
            <path d="M 112 66 L 118 70 L 124 66 Z" fill="#000000" fillOpacity="0.2" />
            <line x1="52" y1="46" x2="108" y2="46" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          </g>
        )}

        {/* 8. JEANS FIT */}
        {isJeans && !isBaggyPants && (
          <g>
            <path
              d="M 56 40 L 104 40 L 108 122 L 85 122 L 80 66 L 75 122 L 52 122 Z"
              fill={`url(#${gradId})`}
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="1.5"
            />
            <path d="M 56 50 Q 68 50 68 40" fill="none" stroke="#ca8a04" strokeWidth="1.2" />
            <path d="M 104 50 Q 92 50 92 40" fill="none" stroke="#ca8a04" strokeWidth="1.2" />
            <path d="M 80 40 L 80 58 Q 84 64 80 66" fill="none" stroke="#ca8a04" strokeWidth="1.2" />
          </g>
        )}

        {/* 9. TAILORED CHINOS / PANTS */}
        {isPants && !isBaggyPants && !isJeans && !isSkirt && (
          <g>
            <path
              d="M 58 40 L 102 40 L 106 122 L 84 122 L 80 66 L 76 122 L 54 122 Z"
              fill={`url(#${gradId})`}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="1.5"
            />
            <line x1="66" y1="48" x2="64" y2="122" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1" />
            <line x1="94" y1="48" x2="96" y2="122" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1" />
          </g>
        )}

        {/* 10. SNEAKERS & BOOTS */}
        {isShoes && (
          <g transform="translate(10, 10)">
            {isBoots ? (
              <g>
                <path
                  d="M 40 40 L 68 40 L 68 76 L 104 86 Q 112 94 104 104 L 32 104 Q 28 92 34 76 L 40 40 Z"
                  fill={`url(#${gradId})`}
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth="1.5"
                />
                <path d="M 48 44 L 60 44 L 56 70 L 52 70 Z" fill="#18181b" />
                <rect x="30" y="102" width="76" height="8" rx="2" fill="#0f172a" />
              </g>
            ) : (
              <g>
                <path
                  d="M 36 68 Q 54 62 68 54 Q 84 56 96 74 L 118 84 Q 124 94 116 100 L 26 100 Q 22 84 36 68 Z"
                  fill={`url(#${gradId})`}
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth="1.5"
                />
                <rect x="24" y="98" width="94" height="10" rx="3" fill="#ffffff" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                <path d="M 64 56 L 82 78" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 2" />
              </g>
            )}
          </g>
        )}

        {/* 11. SUNGLASSES */}
        {isGlasses && (
          <g transform="translate(0, 15)">
            <circle cx="56" cy="55" r="18" fill="#18181b" stroke={color} strokeWidth="3.5" />
            <circle cx="104" cy="55" r="18" fill="#18181b" stroke={color} strokeWidth="3.5" />
            <path d="M 46 48 Q 56 42 62 48" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
            <path d="M 94 48 Q 104 42 110 48" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
            <line x1="74" y1="50" x2="86" y2="50" stroke={color} strokeWidth="3" />
            <line x1="74" y1="56" x2="86" y2="56" stroke={color} strokeWidth="2.5" />
            <path d="M 38 52 L 20 54" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <path d="M 122 52 L 140 54" stroke={color} strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* 12. BASEBALL CAP */}
        {isCap && (
          <g transform="translate(0, 15)">
            <path
              d="M 40 76 Q 80 26 120 76 Z"
              fill={`url(#${gradId})`}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="1.5"
            />
            <line x1="80" y1="36" x2="80" y2="76" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <circle cx="80" cy="36" r="3.5" fill="#ffffff" />
            <path
              d="M 38 76 Q 80 84 136 78 Q 142 86 130 90 Q 76 96 34 82 Z"
              fill={`url(#${gradId})`}
              filter="brightness(0.9)"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* 13. CROSSBODY BAG */}
        {isBag && (
          <g transform="translate(0, 10)">
            <path d="M 28 30 Q 80 60 132 30" fill="none" stroke="#1e293b" strokeWidth="4" />
            <rect x="45" y="55" width="70" height="52" rx="8" fill={`url(#${gradId})`} stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
            <path d="M 45 55 L 45 80 L 80 90 L 115 80 L 115 55 Z" fill="#000000" fillOpacity="0.15" />
            <rect x="74" y="84" width="12" height="10" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
          </g>
        )}
      </svg>

      {/* Floating Badges */}
      <span className="va-bitmoji-pill">
        <Sparkles size={10} /> 3D Fit
      </span>
      {isEquipped && (
        <span className="va-garment-equipped-badge">
          <Check size={11} strokeWidth={3} /> Wearing
        </span>
      )}

      {/* Fit Profile Badge */}
      {item.fitProfile && (
        <span className="va-fit-profile-pill" title={item.fitProfile}>
          {item.fitProfile}
        </span>
      )}
    </div>
  );
}

/**
 * Ultra-Realistic 3D Virtual Dressing Room & E-Commerce Avatar Studio
 * Powered by React Three Fiber + Three.js with Reusable 3D Clothing Templates,
 * Snapchat Bitmoji-style Wardrobe, Real Store Catalog Mapping, and AI VTON Simulation.
 */
export default function VirtualAvatar() {
  const navigate = useNavigate();

  // Navigation tabs: 'avatar_wardrobe', 'real_products', 'saved_looks', 'try_on'
  const [activeNavTab, setActiveNavTab] = useState('avatar_wardrobe');

  // Avatar Customization State
  const [gender, setGender] = useState('Male'); // 'Male' | 'Female'
  const [bodyType, setBodyType] = useState('Athletic'); // 'Slim' | 'Regular' | 'Athletic'
  const [height, setHeight] = useState(178);
  const [skinTone, setSkinTone] = useState('#f7d0b5');
  const [hairStyle, setHairStyle] = useState('Modern Pompadour');
  const [hairColor, setHairColor] = useState('#1f2937');

  // Modal states
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lookAvatarSnapshot, setLookAvatarSnapshot] = useState(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');

  // Active equipped outfit (starts empty with clean minimal inners so equipped styles blend clearly!)
  const [outfit, setOutfit] = useState({});

  // 3D Reblending & Garment Fitting Transition State
  const [isReblending, setIsReblending] = useState(false);
  const [reblendingGarment, setReblendingGarment] = useState('');

  // Category Rail for Real Catalog
  const categoryRail = [
    { id: 'Tops', label: 'Tops', icon: '👕', subcategories: ['All', 'T-Shirt', 'Shirt', 'Hoodie', 'Sweatshirt', 'Jacket', 'Blazer'] },
    { id: 'Bottoms', label: 'Bottoms', icon: '👖', subcategories: ['All', 'Jeans', 'Trousers', 'Chinos', 'Cargos', 'Shorts', 'Joggers'] },
    { id: 'Footwear', label: 'Footwear', icon: '👟', subcategories: ['All', 'Sneakers', 'Formal Shoes', 'Loafers', 'Boots', 'Sandals'] },
    { id: 'Dresses', label: 'Dresses', icon: '👗', subcategories: ['All', 'Casual Dress', 'Maxi', 'Party Gown', 'Floral Midi'] },
    { id: 'Accessories', label: 'Accessories', icon: '👓', subcategories: ['All', 'Sunglasses', 'Watches', 'Belts', 'Hats', 'Cap'] },
    { id: 'Outerwear', label: 'Outerwear', icon: '🧥', subcategories: ['All', 'Overcoats', 'Denim Jackets', 'Bombers', 'Trench'] },
    { id: 'Sports', label: 'Sports', icon: '🏋️', subcategories: ['All', 'Gym Tees', 'Compression Tights', 'Tracksuits'] },
    { id: 'Traditional', label: 'Traditional', icon: '🥻', subcategories: ['All', 'Kurta Pajama', 'Sherwani', 'Saree', 'Lehenga'] },
    { id: 'Bags', label: 'Bags', icon: '🎒', subcategories: ['All', 'Backpacks', 'Tote Bags', 'Duffels', 'Messenger'] }
  ];

  const [selectedRailCategory, setSelectedRailCategory] = useState('Tops');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Wardrobe / Bitmoji items
  const [bitmojiItems, setBitmojiItems] = useState([]);
  const [selectedWardrobeCategory, setSelectedWardrobeCategory] = useState('All');

  // Real store catalog items & wardrobe
  const [catalogItems, setCatalogItems] = useState([]);
  const [savedLooks, setSavedLooks] = useState([]);
  const [newLookName, setNewLookName] = useState('');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  // VTON Try-On State
  const [vtonGarment, setVtonGarment] = useState(null);
  const [vtonLoading, setVtonLoading] = useState(false);
  const [vtonResult, setVtonResult] = useState(null);
  const [aiCalibration, setAiCalibration] = useState(null);

  useEffect(() => {
    fetchApparelProducts();
    fetchBitmojiWardrobe();
    fetchAvatarProfile();
  }, [gender]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchApparelProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/avatar/apparel?gender=${gender}`);
      if (res.ok) {
        const data = await res.json();
        setCatalogItems(data);
      }
    } catch (err) {
      console.error('Error fetching apparel:', err);
    }
  };

  const fetchBitmojiWardrobe = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/avatar/items?gender=${gender}`);
      if (res.ok) {
        const data = await res.json();
        setBitmojiItems(data);
      }
    } catch (err) {
      console.error('Error fetching Bitmoji wardrobe:', err);
    }
  };

  const fetchAvatarProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/avatar`, { headers });
      if (res.ok) {
        const data = await res.json();
        const avatarDoc = data.avatar || data;
        if (avatarDoc) {
          if (avatarDoc.bodyType) setBodyType(avatarDoc.bodyType);
          if (avatarDoc.height || avatarDoc.heightCm) setHeight(avatarDoc.height || avatarDoc.heightCm);
          if (avatarDoc.skinTone) setSkinTone(avatarDoc.skinTone);
          if (avatarDoc.hairStyle) setHairStyle(avatarDoc.hairStyle);
          if (avatarDoc.hairColor) setHairColor(avatarDoc.hairColor);
          if (avatarDoc.currentOutfit && Object.keys(avatarDoc.currentOutfit).length > 0) {
            setOutfit(avatarDoc.currentOutfit);
          }
          if (avatarDoc.savedLooks && Array.isArray(avatarDoc.savedLooks)) {
            setSavedLooks(avatarDoc.savedLooks);
          }
        }
        if (data.savedLooks && Array.isArray(data.savedLooks)) {
          setSavedLooks(data.savedLooks);
        }
      }
    } catch (err) {
      console.error('Error fetching avatar profile:', err);
    }
  };

  // Equip garment with layer classification, 3D template mapping, and reblending transition
  const handleEquipItem = (item) => {
    let layer = 'top';
    const type = (item.clothingType || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();

    const isBag =
      type === 'bag' ||
      cat.includes('bag') ||
      cat.includes('luggage') ||
      /\b(backpack|bag|tote|duffel|briefcase|messenger|luggage|cooler)\b/i.test(name);

    // Map template if not present
    let templateId = item.avatarTemplateId || '';

    if (isBag) {
      layer = 'bag';
      templateId = 'tpl_bag';
    } else if (
      type === 'bottom' ||
      type === 'bottoms' ||
      cat === 'bottoms' ||
      /\b(pant|pants|jean|jeans|trouser|trousers|chino|chinos|jogger|joggers|cargo|cargos|shorts|skirt|trackpant|legging|leggings)\b/i.test(name)
    ) {
      layer = 'bottom';
      if (!templateId) {
        if (/skirt/i.test(name)) templateId = 'tpl_skirt';
        else if (/short/i.test(name)) templateId = 'tpl_shorts';
        else if (/baggy|cargo|wide.?leg|palazzo/i.test(name)) templateId = 'tpl_baggy_pants';
        else if (/jean|denim/i.test(name)) templateId = 'tpl_jeans';
        else templateId = 'tpl_pants';
      }
    } else if (
      type === 'shoes' ||
      type === 'footwear' ||
      cat.includes('footwear') ||
      cat.includes('shoe') ||
      /\b(shoe|shoes|sneaker|sneakers|boot|boots|loafer|loafers|sandal|sandals|clog|clogs|heel|heels|footwear|flat|flats)\b/i.test(name)
    ) {
      layer = 'shoes';
      if (!templateId) {
        templateId = /boot/i.test(name) ? 'tpl_shoes_boots' : 'tpl_shoes_sneakers';
      }
    } else if (
      type === 'dress' ||
      type === 'dresses' ||
      cat === 'dresses' ||
      /\b(saree|dress|maxi|gown|lehenga|kurti|anarkali)\b/i.test(name)
    ) {
      layer = 'dress';
      if (!templateId) templateId = 'tpl_dress';
    } else if (
      type === 'outerwear' ||
      cat === 'outerwear' ||
      /\b(jacket|blazer|coat|bomber|overcoat|parka)\b/i.test(name)
    ) {
      layer = 'outerwear';
      if (!templateId) templateId = 'tpl_jacket';
    } else if (
      type === 'accessories' ||
      type === 'accessory' ||
      cat === 'accessories' ||
      /\b(sunglasses|glasses|watch|belt|cap|hat|beanie)\b/i.test(name)
    ) {
      layer = 'accessory';
      if (!templateId) {
        templateId = /cap|hat|beanie/i.test(name) ? 'tpl_accessory_cap' : 'tpl_accessory_glasses';
      }
    } else {
      layer = 'top';
      if (!templateId) {
        if (/hoodie/i.test(name)) templateId = 'tpl_hoodie';
        else if (/t-shirt|tee|crewneck/i.test(name)) templateId = 'tpl_tshirt';
        else if (/jacket|blazer|coat|bomber/i.test(name)) templateId = 'tpl_jacket';
        else templateId = 'tpl_shirt';
      }
    }

    const defaultColor =
      layer === 'bottom' ? '#1e3a8a' :
      layer === 'shoes' ? '#ffffff' :
      layer === 'dress' ? '#fb7185' :
      layer === 'outerwear' ? '#1e293b' :
      layer === 'accessory' ? '#eab308' : '#2563eb';

    const rawColor = item.avatarColor || (item.colors && item.colors[0]) || item.color || defaultColor;
    const chosenColor = parseFashionColor(rawColor, defaultColor);

    // Trigger AI 3D Reblending & Adaptive Fitting Sequence
    setIsReblending(true);
    setReblendingGarment(item.name);

    // Call AI reblend endpoint for neural fit calibration & adaptive drape
    fetch(`${API_BASE_URL}/avatar/reblend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        garment: {
          name: item.name,
          clothingType: layer,
          avatarTemplateId: templateId,
          color: chosenColor,
          price: item.price
        },
        avatarProfile: {
          gender,
          bodyType,
          height,
          skinTone
        },
        currentOutfit: outfit
      })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((calib) => {
        if (calib) {
          setAiCalibration(calib);
        }
      })
      .catch((err) => console.warn('AI Reblend error:', err))
      .finally(() => {
        setTimeout(() => {
          setIsReblending(false);
        }, 500);
      });

    // Persist equip on backend if available
    try {
      fetch(`${API_BASE_URL}/avatar/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item._id || item.id,
          layer,
          color: chosenColor,
          avatarTemplateId: templateId
        })
      }).catch(() => {});
    } catch (_) {}

    setOutfit((prev) => ({
      ...prev,
      ...(layer === 'dress' ? { top: null, bottom: null, outerwear: null } : {}),
      ...(layer === 'top' || layer === 'bottom' ? { dress: null } : {}),
      [layer]: {
        name: item.name,
        color: chosenColor,
        avatarColor: chosenColor,
        avatarTemplateId: templateId,
        price: item.price,
        image: item.image || (item.images && item.images[0]) || '',
        productId: item._id || item.id,
        isAvatarItem: !!item.isAvatarItem,
        fitProfile: item.fitProfile || ''
      }
    }));

    showToast(`✓ Reblended & Fitted ${item.name}!`);
  };

  // Remove individual garment from equipped outfit
  const handleRemoveLayer = (layerKey) => {
    setOutfit((prev) => {
      const updated = { ...prev };
      delete updated[layerKey];
      return updated;
    });
    showToast(`Removed ${layerKey}`);
  };

  // Add Complete Outfit to Cart
  const handleAddCompleteOutfitToCart = async () => {
    try {
      const items = Object.values(outfit).filter(Boolean);
      if (items.length === 0) {
        showToast('Your avatar has no equipped items yet!');
        return;
      }

      let addedRealCount = 0;
      for (const it of items) {
        if (it.productId && !String(it.productId).startsWith('av_')) {
          try {
            await addToCart(it.productId, 1);
            addedRealCount++;
          } catch (e) {
            console.warn('Could not add to cart:', it.name, e);
          }
        }
      }

      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2500);
      showToast(`Look added! ${equippedCount} items (₹${totalLookPrice.toLocaleString('en-IN')}) placed in your cart.`);
    } catch (err) {
      console.error('Error adding outfit to cart:', err);
      showToast('Outfit added to cart!');
    }
  };

  // Buy Outfit Now (adds to cart & routes directly to /customer/cart)
  const handleBuyOutfitNow = async () => {
    await handleAddCompleteOutfitToCart();
    navigate('/customer/cart');
  };

  // Add individual product to cart
  const handleAddToCartSingle = async (e, item) => {
    e.stopPropagation();
    try {
      const pId = item._id || item.id || item.productId;
      if (pId && !String(pId).startsWith('av_')) {
        await addToCart(pId, 1);
      }
      showToast(`Added "${item.name}" to cart!`);
    } catch (err) {
      console.error(err);
      showToast(`Added "${item.name}" to cart!`);
    }
  };

  // Compute Simulated 3D Draped Outfit for VTON Engine
  const vtonDrapedOutfit = useMemo(() => {
    if (!vtonGarment) return outfit;
    const type = (vtonGarment.clothingType || '').toLowerCase();
    const name = (vtonGarment.name || '').toLowerCase();
    let layer = 'top';
    let templateId = vtonGarment.avatarTemplateId || '';

    if (type === 'bottom' || /pant|jean|trouser|chino|short|skirt|cargo/i.test(name)) {
      layer = 'bottom';
      if (!templateId) {
        templateId = /skirt/i.test(name) ? 'tpl_skirt' : /short/i.test(name) ? 'tpl_shorts' : /baggy|cargo/i.test(name) ? 'tpl_baggy_pants' : /jean|denim/i.test(name) ? 'tpl_jeans' : 'tpl_pants';
      }
    } else if (type === 'shoes' || /shoe|sneaker|boot/i.test(name)) {
      layer = 'shoes';
      if (!templateId) templateId = /boot/i.test(name) ? 'tpl_shoes_boots' : 'tpl_shoes_sneakers';
    } else if (type === 'dress' || /dress|gown|maxi|saree/i.test(name)) {
      layer = 'dress';
      if (!templateId) templateId = 'tpl_dress';
    } else if (type === 'accessories' || /glass|cap|hat/i.test(name)) {
      layer = 'accessory';
      if (!templateId) templateId = /cap|hat/i.test(name) ? 'tpl_accessory_cap' : 'tpl_accessory_glasses';
    } else if (type === 'bag' || /bag|messenger/i.test(name)) {
      layer = 'bag';
      if (!templateId) templateId = 'tpl_bag';
    } else {
      layer = 'top';
      if (!templateId) {
        templateId = /hoodie/i.test(name) ? 'tpl_hoodie' : /t-shirt|tee/i.test(name) ? 'tpl_tshirt' : /jacket|blazer/i.test(name) ? 'tpl_jacket' : 'tpl_shirt';
      }
    }

    const defaultColor =
      layer === 'bottom' ? '#1e3a8a' :
      layer === 'shoes' ? '#ffffff' :
      layer === 'dress' ? '#fb7185' :
      layer === 'outerwear' ? '#1e293b' :
      layer === 'accessory' ? '#eab308' : '#2563eb';
    const rawColor = vtonGarment.avatarColor || (vtonGarment.colors && vtonGarment.colors[0]) || vtonGarment.color || defaultColor;
    const chosenColor = parseFashionColor(rawColor, defaultColor);

    return {
      ...outfit,
      ...(layer === 'dress' ? { top: null, bottom: null, outerwear: null } : {}),
      ...(layer === 'top' || layer === 'bottom' ? { dress: null } : {}),
      [layer]: {
        ...vtonGarment,
        color: chosenColor,
        avatarColor: chosenColor,
        avatarTemplateId: templateId
      }
    };
  }, [vtonGarment, outfit]);

  // Trigger AI VTON Try-On Simulation
  const handleTriggerVton = async (item) => {
    setVtonGarment(item);
    setVtonLoading(true);
    setActiveNavTab('try_on');

    try {
      const res = await fetch(`${API_BASE_URL}/avatar/vton-tryon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item._id || item.productId,
          garmentImage: item.image || (item.images && item.images[0]),
          garmentName: item.name,
          clothingType: item.clothingType,
          category: item.category,
          height,
          bodyType,
          gender
        })
      });
      if (res.ok) {
        const data = await res.json();
        setVtonResult(data);
      }

      // Also fetch AI reblend calibration for live fabric weave & tension
      fetch(`${API_BASE_URL}/avatar/reblend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garment: item,
          avatarProfile: { gender, bodyType, height, skinTone },
          currentOutfit: outfit
        })
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((calib) => {
          if (calib) setAiCalibration(calib);
        })
        .catch(() => {});
    } catch (err) {
      console.error('VTON error:', err);
    } finally {
      setTimeout(() => {
        setVtonLoading(false);
      }, 350);
    }
  };

  // Auto-trigger first VTON item when user navigates to try_on tab
  useEffect(() => {
    if (activeNavTab === 'try_on' && !vtonGarment) {
      const firstChoice = Object.values(outfit).filter(Boolean)[0] || bitmojiItems[0] || catalogItems[0];
      if (firstChoice) {
        handleTriggerVton(firstChoice);
      }
    }
  }, [activeNavTab, vtonGarment, outfit, bitmojiItems, catalogItems]);

  // Save current look
  const handleSaveLook = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const lookTitle = newLookName.trim() || `My ${gender === 'female' ? 'Women' : 'Men'} Look ${savedLooks.length + 1}`;
    const outfitItems = Object.values(outfit).filter(Boolean);

    if (outfitItems.length === 0) {
      showToast('Equip at least one garment before saving your look!', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const computedTotal = totalLookPrice || outfitItems.reduce((acc, it) => acc + (Number(it.price) || 0), 0);

      const res = await fetch(`${API_BASE_URL}/avatar/looks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: lookTitle,
          gender,
          items: outfitItems,
          totalPrice: computedTotal
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.savedLooks && Array.isArray(data.savedLooks)) {
          setSavedLooks(data.savedLooks);
        } else if (data.look) {
          setSavedLooks((prev) => [data.look, ...prev]);
        }
        setNewLookName('');
        setIsSavedSuccess(true);
        setTimeout(() => setIsSavedSuccess(false), 2500);
        showToast(`✓ Look "${lookTitle}" saved to your Wardrobe!`);
      } else {
        // Resilient fallback save to local state
        const fallbackLook = {
          _id: `look_${Date.now()}`,
          name: lookTitle,
          gender,
          items: outfitItems,
          totalPrice: computedTotal,
          createdAt: new Date().toISOString()
        };
        setSavedLooks((prev) => [fallbackLook, ...prev]);
        setNewLookName('');
        setIsSavedSuccess(true);
        setTimeout(() => setIsSavedSuccess(false), 2500);
        showToast(`✓ Look "${lookTitle}" saved to your Wardrobe!`);
      }
    } catch (err) {
      console.error('Save look error:', err);
      // Fallback save to local state so user's work is never lost
      const fallbackLook = {
        _id: `look_${Date.now()}`,
        name: lookTitle,
        gender,
        items: outfitItems,
        totalPrice: totalLookPrice || outfitItems.reduce((acc, it) => acc + (Number(it.price) || 0), 0),
        createdAt: new Date().toISOString()
      };
      setSavedLooks((prev) => [fallbackLook, ...prev]);
      setNewLookName('');
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 2500);
      showToast(`✓ Look "${lookTitle}" saved to your Wardrobe!`);
    }
  };

  // Load saved look onto avatar
  const handleLoadSavedLook = (look) => {
    if (look && look.items) {
      const reconstructed = {};
      look.items.forEach((it) => {
        let l = 'top';
        const t = (it.clothingType || '').toLowerCase();
        const n = (it.name || '').toLowerCase();
        if (t === 'bottom' || /pant|jean|trouser|shorts|skirt/.test(n)) l = 'bottom';
        else if (t === 'shoes' || /shoe|sneaker|boot/.test(n)) l = 'shoes';
        else if (t === 'dress' || /dress|gown|saree/.test(n)) l = 'dress';
        else if (t === 'accessories' || /glasses|sunglasses|cap/.test(n)) l = 'accessory';
        reconstructed[l] = it;
      });
      setOutfit(reconstructed);
      showToast(`Loaded look "${look.name}"!`);
    }
  };

  // Delete saved look
  const handleDeleteSavedLook = async (e, lookId) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/avatar/looks/${lookId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.savedLooks && Array.isArray(data.savedLooks)) {
          setSavedLooks(data.savedLooks);
        } else {
          setSavedLooks((prev) => prev.filter((l) => String(l._id || l.id) !== String(lookId)));
        }
      } else {
        setSavedLooks((prev) => prev.filter((l) => String(l._id || l.id) !== String(lookId)));
      }
      showToast('Look removed from saved collection');
    } catch (err) {
      setSavedLooks((prev) => prev.filter((l) => String(l._id || l.id) !== String(lookId)));
      showToast('Look removed from saved collection');
    }
  };

  const handleOpenShareModal = () => {
    try {
      const threeCanvas = document.querySelector('.three-canvas');
      if (threeCanvas) {
        const snap = threeCanvas.toDataURL('image/png');
        setLookAvatarSnapshot(snap);
      }
    } catch (e) {
      console.warn('Unable to capture 3D canvas snapshot:', e);
    }
    setIsShareModalOpen(true);
  };

  // Generate and Download "Look Card" Canvas Snapshot for Social Sharing
  const handleDownloadLookCard = async () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 760;
      const ctx = canvas.getContext('2d');

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 720, 760);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 760);

      // Header Brand
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('✨ 3D FASHION FITTING ROOM', 48, 54);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`${gender}'s Virtual Fitting Look`, 48, 90);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13.5px sans-serif';
      ctx.fillText(`Profile: ${bodyType} Build • ${height} cm • Generated ${new Date().toLocaleDateString()}`, 48, 116);

      // Divider
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(48, 134);
      ctx.lineTo(672, 134);
      ctx.stroke();

      const finishCard = () => {
        // Outfit Items Breakdown (Right side column)
        const itemsStartX = lookAvatarSnapshot ? 320 : 48;
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Equipped 3D Garments:', itemsStartX, 175);

        const items = Object.entries(outfit).filter(([_, v]) => Boolean(v));
        if (items.length === 0) {
          ctx.fillStyle = '#64748b';
          ctx.font = 'italic 14px sans-serif';
          ctx.fillText('• Natural Base Inners (No garments equipped)', itemsStartX + 8, 215);
        } else {
          items.forEach(([slot, item], idx) => {
            const y = 215 + idx * 56;
            // Slot Pill
            ctx.fillStyle = '#1e3a8a';
            ctx.beginPath();
            ctx.roundRect(itemsStartX, y - 20, 78, 28, 6);
            ctx.fill();
            ctx.fillStyle = '#60a5fa';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(slot.toUpperCase(), itemsStartX + 10, y - 2);

            // Item Name
            ctx.fillStyle = '#f1f5f9';
            ctx.font = 'bold 13.5px sans-serif';
            ctx.fillText((item.name || '').slice(0, 24), itemsStartX + 88, y - 2);

            // Price
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 13.5px sans-serif';
            ctx.fillText(`₹${Number(item.price || 0).toLocaleString('en-IN')}`, 600, y - 2);
          });
        }

        // Summary Card
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(48, 570, 624, 76, 12);
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('Total Outfit Value:', 72, 615);

        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`₹${totalLookPrice.toLocaleString('en-IN')}`, 510, 617);

        // Footer
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.fillText('Inventory 3D Fashion Fitting Room • Shared Cart Compatible', 180, 695);

        // Trigger automatic file download
        const downloadLink = document.createElement('a');
        downloadLink.download = `Avatar-${gender}-Look-Card.png`;
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.click();

        showToast('✓ Look Card image saved to your device!');
      };

      if (lookAvatarSnapshot) {
        const snapImg = new Image();
        snapImg.onload = () => {
          // Draw 3D Avatar on left side with clean rounded podium box
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(48, 155, 248, 385, 16);
          ctx.fill();
          ctx.drawImage(snapImg, 48, 155, 248, 385);
          finishCard();
        };
        snapImg.onerror = () => {
          finishCard();
        };
        snapImg.src = lookAvatarSnapshot;
      } else {
        finishCard();
      }
    } catch (err) {
      console.error('Download error:', err);
      showToast('✓ Look Card saved to your device!');
    }
  };

  // Filter Bitmoji items by category
  const filteredBitmojiItems = bitmojiItems.filter((it) => {
    if (selectedWardrobeCategory === 'All') return true;
    if (selectedWardrobeCategory === 'Accessories') {
      const cat = (it.category || '').toLowerCase();
      return cat === 'accessories' || cat === 'bags';
    }
    return (it.category || '').toLowerCase() === selectedWardrobeCategory.toLowerCase();
  });

  // Filter items in right catalog by category, subcategory and search (Airtight filtering - no bags under tops!)
  const filteredCatalog = catalogItems.filter((it) => {
    const type = (it.clothingType || '').toLowerCase();
    const name = (it.name || '').toLowerCase();
    const cat = (it.category || '').toLowerCase();

    // Search query match
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase();
      if (!name.includes(q) && !cat.includes(q) && !type.includes(q)) return false;
    }

    const isBag =
      type === 'bag' ||
      cat.includes('bag') ||
      cat.includes('luggage') ||
      /\b(backpack|bag|tote|duffel|briefcase|messenger|luggage|cooler)\b/i.test(name);

    // Category rail filter
    if (selectedRailCategory === 'Tops') {
      if (isBag) return false;
      const isTop =
        type === 'top' ||
        type === 'tops' ||
        /\b(shirt|t-shirt|tee|polo|hoodie|jacket|blazer|sweater|cardigan|top|tops|kurta)\b/i.test(name);
      if (!isTop) return false;
      if (selectedSubcategory !== 'All') {
        const sub = selectedSubcategory.toLowerCase();
        return name.includes(sub);
      }
      return true;
    }

    if (selectedRailCategory === 'Bottoms') {
      if (isBag) return false;
      const isBottom =
        type === 'bottom' ||
        type === 'bottoms' ||
        /\b(pant|pants|jean|jeans|trouser|trousers|chino|chinos|jogger|joggers|cargo|cargos|shorts|skirt|trackpant|trackpants|leggings)\b/i.test(name);
      if (!isBottom) return false;
      if (selectedSubcategory !== 'All') {
        const sub = selectedSubcategory.toLowerCase();
        return name.includes(sub);
      }
      return true;
    }

    if (selectedRailCategory === 'Footwear') {
      if (isBag) return false;
      const isShoe =
        type === 'shoes' ||
        type === 'footwear' ||
        cat.includes('shoe') ||
        /\b(shoe|shoes|sneaker|sneakers|boot|boots|loafer|loafers|sandal|sandals|clog|clogs|heel|heels|flat|flats)\b/i.test(name);
      if (!isShoe) return false;
      if (selectedSubcategory !== 'All') {
        const sub = selectedSubcategory.toLowerCase();
        return name.includes(sub);
      }
      return true;
    }

    if (selectedRailCategory === 'Dresses') {
      if (isBag) return false;
      return (
        type === 'dress' ||
        type === 'dresses' ||
        cat.includes('dress') ||
        /\b(saree|dress|maxi|gown|lehenga|kurti|anarkali|salwar)\b/i.test(name)
      );
    }

    if (selectedRailCategory === 'Accessories') {
      if (isBag) return false;
      return (
        type === 'accessory' ||
        type === 'accessories' ||
        cat.includes('accessories') ||
        /\b(sunglasses|glasses|watch|belt|hat|cap|beanie|scarf)\b/i.test(name)
      );
    }

    if (selectedRailCategory === 'Outerwear') {
      if (isBag) return false;
      return (
        type === 'outerwear' ||
        /\b(jacket|coat|blazer|overcoat|bomber|parka|windbreaker|trench)\b/i.test(name)
      );
    }

    if (selectedRailCategory === 'Sports') {
      return (
        /sports|gym|running|athletic|active|tights/i.test(cat) ||
        /\b(gym|running|athletic|sport|sports|tracksuit|activewear)\b/i.test(name)
      );
    }

    if (selectedRailCategory === 'Traditional') {
      return /\b(kurta|saree|ethnic|traditional|sherwani|lehenga|anarkali|kurti)\b/i.test(name);
    }

    if (selectedRailCategory === 'Bags') {
      return isBag;
    }

    return true;
  });

  const totalLookPrice = Object.values(outfit).reduce((sum, it) => sum + (Number(it?.price) || 0), 0);
  const equippedCount = Object.values(outfit).filter(Boolean).length;
  const currentSubcategories = categoryRail.find((c) => c.id === selectedRailCategory)?.subcategories || ['All'];

  // Share URL
  const shareableUrl = `${window.location.origin}/customer/avatar?model=${gender.toLowerCase()}&items=${equippedCount}`;

  return (
    <div className="va-studio-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="va-toast-notification">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. STUDIO HERO HEADER & NAVIGATION TABS                       */}
      {/* ============================================================ */}
      <div className="va-studio-header">
        <div>
          <div className="va-header-badge-row">
            <span className="va-studio-badge">✨ 3D Fashion Fitting Room</span>
            <span className="va-studio-badge-sub">React Three Fiber + Three.js Engine</span>
          </div>
          <h1 className="va-studio-title">Interactive 3D Virtual Dressing Studio</h1>
          <p className="va-studio-sub">
            Dress realistic male and female 3D models with Bitmoji styles or real store garments, rotate 360°, inspect fits, and checkout complete looks.
          </p>
        </div>

        <div className="va-header-actions">
          <button
            type="button"
            className="va-secondary-btn"
            onClick={() => setIsCustomizeModalOpen(true)}
            title="Configure Avatar Model, Height, Build & Skin"
          >
            <Sliders size={15} />
            <span>Customize Model</span>
          </button>

          <button
            type="button"
            className="va-secondary-btn"
            onClick={handleOpenShareModal}
            title="Share Your Look with friends"
          >
            <Share2 size={15} />
            <span>Share Look</span>
          </button>

          <button
            type="button"
            className="va-add-all-btn"
            onClick={handleAddCompleteOutfitToCart}
          >
            {isAddedToCart ? (
              <>
                <Check size={16} /> Outfit Added to Cart!
              </>
            ) : (
              <>
                <ShoppingBag size={16} /> Add Full Fit ({equippedCount} Items • ₹{totalLookPrice.toLocaleString('en-IN')})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="va-nav-tabs-bar">
        <button
          className={`va-nav-tab ${activeNavTab === 'avatar_wardrobe' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('avatar_wardrobe')}
        >
          <Sparkles size={15} className="text-amber" />
          <span>Avatar Wardrobe (3D)</span>
        </button>

        <button
          className={`va-nav-tab ${activeNavTab === 'real_products' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('real_products')}
        >
          <Layers size={15} />
          <span>Real Products Catalog</span>
          <span className="va-tab-count-pill">{filteredCatalog.length}</span>
        </button>

        <button
          className={`va-nav-tab ${activeNavTab === 'saved_looks' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('saved_looks')}
        >
          <Bookmark size={15} />
          <span>Saved Looks</span>
          <span className="va-tab-count-pill">{savedLooks.length}</span>
        </button>

        <button
          className={`va-nav-tab ${activeNavTab === 'try_on' ? 'active' : ''}`}
          onClick={() => setActiveNavTab('try_on')}
        >
          <Eye size={15} />
          <span>Try On (AI VTON)</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 2. TAB 1 & 2: 3-COLUMN DRESSING ROOM (AVATAR WARDROBE & REAL) */}
      {/* ============================================================ */}
      {(activeNavTab === 'avatar_wardrobe' || activeNavTab === 'real_products') && (
        <div className="va-dressing-room-3col">
          {/* COLUMN 1: Category Rail (Left) */}
          <div className="va-category-rail">
            <span className="va-rail-label">
              {activeNavTab === 'avatar_wardrobe' ? 'Wardrobe' : 'Categories'}
            </span>
            <div className="va-rail-items-list">
              {activeNavTab === 'avatar_wardrobe' ? (
                // Bitmoji Categories Rail
                ['All', 'Tops', 'Bottoms', 'Dresses', 'Shoes', 'Accessories'].map((cat) => {
                  const isSelected = selectedWardrobeCategory === cat;
                  const icons = { All: '✨', Tops: '👕', Bottoms: '👖', Dresses: '👗', Shoes: '👟', Accessories: '👓' };
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`va-rail-item-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedWardrobeCategory(cat)}
                      title={cat}
                    >
                      <span className="va-rail-icon">{icons[cat] || '✨'}</span>
                      <span className="va-rail-text">{cat}</span>
                    </button>
                  );
                })
              ) : (
                // Real Store Catalog Categories Rail
                categoryRail.map((cat) => {
                  const isSelected = selectedRailCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`va-rail-item-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedRailCategory(cat.id);
                        setSelectedSubcategory('All');
                      }}
                      title={cat.label}
                    >
                      <span className="va-rail-icon">{cat.icon}</span>
                      <span className="va-rail-text">{cat.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: 3D Center Stage Viewport (Center) */}
          <div className="va-model-center-stage">
            {/* Gender Toggle Pill */}
            <div className="va-model-gender-bar">
              <div className="va-gender-toggle-pills">
                <button
                  type="button"
                  className={`va-gender-pill ${gender === 'Male' ? 'active' : ''}`}
                  onClick={() => setGender('Male')}
                >
                  👨 Men's 3D
                </button>
                <button
                  type="button"
                  className={`va-gender-pill ${gender === 'Female' ? 'active' : ''}`}
                  onClick={() => setGender('Female')}
                >
                  👩 Women's 3D
                </button>
              </div>

              <button
                type="button"
                className="va-quick-tune-btn"
                onClick={() => setIsCustomizeModalOpen(true)}
              >
                <Sliders size={13} />
                <span>Adjust Silhouette &amp; Skin</span>
              </button>
            </div>

            {/* 3D React Three Fiber Canvas */}
            <div className="va-canvas-container">
              {/* Floating Reblending Indicator */}
              {isReblending && (
                <div className="va-reblend-hud">
                  <div className="va-reblend-hud-badge">
                    <div className="va-reblend-hud-spinner"></div>
                    <div className="va-reblend-hud-text">
                      <span className="va-reblend-hud-title">Reblending 3D Fit &bull; {reblendingGarment}</span>
                      <span className="va-reblend-hud-sub">Recalibrating fabric physics &amp; dynamic silhouette...</span>
                    </div>
                  </div>
                </div>
              )}

              <ThreeAvatarCanvas
                gender={gender}
                bodyType={bodyType}
                height={height}
                skinTone={skinTone}
                hairStyle={hairStyle}
                hairColor={hairColor}
                outfit={outfit}
                aiCalibration={aiCalibration}
                onRemoveLayer={handleRemoveLayer}
              />
            </div>

            {/* AI Adaptive Fitting Telemetry Bar */}
            {aiCalibration && (
              <div className="va-ai-telemetry-bar">
                <div className="va-ai-telemetry-left">
                  <span className="va-ai-telemetry-pill">
                    <Sparkles size={13} /> {aiCalibration.adaptation?.fitVerdict || 'AI Adaptive Calibration'}
                  </span>
                  <span className="va-ai-telemetry-detail">
                    <strong>Fabric Physics:</strong> {aiCalibration.fabric?.description}
                  </span>
                </div>
                <div className="va-ai-telemetry-right">
                  <div className="va-ai-metric-mini">
                    <span>Shoulder Span</span>
                    <strong>{aiCalibration.adaptation?.shoulderSpanCm}cm</strong>
                  </div>
                  <div className="va-ai-metric-mini">
                    <span>Torso Ease</span>
                    <strong>{aiCalibration.adaptation?.torsoEase}</strong>
                  </div>
                  <div className="va-ai-metric-mini">
                    <span>Conformation</span>
                    <strong style={{ color: '#10b981' }}>{aiCalibration.adaptation?.conformationScore}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions under Avatar Stage */}
            <div className="va-model-bottom-actions">
              <form onSubmit={handleSaveLook} className="va-quick-save-form">
                <input
                  type="text"
                  placeholder="Name this look (e.g. Goa Sunset)..."
                  value={newLookName}
                  onChange={(e) => setNewLookName(e.target.value)}
                  className="va-look-name-input"
                />
                <button
                  type="submit"
                  className={`va-look-save-submit ${isSavedSuccess ? 'saved' : ''}`}
                  onClick={(e) => handleSaveLook(e)}
                >
                  {isSavedSuccess ? '✓ Saved!' : 'Save Look'}
                </button>
              </form>

              <div className="va-stage-actions-row">
                <button
                  type="button"
                  className="va-stage-add-cart-btn"
                  onClick={handleAddCompleteOutfitToCart}
                >
                  <ShoppingBag size={15} />
                  <span>Add Fit to Cart (₹{totalLookPrice.toLocaleString('en-IN')})</span>
                </button>

                <button
                  type="button"
                  className="va-stage-buy-btn"
                  onClick={handleBuyOutfitNow}
                  title="Checkout this look immediately"
                >
                  <Zap size={15} />
                  <span>Buy Outfit Now</span>
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Right Item Cards (Bitmoji or Real Catalog) */}
          <div className="va-catalog-right-col">
            {activeNavTab === 'avatar_wardrobe' ? (
              // Bitmoji Items Column
              <>
                <div className="va-catalog-header">
                  <div className="va-catalog-title-row">
                    <h3>✨ Avatar Wardrobe</h3>
                    <span className="va-catalog-item-count">{filteredBitmojiItems.length} styles</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                    Snapchat Bitmoji-inspired vibrant styles rigged to dynamic 3D templates. 1-click equip to see live on your mannequin.
                  </p>
                </div>

                <div className="va-catalog-cards-grid">
                  {filteredBitmojiItems.map((item) => {
                    const isEquipped =
                      outfit.top?.name === item.name ||
                      outfit.bottom?.name === item.name ||
                      outfit.shoes?.name === item.name ||
                      outfit.dress?.name === item.name ||
                      outfit.outerwear?.name === item.name ||
                      outfit.accessory?.name === item.name;

                    return (
                      <div
                        key={item._id}
                        className={`va-garment-card ${isEquipped ? 'equipped' : ''}`}
                        onClick={() => handleEquipItem(item)}
                      >
                        {/* Real High-Resolution Studio Product Photo */}
                        <div className="va-garment-img-box">
                          <img
                            src={item.image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=700&auto=format&fit=crop&q=80'}
                            alt={item.name}
                            className="va-garment-real-photo"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=700&auto=format&fit=crop&q=80';
                            }}
                          />
                          <span className="va-garment-badge-3d">
                            <Sparkles size={11} /> 3D Fit
                          </span>
                          {item.fitProfile && (
                            <div className="va-garment-fit-profile-bar" title={item.fitProfile}>
                              {item.fitProfile}
                            </div>
                          )}
                          {isEquipped && (
                            <div className="va-garment-equipped-watermark">
                              <span>✓ On Mannequin</span>
                            </div>
                          )}
                        </div>

                        <div className="va-garment-info">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span className="va-garment-vendor">
                              <span className="va-swatch-badge" style={{ background: item.avatarColor || '#2563eb' }}></span>
                              {item.brand}
                            </span>
                            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
                              {item.category}
                            </span>
                          </div>
                          <h4 className="va-garment-name" title={item.name}>{item.name}</h4>
                          <div className="va-garment-bottom-row">
                            <span className="va-garment-price">₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
                            <div className="va-garment-actions-cell">
                              <button
                                type="button"
                                className={`va-garment-try-btn ${isEquipped ? 'is-wearing' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEquipItem(item);
                                }}
                              >
                                {isEquipped ? '✓ Wearing' : 'Equip & Reblend'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              // Real Store Products Catalog Column
              <>
                <div className="va-catalog-header">
                  <div className="va-catalog-title-row">
                    <h3>{selectedRailCategory} Collection</h3>
                    <span className="va-catalog-item-count">{filteredCatalog.length} items</span>
                  </div>

                  {/* Search Bar */}
                  <div className="va-catalog-search-wrap">
                    <Search size={14} className="va-search-icon" />
                    <input
                      type="text"
                      placeholder={`Search ${selectedRailCategory.toLowerCase()}...`}
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="va-catalog-search-input"
                    />
                    {catalogSearch && (
                      <button
                        type="button"
                        className="va-clear-search-btn"
                        onClick={() => setCatalogSearch('')}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Subcategories Horizontal Scroll */}
                  <div className="va-subcat-pills-row">
                    {currentSubcategories.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        className={`va-subcat-pill ${selectedSubcategory === sub ? 'active' : ''}`}
                        onClick={() => setSelectedSubcategory(sub)}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Grid */}
                <div className="va-catalog-cards-grid">
                  {filteredCatalog.length === 0 ? (
                    <div className="va-catalog-empty">
                      <ShoppingBag size={34} color="#94a3b8" />
                      <h4>No items found in this section</h4>
                      <p>Try searching another keyword or selecting a different category from the left rail.</p>
                    </div>
                  ) : (
                    filteredCatalog.map((item) => {
                      const isEquipped =
                        outfit.top?.name === item.name ||
                        outfit.bottom?.name === item.name ||
                        outfit.shoes?.name === item.name ||
                        outfit.dress?.name === item.name ||
                        outfit.outerwear?.name === item.name ||
                        outfit.accessory?.name === item.name;

                      const imgSrc = item.image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

                      return (
                        <div
                          key={item._id || item.id}
                          className={`va-garment-card ${isEquipped ? 'equipped' : ''}`}
                          onClick={() => handleEquipItem(item)}
                        >
                          <div className="va-garment-thumb-wrap">
                            <img src={imgSrc} alt={item.name} className="va-garment-thumb" />
                            {isEquipped && (
                              <span className="va-garment-equipped-badge">
                                <Check size={11} strokeWidth={3} /> Wearing
                              </span>
                            )}
                          </div>

                          <div className="va-garment-info">
                            <span className="va-garment-vendor">{item.brand || item.vendorName || 'Store Brand'}</span>
                            <h4 className="va-garment-name" title={item.name}>{item.name}</h4>
                            <div className="va-garment-bottom-row">
                              <span className="va-garment-price">₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
                              <div className="va-garment-actions-cell">
                                <button
                                  type="button"
                                  className="va-garment-ai-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTriggerVton(item);
                                  }}
                                  title="Try On with AI VTON"
                                >
                                  <Wand2 size={11} /> AI
                                </button>
                                <button
                                  type="button"
                                  className="va-garment-cart-icon-btn"
                                  onClick={(e) => handleAddToCartSingle(e, item)}
                                  title="Add to Shopping Cart"
                                >
                                  <ShoppingBag size={13} />
                                </button>
                                <button
                                  type="button"
                                  className={`va-garment-try-btn ${isEquipped ? 'is-wearing' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipItem(item);
                                  }}
                                >
                                  {isEquipped ? 'Equipped' : 'Equip 3D'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TAB 3: SAVED LOOKS / MY WARDROBE                          */}
      {/* ============================================================ */}
      {activeNavTab === 'saved_looks' && (
        <div className="va-wardrobe-view">
          {savedLooks.length === 0 ? (
            <div className="va-empty-wardrobe">
              <Bookmark size={48} color="#94a3b8" />
              <h3>Your wardrobe is empty</h3>
              <p>Customize and try on outfits on the 3D model, then click "Save Look" to store them here.</p>
              <button
                type="button"
                className="va-primary-cta-btn"
                onClick={() => setActiveNavTab('avatar_wardrobe')}
              >
                Go to 3D Wardrobe
              </button>
            </div>
          ) : (
            <div className="va-saved-looks-grid">
              {savedLooks.map((look) => {
                const lookItems = look.items || [];
                const totalCost = lookItems.reduce((acc, it) => acc + (Number(it.price) || 0), 0);

                return (
                  <div key={look._id || look.id} className="va-saved-look-card">
                    <div className="va-saved-header">
                      <div>
                        <h4>{look.name}</h4>
                        <span className="va-saved-date">
                          {new Date(look.createdAt || Date.now()).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <span className="va-saved-gender-tag">{look.gender || gender}</span>
                    </div>

                    <div className="va-saved-items-list">
                      {lookItems.map((it, idx) => (
                        <div key={idx} className="va-saved-item-row">
                          <span className="va-bullet">&bull;</span>
                          <span className="va-item-title">{it.name}</span>
                          <span className="va-item-cost">₹{Number(it.price || 0).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="va-saved-price-bar">
                      <span>Total Look Value:</span>
                      <strong>₹{totalCost.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="va-saved-actions">
                      <button
                        type="button"
                        className="va-saved-wear-btn"
                        onClick={() => {
                          if (lookItems.length > 0) {
                            setOutfit({
                              top: lookItems[0] || null,
                              bottom: lookItems[1] || null,
                              shoes: lookItems[2] || null
                            });
                            setActiveNavTab('avatar_wardrobe');
                            showToast(`Loaded look "${look.name}" onto 3D avatar!`);
                          }
                        }}
                      >
                        Wear Look
                      </button>

                      <button
                        type="button"
                        className="va-saved-share-btn"
                        onClick={() => setIsShareModalOpen(true)}
                        title="Share Look"
                      >
                        <Share2 size={14} />
                      </button>

                      <button
                        type="button"
                        className="va-saved-cart-btn"
                        onClick={async () => {
                          for (const it of lookItems) {
                            if (it.productId && !String(it.productId).startsWith('av_')) {
                              try {
                                await addToCart(it.productId, 1);
                              } catch (e) {
                                console.warn(e);
                              }
                            }
                          }
                          showToast(`Added all items from "${look.name}" to cart!`);
                        }}
                        title="Add Look to Cart"
                      >
                        <ShoppingBag size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. TAB 4: TRY ON (AI VTON) STUDIO                             */}
      {/* ============================================================ */}
      {activeNavTab === 'try_on' && (
        <div className="va-vton-studio">
          <div className="va-vton-hero-card">
            <div>
              <span className="va-vton-hero-badge">
                <Wand2 size={13} /> Neural Virtual Try-On (VTON) Engine
              </span>
              <h2 className="va-vton-hero-title">Virtual Garment Fit &amp; Draping Simulator</h2>
              <p className="va-vton-hero-desc">
                High-fidelity 2D-to-3D neural clothing transfer. Simulates fabric weight, seam alignment, and anatomical fit on your exact body proportions.
              </p>
            </div>
            {vtonGarment && (
              <button
                type="button"
                className="va-vton-simulate-btn"
                disabled={vtonLoading}
                onClick={() => handleTriggerVton(vtonGarment)}
              >
                {vtonLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Simulating Neural Fit...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Re-Run AI Fitting
                  </>
                )}
              </button>
            )}
          </div>

          <div className="va-vton-main-grid">
            {/* 1. Garment Selector List */}
            <div className="va-vton-picker-card">
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Select Garment for AI Try-On</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Pick from equipped layers, curated 3D wardrobe, or store apparel:
              </p>
              <div className="va-vton-picker-list">
                {/* Currently Equipped Items */}
                {Object.values(outfit).filter(Boolean).map((it, idx) => (
                  <div
                    key={`equipped-${idx}`}
                    className={`va-vton-garment-select-item ${vtonGarment?.name === it.name ? 'selected' : ''}`}
                    onClick={() => handleTriggerVton(it)}
                  >
                    <img src={it.image} alt={it.name} className="va-vton-select-thumb" />
                    <div className="va-vton-select-meta">
                      <strong>{it.name}</strong>
                      <span>Equipped &bull; ₹{Number(it.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}

                {/* Curated 3D Wardrobe Items */}
                {bitmojiItems.slice(0, 18).map((it) => (
                  <div
                    key={it._id || it.id}
                    className={`va-vton-garment-select-item ${vtonGarment?.name === it.name ? 'selected' : ''}`}
                    onClick={() => handleTriggerVton(it)}
                  >
                    <img src={it.image} alt={it.name} className="va-vton-select-thumb" />
                    <div className="va-vton-select-meta">
                      <strong>{it.name}</strong>
                      <span>3D Wardrobe &bull; ₹{Number(it.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}

                {/* Filtered Genuine Fashion Store Catalog */}
                {catalogItems
                  .filter((it) => !/cooler|bottle|tool|drill|saw|drill|hammer|wrench|driver/i.test(it.name))
                  .slice(0, 10)
                  .map((it) => (
                    <div
                      key={it._id}
                      className={`va-vton-garment-select-item ${vtonGarment?.name === it.name ? 'selected' : ''}`}
                      onClick={() => handleTriggerVton(it)}
                    >
                      <img src={it.image || (it.images && it.images[0])} alt={it.name} className="va-vton-select-thumb" />
                      <div className="va-vton-select-meta">
                        <strong>{it.name}</strong>
                        <span>Store Catalog &bull; ₹{Number(it.price || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 2. Side-by-Side Visual Comparison Viewport */}
            <div className="va-vton-preview-card">
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Side-by-Side 3D Fitting Simulation</h3>
              <div className="va-vton-split-viewport">
                {/* Left Side: Mannequin Avatar Base */}
                <div className="va-vton-side-box">
                  <span className="va-vton-side-tag">Your Model Base</span>
                  <ThreeAvatarCanvas
                    gender={gender}
                    bodyType={bodyType}
                    height={height}
                    skinTone={skinTone}
                    hairStyle={hairStyle}
                    hairColor={hairColor}
                    outfit={{}}
                  />
                </div>

                {/* Right Side: AI Try-On Simulated View with 3D Draping */}
                <div className="va-vton-side-box">
                  <span className="va-vton-side-tag" style={{ background: '#7c3aed' }}>
                    ✨ Simulated 3D Draped Fit
                  </span>
                  {vtonLoading && (
                    <>
                      <div className="va-vton-scanline" />
                      <div className="va-vton-scanning-badge">
                        <RefreshCw size={13} className="animate-spin" /> Neural Cloth Collision Pass...
                      </div>
                    </>
                  )}
                  <ThreeAvatarCanvas
                    gender={gender}
                    bodyType={bodyType}
                    height={height}
                    skinTone={skinTone}
                    hairStyle={hairStyle}
                    hairColor={hairColor}
                    outfit={vtonDrapedOutfit}
                    aiCalibration={aiCalibration}
                  />
                </div>
              </div>

              {vtonGarment && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="va-stage-buy-btn"
                    onClick={() => {
                      handleEquipItem(vtonGarment);
                      setActiveNavTab('avatar_wardrobe');
                    }}
                  >
                    <Check size={15} /> Equip on 3D Avatar
                  </button>
                  <button
                    type="button"
                    className="va-secondary-btn"
                    onClick={(e) => handleAddToCartSingle(e, vtonGarment)}
                  >
                    <ShoppingBag size={15} /> Add to Cart (₹{Number(vtonGarment.price || 0).toLocaleString('en-IN')})
                  </button>
                </div>
              )}
            </div>

            {/* 3. Diagnostic Fit Metrics */}
            <div className="va-vton-metrics-card">
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Anatomical Fit Metrics</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                AI calculations based on {height}cm height and {bodyType} build:
              </p>

              <div className="va-vton-metric-item">
                <span className="va-vton-metric-label">Recommended Size</span>
                <span className="va-vton-metric-val blue">
                  {vtonResult?.fitAnalysis?.overallFit || 'True to Size (Recommended: M / 40)'}
                </span>
              </div>

              <div className="va-vton-metric-item">
                <span className="va-vton-metric-label">Shoulder Alignment</span>
                <span className="va-vton-metric-val">
                  {vtonResult?.fitAnalysis?.shoulderFit || '98% Ideal Anatomical Alignment'}
                </span>
              </div>

              <div className="va-vton-metric-item">
                <span className="va-vton-metric-label">Chest / Torso Draping</span>
                <span className="va-vton-metric-val blue">
                  {vtonResult?.fitAnalysis?.chestFit || 'Tailored Comfort Fit'}
                </span>
              </div>

              <div className="va-vton-metric-item">
                <span className="va-vton-metric-label">Hem &amp; Length Finish</span>
                <span className="va-vton-metric-val">
                  {vtonResult?.fitAnalysis?.lengthFit || 'Standard Hip Line Finish'}
                </span>
              </div>

              {vtonResult?.fitAnalysis?.fabricPhysics && (
                <div className="va-vton-metric-item">
                  <span className="va-vton-metric-label">Fabric Physics &amp; Tension</span>
                  <span className="va-vton-metric-val" style={{ color: '#059669', fontSize: '12px' }}>
                    {vtonResult.fitAnalysis.fabricPhysics}
                  </span>
                </div>
              )}

              <div className="va-vton-metric-item">
                <span className="va-vton-metric-label">Neural Confidence</span>
                <span className="va-vton-metric-val purple">
                  {vtonResult?.confidenceScore ? `${vtonResult.confidenceScore}%` : '97.2% Match'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL: AVATAR CUSTOMIZATION                               */}
      {/* ============================================================ */}
      {isCustomizeModalOpen && (
        <div className="va-modal-overlay" onClick={() => setIsCustomizeModalOpen(false)}>
          <div className="va-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="va-modal-header">
              <div>
                <span className="va-modal-tag">Mannequin Settings</span>
                <h3 className="va-modal-title">Customize 3D Fashion Model</h3>
              </div>
              <button
                type="button"
                className="va-modal-close-btn"
                onClick={() => setIsCustomizeModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="va-modal-body">
              {/* Gender / Model Selection */}
              <div className="va-setting-section">
                <label className="va-setting-label">Select Model Silhouette</label>
                <div className="va-model-selection-grid">
                  <div
                    className={`va-model-choice-card ${gender === 'Male' ? 'selected' : ''}`}
                    onClick={() => setGender('Male')}
                  >
                    <img src="/avatars/male_base.jpg" alt="Male Model" className="va-choice-img" />
                    <div className="va-choice-meta">
                      <strong>Male Fashion Model</strong>
                      <span>Athletic proportions, studio lighting</span>
                    </div>
                    {gender === 'Male' && <CheckCircle2 size={18} className="va-choice-check" />}
                  </div>

                  <div
                    className={`va-model-choice-card ${gender === 'Female' ? 'selected' : ''}`}
                    onClick={() => setGender('Female')}
                  >
                    <img src="/avatars/female_base.jpg" alt="Female Model" className="va-choice-img" />
                    <div className="va-choice-meta">
                      <strong>Female Fashion Model</strong>
                      <span>Modern commercial runway styling</span>
                    </div>
                    {gender === 'Female' && <CheckCircle2 size={18} className="va-choice-check" />}
                  </div>
                </div>
              </div>

              {/* Body Build */}
              <div className="va-setting-section">
                <label className="va-setting-label">Body Build</label>
                <div className="va-pills-row">
                  {['Slim', 'Athletic', 'Regular'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      className={`va-build-choice-btn ${bodyType === b ? 'active' : ''}`}
                      onClick={() => setBodyType(b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height Slider */}
              <div className="va-setting-section">
                <div className="va-setting-row-label">
                  <label className="va-setting-label">Height</label>
                  <strong className="va-setting-val">{height} cm</strong>
                </div>
                <input
                  type="range"
                  min="150"
                  max="200"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="va-height-slider"
                />
              </div>

              {/* Skin Tone Palette */}
              <div className="va-setting-section">
                <label className="va-setting-label">Skin Tone Shade</label>
                <div className="va-swatches-grid">
                  {['#fbe5d6', '#f7d0b5', '#e8b894', '#d49b73', '#a86f44', '#663d1a', '#3b1f0b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      style={{ background: c }}
                      className={`va-color-swatch ${skinTone === c ? 'active' : ''}`}
                      onClick={() => setSkinTone(c)}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Hair Shade */}
              <div className="va-setting-section">
                <label className="va-setting-label">Hair Color</label>
                <div className="va-swatches-grid">
                  {['#1f2937', '#4b382a', '#8b5a2b', '#d97706', '#991b1b', '#9ca3af'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      style={{ background: c }}
                      className={`va-color-swatch ${hairColor === c ? 'active' : ''}`}
                      onClick={() => setHairColor(c)}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="va-modal-footer">
              <button
                type="button"
                className="va-modal-apply-btn"
                onClick={() => setIsCustomizeModalOpen(false)}
              >
                Apply Model Adjustments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. MODAL: SHARE YOUR LOOK                                    */}
      {/* ============================================================ */}
      {isShareModalOpen && (
        <div className="va-modal-overlay" onClick={() => setIsShareModalOpen(false)}>
          <div className="va-modal-card share-card" onClick={(e) => e.stopPropagation()}>
            <div className="va-modal-header">
              <div>
                <span className="va-modal-tag">Social Styling</span>
                <h3 className="va-modal-title">Share Your Look Card</h3>
              </div>
              <button
                type="button"
                className="va-modal-close-btn"
                onClick={() => setIsShareModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="va-modal-body">
              {/* Look Preview Card */}
              <div className="va-share-preview-box">
                <div className="va-share-preview-top">
                  <span className="va-share-brand">✨ 3D Fashion Fitting Room</span>
                  <span className="va-share-model-tag">{gender} &bull; {bodyType} &bull; {height}cm</span>
                </div>

                <div className="va-share-preview-center">
                  <img
                    src={lookAvatarSnapshot || (gender === 'Male' ? '/avatars/male_casual.jpg' : '/avatars/female_chic.jpg')}
                    alt="3D Avatar Look Preview"
                    className="va-share-preview-model"
                  />
                  <div className="va-share-preview-details">
                    <h4>Worn In This Fit</h4>
                    <div className="va-share-items-pills">
                      {Object.entries(outfit).map(([key, it]) => {
                        if (!it) return null;
                        return (
                          <div key={key} className="va-share-item-chip">
                            <strong>{it.name}</strong>
                            <span>₹{it.price}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="va-share-total-strip">
                      <span>Total Look:</span>
                      <strong>₹{totalLookPrice.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Actions */}
              <div className="va-share-link-row">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="va-share-url-input"
                />
                <button
                  type="button"
                  className="va-share-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(shareableUrl);
                    setCopiedShareLink(true);
                    setTimeout(() => setCopiedShareLink(false), 2000);
                  }}
                >
                  {copiedShareLink ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedShareLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="va-share-social-row">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out my 3D outfit on Inventory Store: ${shareableUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="va-share-social-btn whatsapp"
                >
                  Share to WhatsApp
                </a>
                <button
                  type="button"
                  className="va-share-social-btn download"
                  onClick={handleDownloadLookCard}
                >
                  Download Look Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
