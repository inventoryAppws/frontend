import React, { useState } from 'react';
import {
  Sparkles,
  Eye,
  RotateCw,
  ZoomIn,
  ZoomOut,
  X,
  Layers,
  Check
} from 'lucide-react';

/**
 * Ultra-Realistic 3D Showroom Fashion Avatar
 * Real-time garment compositing engine matching modern e-commerce try-on experiences.
 * Features:
 * - Dynamic mannequin/model base switching
 * - Dynamic visual compositing for Footwear (shoes on feet with contact shadows)
 * - Dynamic visual compositing for Bags (backpacks/handbags with strap simulation & depth shadows)
 * - Dynamic visual compositing for Accessories (eyewear, watches)
 * - Interactive garment pins with thumbnail, price & instant 1-click unequip [×]
 * - Studio showroom lighting presets (Studio White, Runway Warm, Cyber Dark)
 * - Height & body build proportional scaling
 */
export default function AvatarCanvas({
  gender = 'Male',
  bodyType = 'Athletic',
  height = 178,
  skinTone = '#f7d0b5',
  hairStyle = 'Short Crop',
  hairColor = '#1f2937',
  outfit = {},
  onSaveLook,
  onAddToCart,
  onRemoveLayer
}) {
  const [lightingPreset, setLightingPreset] = useState('studio'); // 'studio', 'runway', 'cyber'
  const [viewAngle, setViewAngle] = useState('full'); // 'full', 'close'
  const [showItemTags, setShowItemTags] = useState(true);

  const isMale = gender?.toLowerCase() === 'male' || gender?.toLowerCase() === 'men';

  // Extract equipped items
  const topItem = outfit?.top;
  const bottomItem = outfit?.bottom;
  const footwearItem = outfit?.footwear || outfit?.shoes;
  const dressItem = outfit?.dress;
  const accessoryItem = outfit?.accessory;
  const bagItem = outfit?.bag;

  // Determine base photorealistic model image based on equipped garments
  const getModelImage = () => {
    const topName = (topItem?.name || '').toLowerCase();
    const dressName = (dressItem?.name || '').toLowerCase();

    if (isMale) {
      if (topName.includes('hoodie') || topName.includes('sweatshirt')) {
        return '/avatars/male_hoodie.jpg';
      }
      if (topName.includes('blazer') || topName.includes('suit') || topName.includes('coat')) {
        return '/avatars/male_suit.jpg';
      }
      if (topItem || bottomItem) {
        return '/avatars/male_casual.jpg';
      }
      // If only shoes or bags or nothing equipped, show male_base cleanly
      return '/avatars/male_base.jpg';
    } else {
      // Female
      if (dressItem || dressName.includes('dress') || dressName.includes('saree') || topName.includes('dress') || topName.includes('saree')) {
        return '/avatars/female_dress.jpg';
      }
      if (topName.includes('blazer') || topName.includes('suit') || topName.includes('pant') || (topItem && bottomItem)) {
        return '/avatars/female_chic.jpg';
      }
      if (topItem || bottomItem) {
        return '/avatars/female_dress.jpg';
      }
      // If only shoes or bags or nothing equipped, show female_base cleanly
      return '/avatars/female_base.jpg';
    }
  };

  const modelImageSrc = getModelImage();

  // Dynamic body scaling factors
  const heightFactor = Math.max(0.88, Math.min(1.15, (Number(height) || 178) / 175));
  const buildScaleX = bodyType === 'Slim' ? 0.95 : bodyType === 'Athletic' ? 1.05 : 1.0;
  const buildScaleY = heightFactor;

  // Total look price
  const totalCost =
    (topItem?.price || 0) +
    (bottomItem?.price || 0) +
    (footwearItem?.price || 0) +
    (dressItem?.price || 0) +
    (accessoryItem?.price || 0) +
    (bagItem?.price || 0);

  const equippedItemsList = [
    { key: 'top', item: topItem, icon: '👕', label: 'Top' },
    { key: 'bottom', item: bottomItem, icon: '👖', label: 'Bottom' },
    { key: 'dress', item: dressItem, icon: '👗', label: 'Dress' },
    { key: 'footwear', item: footwearItem, icon: '👟', label: 'Shoes' },
    { key: 'bag', item: bagItem, icon: '🎒', label: 'Bag' },
    { key: 'accessory', item: accessoryItem, icon: '👓', label: 'Accessory' }
  ].filter((entry) => Boolean(entry.item));

  return (
    <div className="avatar-3d-stage-wrapper" style={{ width: '100%', position: 'relative', margin: '0 auto' }}>
      {/* Lighting & Camera Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'studio', label: 'Studio White', icon: '💡' },
            { id: 'runway', label: 'Runway Warm', icon: '✨' },
            { id: 'cyber', label: 'Cyber Dark', icon: '⚡' }
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setLightingPreset(preset.id)}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: lightingPreset === preset.id ? '#2563eb' : '#cbd5e1',
                background: lightingPreset === preset.id ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                color: lightingPreset === preset.id ? '#2563eb' : '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {preset.icon} {preset.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setViewAngle(viewAngle === 'full' ? 'close' : 'full')}
            title="Toggle Camera Zoom"
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '4px 9px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {viewAngle === 'full' ? <ZoomIn size={12} /> : <ZoomOut size={12} />}
            <span>{viewAngle === 'full' ? 'Zoom In' : 'Full View'}</span>
          </button>
        </div>
      </div>

      {/* 3D Visual Stage Viewport */}
      <div
        className="avatar-viewport-frame"
        style={{
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          background:
            lightingPreset === 'cyber'
              ? 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #09090b 80%)'
              : lightingPreset === 'runway'
              ? 'radial-gradient(circle at 50% 30%, #fffbeb 0%, #fef3c7 40%, #f1f5f9 100%)'
              : 'radial-gradient(circle at 50% 30%, #ffffff 0%, #f8fafc 55%, #e2e8f0 100%)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
          border: '1px solid var(--border-color, #e2e8f0)',
          minHeight: '520px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.3s ease'
        }}
      >
        {/* Showroom Floor Pedestal Shadow */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            width: '280px',
            height: '32px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(15, 23, 42, 0.22) 0%, rgba(15, 23, 42, 0.05) 50%, transparent 80%)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        />

        {/* Scaled Mannequin Model Wrapper */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transform: `scale(${viewAngle === 'close' ? 1.45 : 1}) scaleX(${buildScaleX}) scaleY(${buildScaleY}) translateY(${viewAngle === 'close' ? '12%' : '0'})`,
            transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Base Mannequin Image */}
          <img
            src={modelImageSrc}
            alt={`${gender} 3D Fashion Avatar`}
            style={{
              width: '100%',
              maxWidth: '380px',
              height: 'auto',
              maxHeight: '520px',
              objectFit: 'contain',
              display: 'block',
              filter:
                lightingPreset === 'cyber'
                  ? 'contrast(1.08) brightness(0.95)'
                  : lightingPreset === 'runway'
                  ? 'sepia(0.08) contrast(1.02)'
                  : 'none'
            }}
          />

          {/* ======================================================= */}
          {/* DYNAMIC COMPOSITE LAYER 1: FOOTWEAR OVERLAY ON FEET     */}
          {/* ======================================================= */}
          {footwearItem && footwearItem.image && (
            <div
              className="avatar-composite-footwear"
              style={{
                position: 'absolute',
                bottom: '14px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 15,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Contact Shadow for Footwear */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    width: '110%',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(0,0,0,0.45) 0%, transparent 70%)'
                  }}
                />
                <img
                  src={footwearItem.image}
                  alt={footwearItem.name}
                  style={{
                    maxHeight: '74px',
                    maxWidth: '150px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.35))',
                    transform: 'perspective(500px) rotateX(8deg)'
                  }}
                />
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* DYNAMIC COMPOSITE LAYER 2: BAG OVERLAY ON SHOULDER/ARM  */}
          {/* ======================================================= */}
          {bagItem && bagItem.image && (
            <div
              className="avatar-composite-bag"
              style={{
                position: 'absolute',
                top: isMale ? '36%' : '38%',
                right: '16%',
                zIndex: 16,
                pointerEvents: 'none'
              }}
            >
              {/* Strap connecting to avatar shoulder */}
              <div
                style={{
                  position: 'absolute',
                  top: '-32px',
                  left: '18px',
                  width: '3.5px',
                  height: '42px',
                  background: 'linear-gradient(to bottom, rgba(30, 41, 59, 0.85), rgba(71, 85, 105, 0.7))',
                  borderRadius: '3px',
                  transform: 'rotate(-24deg)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
              <img
                src={bagItem.image}
                alt={bagItem.name}
                style={{
                  maxWidth: '115px',
                  maxHeight: '120px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.4))',
                  transform: 'rotate(-6deg)'
                }}
              />
            </div>
          )}

          {/* ======================================================= */}
          {/* DYNAMIC COMPOSITE LAYER 3: ACCESSORIES (EYEWEAR/WATCH)  */}
          {/* ======================================================= */}
          {accessoryItem && accessoryItem.image && (
            <div
              className="avatar-composite-accessory"
              style={{
                position: 'absolute',
                top: (accessoryItem.name || '').toLowerCase().includes('watch') ? '54%' : '14%',
                left: (accessoryItem.name || '').toLowerCase().includes('watch') ? '22%' : '50%',
                transform: (accessoryItem.name || '').toLowerCase().includes('watch') ? 'none' : 'translateX(-50%)',
                zIndex: 17,
                pointerEvents: 'none'
              }}
            >
              <img
                src={accessoryItem.image}
                alt={accessoryItem.name}
                style={{
                  maxWidth: (accessoryItem.name || '').toLowerCase().includes('watch') ? '50px' : '75px',
                  maxHeight: '40px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }}
              />
            </div>
          )}
        </div>

        {/* ======================================================= */}
        {/* INTERACTIVE GARMENT HOTSPOT BADGES (CLICKABLE & UNEQUIP) */}
        {/* ======================================================= */}
        {showItemTags && viewAngle === 'full' && (
          <>
            {/* Top Item Badge */}
            {topItem && (
              <div
                style={{
                  position: 'absolute',
                  top: '26%',
                  left: '8%',
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #bfdbfe',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0f172a',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 25
                }}
              >
                <span>👕</span>
                <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {topItem.name}
                </span>
                <span style={{ color: '#2563eb' }}>₹{topItem.price}</span>
                {onRemoveLayer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLayer('top');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
                    title="Remove item"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Bottom Item Badge */}
            {bottomItem && (
              <div
                style={{
                  position: 'absolute',
                  top: '55%',
                  left: '8%',
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #bfdbfe',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0f172a',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 25
                }}
              >
                <span>👖</span>
                <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bottomItem.name}
                </span>
                <span style={{ color: '#2563eb' }}>₹{bottomItem.price}</span>
                {onRemoveLayer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLayer('bottom');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
                    title="Remove item"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Dress Item Badge */}
            {dressItem && (
              <div
                style={{
                  position: 'absolute',
                  top: '38%',
                  left: '8%',
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #fbcfe8',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0f172a',
                  boxShadow: '0 4px 14px rgba(219, 39, 119, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 25
                }}
              >
                <span>👗</span>
                <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dressItem.name}
                </span>
                <span style={{ color: '#db2777' }}>₹{dressItem.price}</span>
                {onRemoveLayer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLayer('dress');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
                    title="Remove item"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Bag Item Badge */}
            {bagItem && (
              <div
                style={{
                  position: 'absolute',
                  top: '36%',
                  right: '8%',
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #fed7aa',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0f172a',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 25
                }}
              >
                <span>🎒</span>
                <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bagItem.name}
                </span>
                <span style={{ color: '#ea580c' }}>₹{bagItem.price}</span>
                {onRemoveLayer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLayer('bag');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
                    title="Remove item"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Footwear Item Badge */}
            {footwearItem && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '70px',
                  right: '8%',
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #bbf7d0',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0f172a',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 25
                }}
              >
                <span>👟</span>
                <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {footwearItem.name}
                </span>
                <span style={{ color: '#16a34a' }}>₹{footwearItem.price}</span>
                {onRemoveLayer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLayer('footwear');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
                    title="Remove item"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Accessory Item Badge */}
            {accessoryItem && (
              <div
                style={{
                  position: 'absolute',
                  top: '16%',
                  right: '8%',
                  background: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #e9d5ff',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0f172a',
                  boxShadow: '0 4px 14px rgba(147, 51, 234, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 25
                }}
              >
                <span>👓</span>
                <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {accessoryItem.name}
                </span>
                <span style={{ color: '#7c3aed' }}>₹{accessoryItem.price}</span>
                {onRemoveLayer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveLayer('accessory');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
                    title="Remove item"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Bottom Control Pills (↺, 👁️, Model Info, Total) */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '4px 12px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            zIndex: 30
          }}
        >
          <button
            type="button"
            title="Reset Pose & Zoom"
            onClick={() => setViewAngle('full')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#475569' }}
          >
            <RotateCw size={14} />
          </button>
          <button
            type="button"
            title="Toggle Garment Hotspots"
            onClick={() => setShowItemTags(!showItemTags)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: showItemTags ? '#2563eb' : '#94a3b8' }}
          >
            <Eye size={14} />
          </button>
          <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }}></div>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>
            {gender} • {bodyType} • {height}cm
          </span>
          {totalCost > 0 && (
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#2563eb', marginLeft: '4px' }}>
              ₹{totalCost.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      {/* Equipped Garments Quick-Access Strip */}
      {equippedItemsList.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '10px',
            flexWrap: 'wrap',
            padding: '6px 12px',
            background: 'var(--bg-card, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginRight: '4px' }}>
            Equipped ({equippedItemsList.length}):
          </span>
          {equippedItemsList.map(({ key, item, icon }) => (
            <div
              key={key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '16px',
                padding: '2px 8px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#1e293b'
              }}
            >
              <span>{icon}</span>
              <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </span>
              {onRemoveLayer && (
                <button
                  type="button"
                  onClick={() => onRemoveLayer(key)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={`Unequip ${item.name}`}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
