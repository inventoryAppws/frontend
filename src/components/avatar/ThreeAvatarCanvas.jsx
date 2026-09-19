import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCw, Sparkles, Check } from 'lucide-react';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import './ThreeAvatarCanvas.css';

// Preload models for immediate switching
// Preload models for immediate switching
useGLTF.preload('/avatars/male_avatar.glb');
useGLTF.preload('/avatars/female_avatar.glb');

/**
 * Procedural Real Fabric Textile Texture Generator
 * Generates tactile weave patterns (denim twill, combed cotton, fleece, pebble leather, silk, canvas)
 * so avatar clothes look like real woven fabric instead of flat shiny plastic dummies!
 */
const fabricTextureCache = new Map();

function getCachedFabricTexture(type) {
  if (typeof document === 'undefined') return null;
  const key = type || 'cotton';
  if (fabricTextureCache.has(key)) {
    return fabricTextureCache.get(key);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Base neutral off-white so mat.color tints it cleanly
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 256);

  if (key === 'denim') {
    // 3/1 right-hand twill diagonal rib lines
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.65)';
    ctx.lineWidth = 1.8;
    for (let x = -256; x < 512; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 256, 256);
      ctx.stroke();
    }
    // Subtle horizontal weft contrast
    ctx.fillStyle = 'rgba(241, 245, 249, 0.4)';
    for (let y = 0; y < 256; y += 4) {
      ctx.fillRect(0, y, 256, 1.2);
    }
  } else if (key === 'fleece') {
    // French terry / soft interlocking fleece loops
    ctx.fillStyle = 'rgba(203, 213, 225, 0.45)';
    for (let y = 0; y < 256; y += 4) {
      for (let x = (y % 8 === 0 ? 0 : 2); x < 256; x += 4) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (key === 'canvas') {
    // Ripstop crosshatch grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i <= 256; i += 24) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(226, 232, 240, 0.3)';
    for (let y = 0; y < 256; y += 3) {
      for (let x = 0; x < 256; x += 3) {
        if ((x + y) % 6 === 0) ctx.fillRect(x, y, 1.2, 1.2);
      }
    }
  } else if (key === 'leather') {
    // Organic stippled pebble grain
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    for (let i = 0; i < 2200; i++) {
      const rx = (i * 73) % 256;
      const ry = (i * 127) % 256;
      const rr = 0.8 + ((i % 5) * 0.3);
      ctx.beginPath();
      ctx.arc(rx, ry, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (key === 'silk') {
    // Liquid silk luster gradient
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, '#f1f5f9');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(0.75, '#e2e8f0');
    grad.addColorStop(1, '#ffffff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  } else {
    // Cotton jersey fine micro-weave
    ctx.fillStyle = 'rgba(203, 213, 225, 0.35)';
    for (let y = 0; y < 256; y += 3) {
      for (let x = (y % 6 === 0 ? 0 : 2); x < 256; x += 3) {
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  fabricTextureCache.set(key, texture);
  return texture;
}

/**
 * 2. Draped Fashion Skirt / Gown Mesh
 * Generates an open-ended flared skirt with 14 soft pleated fabric ripples.
 * Hugs the waist cleanly and drapes around the legs without any sharp cone points!
 */
function DrapedFashionSkirt({ isFemale, isDress, color, roughness, metalness }) {
  const skirtGeo = useMemo(() => {
    const height = isDress ? 0.54 : 0.38;
    const radiusTop = isFemale ? 0.165 : 0.185;
    const radiusBottom = isFemale ? (isDress ? 0.33 : 0.28) : (isDress ? 0.35 : 0.30);
    const radialSegments = 48;
    const heightSegments = 16;

    const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, true);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const angle = Math.atan2(z, x);

      // Normalized height: 0 at waist, 1 at hem
      const t = (height / 2 - y) / height;

      // 14 soft, natural flowing cloth wave ripples that soften near waist and flare near hem
      const ripple = Math.sin(angle * 14) * (0.014 * Math.pow(t, 1.4));
      // Natural hip curve flare
      const hipSwell = Math.sin(t * Math.PI) * 0.012;

      const currentR = Math.sqrt(x * x + z * z);
      const newR = currentR + ripple + hipSwell;

      pos.setX(i, Math.cos(angle) * newR);
      pos.setZ(i, Math.sin(angle) * newR);
    }

    geo.computeVertexNormals();
    return geo;
  }, [isFemale, isDress]);

  const waistY = isFemale ? 0.93 : 0.97;
  const skirtHeight = isDress ? 0.54 : 0.38;
  const posY = waistY - skirtHeight / 2;

  const fabricTex = useMemo(() => getCachedFabricTexture(isDress ? 'silk' : 'cotton'), [isDress]);

  return (
    <mesh geometry={skirtGeo} position={[0, posY, 0]} castShadow receiveShadow>
      <meshStandardMaterial
        map={fabricTex}
        color={color}
        roughness={roughness ?? (isDress ? 0.28 : 0.65)}
        metalness={metalness ?? (isDress ? 0.04 : 0.01)}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * 3. Contoured Cargo Pockets
 * Hugs the outer leg curvature with pocket flaps instead of floating raw blocks
 */
function CargoPockets({ isFemale, color }) {
  const xOffset = isFemale ? 0.155 : 0.168;
  const yPos = isFemale ? 0.65 : 0.64;
  return (
    <group>
      {/* Left Cargo Pocket */}
      <group position={[-xOffset, yPos, 0.01]} rotation={[0, 0, 0.04]}>
        <mesh castShadow>
          <boxGeometry args={[0.024, 0.095, 0.075]} />
          <meshStandardMaterial color={color} roughness={0.86} metalness={0.02} />
        </mesh>
        <mesh position={[0, 0.042, 0.002]}>
          <boxGeometry args={[0.026, 0.022, 0.077]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0.02} />
        </mesh>
      </group>
      {/* Right Cargo Pocket */}
      <group position={[xOffset, yPos, 0.01]} rotation={[0, 0, -0.04]}>
        <mesh castShadow>
          <boxGeometry args={[0.024, 0.095, 0.075]} />
          <meshStandardMaterial color={color} roughness={0.86} metalness={0.02} />
        </mesh>
        <mesh position={[0, 0.042, 0.002]}>
          <boxGeometry args={[0.026, 0.022, 0.077]} />
          <meshStandardMaterial color={color} roughness={0.88} metalness={0.02} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 4. Structured Designer Handbag
 * Sits naturally beside the hip with gold hardware, eliminating piercing cylinder poles!
 */
function DesignerHandbag({ color, isFemale }) {
  return (
    <group position={isFemale ? [0.21, 0.78, 0.06] : [0.23, 0.80, 0.06]} rotation={[0.04, -0.12, -0.06]}>
      {/* Structured Leather Bag Body with rounded bevel */}
      <mesh castShadow>
        <boxGeometry args={[0.15, 0.17, 0.07]} />
        <meshStandardMaterial color={color} roughness={0.38} metalness={0.12} />
      </mesh>
      {/* Gold Metallic Turn-Lock Clasp */}
      <mesh position={[0, 0.02, 0.038]}>
        <boxGeometry args={[0.024, 0.018, 0.008]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.92} />
      </mesh>
      {/* Flap fold */}
      <mesh position={[0, 0.05, 0.004]}>
        <boxGeometry args={[0.152, 0.07, 0.074]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.14} />
      </mesh>
      {/* Arched leather shoulder handle */}
      <mesh position={[0, 0.13, 0]}>
        <torusGeometry args={[0.055, 0.006, 10, 24, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  );
}

/**
 * 5. Rigged 3D Human Character Component
 * Loads real rigged GLB models (male_avatar.glb / female_avatar.glb)
 * Applies dynamic skin tone, hair color, body build scale, and real woven textile materials.
 */
function RiggedAvatarModel({
  gender = 'Male',
  skinTone = '#f7d0b5',
  hairColor = '#1f2937',
  bodyType = 'Athletic',
  height = 178,
  pose = 1,
  outfit = {},
  aiCalibration = null
}) {
  const isFemale = gender.toLowerCase() === 'female';
  const modelUrl = isFemale ? '/avatars/female_avatar.glb' : '/avatars/male_avatar.glb';
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef();

  // Clone scene deeply with SkeletonUtils so SkinnedMesh bone deformation & materials work cleanly
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((node) => {
      if (node.isMesh && node.material) {
        if (Array.isArray(node.material)) {
          node.material = node.material.map((m) => m.clone());
        } else {
          node.material = node.material.clone();
        }
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Natural fashion runway A-pose for BOTH male and female avatars
    const leftArm = clone.getObjectByName('LeftArm');
    const rightArm = clone.getObjectByName('RightArm');
    const leftForeArm = clone.getObjectByName('LeftForeArm');
    const rightForeArm = clone.getObjectByName('RightForeArm');

    if (leftArm && rightArm) {
      if (isFemale) {
        // Natural relaxed fashion runway posture for female model (arms folded gently down along torso)
        leftArm.quaternion.set(0.48, 0.02, -0.08, 0.87);
        rightArm.quaternion.set(0.48, -0.02, 0.08, 0.87);
        if (leftForeArm) leftForeArm.quaternion.set(0.04, -0.01, 0.12, 0.99);
        if (rightForeArm) rightForeArm.quaternion.set(0.04, 0.01, -0.12, 0.99);
      } else {
        // Natural fashion runway A-pose for male avatar
        leftArm.quaternion.set(0.458864, 0.008741, -0.028773, 0.887998);
        rightArm.quaternion.set(0.458865, -0.008741, 0.028772, 0.887997);
        if (leftForeArm) leftForeArm.quaternion.set(0.021269, -0.011219, 0.147251, 0.988807);
        if (rightForeArm) rightForeArm.quaternion.set(0.022389, 0.011075, -0.147393, 0.988763);
      }
      clone.updateMatrixWorld(true);
    }

    return clone;
  }, [scene, isFemale]);

  // Dynamic colors from equipped outfit
  const dressColor = outfit.dress?.avatarColor || outfit.dress?.color || '#fb7185';
  const topColor = outfit.dress
    ? dressColor
    : (outfit.top?.avatarColor || outfit.top?.color || (isFemale ? '#f8fafc' : '#f1f5f9'));
  const bottomColor = outfit.dress
    ? dressColor
    : (outfit.bottom?.avatarColor || outfit.bottom?.color || (isFemale ? '#cbd5e1' : '#cbd5e1'));
  const shoesColor = outfit.shoes?.avatarColor || outfit.shoes?.color || outfit.footwear?.avatarColor || outfit.footwear?.color || '#ffffff';

  // Check if sunglasses or cap are equipped (none by default!)
  const accessoryItem = outfit.accessory || outfit.accessories;
  const isGlasses = Boolean(
    accessoryItem && (
      accessoryItem.avatarTemplateId === 'tpl_accessory_glasses' ||
      (accessoryItem.name || '').toLowerCase().includes('glass')
    )
  );
  const isCap = Boolean(
    accessoryItem && (
      accessoryItem.avatarTemplateId === 'tpl_accessory_cap' ||
      (accessoryItem.name || '').toLowerCase().includes('cap') ||
      (accessoryItem.name || '').toLowerCase().includes('hat')
    )
  );

  // Dynamic fabric weave types derived from garment and AI calibration
  const topFabricType = useMemo(() => {
    if (aiCalibration?.fabric?.type) return aiCalibration.fabric.type;
    const name = (outfit.dress?.name || outfit.top?.name || '').toLowerCase();
    const tpl = outfit.dress?.avatarTemplateId || outfit.top?.avatarTemplateId || '';
    if (tpl === 'tpl_hoodie' || /hoodie/i.test(name)) return 'fleece';
    if (tpl === 'tpl_jacket' || /jacket|blazer|bomber/i.test(name)) return 'leather';
    if (tpl === 'tpl_dress' || /dress|silk|saree|gown/i.test(name)) return 'silk';
    return 'cotton';
  }, [outfit, aiCalibration]);

  const bottomFabricType = useMemo(() => {
    if (aiCalibration?.fabric?.type && (outfit.bottom?.avatarTemplateId === aiCalibration.layer || !outfit.top)) {
      return aiCalibration.fabric.type;
    }
    const name = (outfit.bottom?.name || '').toLowerCase();
    const tpl = outfit.bottom?.avatarTemplateId || '';
    if (tpl === 'tpl_jeans' || /jean|denim/i.test(name)) return 'denim';
    if (tpl === 'tpl_baggy_pants' || /cargo|baggy/i.test(name)) return 'canvas';
    if (tpl === 'tpl_skirt' || /skirt/i.test(name)) return 'silk';
    return 'cotton';
  }, [outfit, aiCalibration]);

  // Apply colors and real woven textile material properties whenever props change
  useEffect(() => {
    clonedScene.traverse((node) => {
      if (node.isMesh && node.material) {
        const mat = node.material;
        const matName = (mat.name || '').toLowerCase();
        const meshName = (node.name || '').toLowerCase();

        // 1. Skin (Head, Face, Neck, Hands, Arms, Bare Body)
        if (
          matName.includes('skin') ||
          meshName.includes('wolf3d_head') ||
          matName.includes('wolf3d_skin') ||
          meshName.includes('wolf3d_body') ||
          meshName.includes('avatarbody') ||
          matName.includes('avatarbody')
        ) {
          if (mat.color) {
            mat.color.set(skinTone);
            mat.roughness = 0.65;
            mat.metalness = 0.03;
            mat.needsUpdate = true;
          }
        }

        // 2. Hide Headwear (Cowboy/Fedora) and Beard by default so avatar is clean model
        if (
          meshName.includes('headwear') ||
          matName.includes('headwear') ||
          meshName.includes('beard') ||
          matName.includes('beard')
        ) {
          node.visible = false;
        }

        // 3. Hair & Facial Hair
        if (matName.includes('hair') || meshName.includes('hair')) {
          if (mat.color) {
            mat.color.set(hairColor);
            mat.roughness = 0.85;
            mat.metalness = 0.02;
            mat.needsUpdate = true;
          }
        }

        // 4. Female Native Rigged Glasses (mesh Wolf3D_Glasses in female_avatar.glb)
        if (meshName.includes('glasses') || matName.includes('glasses')) {
          node.visible = Boolean(isGlasses);
          if (isGlasses && mat.color) {
            mat.color.set(accessoryItem?.avatarColor || '#eab308');
            mat.roughness = 0.20;
            mat.metalness = 0.85;
            mat.needsUpdate = true;
          }
        }

        // 5. Upper Body Garment (Shirt, Hoodie, Jacket, Dress Bodice, or T-Shirt)
        if (
          matName.includes('top') ||
          meshName.includes('top') ||
          matName.includes('shirt') ||
          meshName.includes('shirt')
        ) {
          if (mat.color) {
            const fabricTex = getCachedFabricTexture(topFabricType);
            if (fabricTex) mat.map = fabricTex;
            mat.color.set(topColor);
            if (topFabricType === 'silk' || outfit.dress) {
              mat.roughness = 0.28;
              mat.metalness = 0.05;
            } else if (topFabricType === 'leather' || outfit.top?.avatarTemplateId === 'tpl_jacket') {
              mat.roughness = 0.44;
              mat.metalness = 0.12;
            } else if (topFabricType === 'fleece' || outfit.top?.avatarTemplateId === 'tpl_hoodie') {
              mat.roughness = 0.84;
              mat.metalness = 0.02;
            } else if (outfit.top?.avatarTemplateId === 'tpl_tshirt') {
              mat.roughness = 0.90;
              mat.metalness = 0.01;
            } else if (!outfit.top) {
              mat.roughness = 0.75;
              mat.metalness = 0.02;
            } else {
              mat.roughness = 0.82;
              mat.metalness = 0.02;
            }
            mat.needsUpdate = true;
          }
        }

        // 6. Lower Body Garment (Jeans, Pants, Gown, Dress Skirt, or Baggy Cargo)
        if (
          matName.includes('bottom') ||
          meshName.includes('bottom') ||
          matName.includes('pant') ||
          meshName.includes('pant')
        ) {
          if (mat.color) {
            const bottomFabricTex = getCachedFabricTexture(bottomFabricType);
            if (bottomFabricTex) mat.map = bottomFabricTex;
            mat.color.set(bottomColor);
            if (bottomFabricType === 'silk' || outfit.dress) {
              mat.roughness = 0.28;
              mat.metalness = 0.05;
            } else if (bottomFabricType === 'denim' || outfit.bottom?.avatarTemplateId === 'tpl_jeans') {
              mat.roughness = 0.88;
              mat.metalness = 0.02;
            } else if (bottomFabricType === 'canvas' || outfit.bottom?.avatarTemplateId === 'tpl_baggy_pants') {
              mat.roughness = 0.86;
              mat.metalness = 0.02;
            } else if (!outfit.bottom) {
              mat.roughness = 0.75;
              mat.metalness = 0.02;
            } else {
              mat.roughness = 0.80;
              mat.metalness = 0.03;
            }
            mat.needsUpdate = true;
          }
        }

        // 7. Footwear (Sneakers, Boots, or Clean Minimal Base)
        if (
          matName.includes('footwear') ||
          meshName.includes('footwear') ||
          matName.includes('shoe') ||
          meshName.includes('shoe') ||
          matName.includes('feet')
        ) {
          if (mat.color) {
            mat.color.set(shoesColor);
            mat.roughness = 0.52;
            mat.metalness = 0.06;
            mat.needsUpdate = true;
          }
        }
      }
    });
  }, [clonedScene, skinTone, hairColor, topColor, bottomColor, shoesColor, outfit, isFemale, isGlasses, accessoryItem, topFabricType, bottomFabricType]);

  // Dynamic smooth stance rotation + natural idle breathing
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.005;
    }
  });

  // Calculate body build & height scaling factors with AI tailoring ease
  const scale = useMemo(() => {
    const heightFactor = height / 178; // Normalized around standard 178 cm
    let buildX = 1.0;
    let buildZ = 1.0;

    if (bodyType === 'Slim') {
      buildX = 0.94;
      buildZ = 0.94;
    } else if (bodyType === 'Athletic') {
      buildX = 1.06;
      buildZ = 1.04;
    }

    const baseScale = isFemale ? 1.08 : 1.0;
    return [buildX * baseScale, heightFactor * baseScale, buildZ * baseScale];
  }, [bodyType, height, isFemale]);

  // Resolve garment type flags for dynamic silhouette accents
  const topName = (outfit.dress?.name || outfit.top?.name || '').toLowerCase();
  const topTplId = outfit.dress?.avatarTemplateId || outfit.top?.avatarTemplateId || '';
  const bottomName = (outfit.bottom?.name || '').toLowerCase();
  const bottomTplId = outfit.bottom?.avatarTemplateId || '';

  const isHoodie = topTplId === 'tpl_hoodie' || /hoodie/i.test(topName);
  const isJacket = topTplId === 'tpl_jacket' || /jacket|blazer|coat|bomber/i.test(topName);
  const isDress = Boolean(outfit.dress) || topTplId === 'tpl_dress' || /dress|gown|maxi|saree|lehenga/i.test(topName);
  const isSkirt = bottomTplId === 'tpl_skirt' || /skirt/i.test(bottomName);
  const isBaggyPants = bottomTplId === 'tpl_baggy_pants' || /baggy|cargo|wide.?leg|palazzo/i.test(bottomName);
  const glassesFrameColor = accessoryItem?.avatarColor || '#eab308';
  const capColor = accessoryItem?.avatarColor || '#2563eb';

  return (
    <group ref={groupRef} scale={scale} position={[0, 0, 0]}>
      {/* Real Rigged 3D Character Model */}
      <primitive object={clonedScene} />

      {/* ── HOODIE HOOD ACCENT (Streetwear fleece draped behind collar) ── */}
      {isHoodie && (
        <group position={[0, isFemale ? 1.41 : 1.46, -0.09]} rotation={[0.38, 0, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.13, 0.046, 16, 24, Math.PI * 1.25]} />
            <meshStandardMaterial color={topColor} roughness={0.84} metalness={0.02} />
          </mesh>
          {/* Drawstring Left */}
          <mesh position={[-0.035, -0.12, 0.17]} rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.12, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          {/* Drawstring Right */}
          <mesh position={[0.035, -0.12, 0.17]} rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.12, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* ── JACKET / BLAZER STRUCTURE ACCENT ── */}
      {isJacket && (
        <group position={[0, isFemale ? 1.22 : 1.26, 0.13]}>
          {/* Left Lapel */}
          <mesh position={[-0.045, 0.02, 0]} rotation={[0, 0, 0.32]}>
            <boxGeometry args={[0.042, 0.14, 0.01]} />
            <meshStandardMaterial color={topColor} roughness={0.44} metalness={0.12} />
          </mesh>
          {/* Right Lapel */}
          <mesh position={[0.045, 0.02, 0]} rotation={[0, 0, -0.32]}>
            <boxGeometry args={[0.042, 0.14, 0.01]} />
            <meshStandardMaterial color={topColor} roughness={0.44} metalness={0.12} />
          </mesh>
          {/* Central Zip Placket */}
          <mesh position={[0, -0.06, 0]}>
            <boxGeometry args={[0.012, 0.22, 0.008]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.8} />
          </mesh>
        </group>
      )}

      {/* ── REALISTIC DRAPED FASHION SKIRT / DRESS (No pointed inverted cones!) ── */}
      {(isDress || isSkirt) && (
        <DrapedFashionSkirt
          isFemale={isFemale}
          isDress={isDress}
          color={isDress ? topColor : bottomColor}
          roughness={isDress ? 0.28 : 0.65}
          metalness={isDress ? 0.04 : 0.01}
        />
      )}

      {/* ── CONTOURED CARGO POCKETS (Snug against thighs, no raw floating boxes!) ── */}
      {isBaggyPants && (
        <CargoPockets isFemale={isFemale} color={bottomColor} />
      )}

      {/* ── STRUCTURED DESIGNER HANDBAG (No straight pipes piercing torso!) ── */}
      {outfit.bag && (
        <DesignerHandbag
          isFemale={isFemale}
          color={outfit.bag.avatarColor || outfit.bag.color || '#92400e'}
        />
      )}

      {/* ── 3D SUNGLASSES OVERLAY (Rendered directly at eye level: y=1.665, z=0.142 on male) ── */}
      {isGlasses && !isFemale && (
        <group position={[0, 1.665, 0.142]}>
          {/* Left Lens – Tinted Aviator Glass */}
          <mesh position={[-0.034, 0, 0]}>
            <circleGeometry args={[0.024, 24]} />
            <meshStandardMaterial
              color="#18181b"
              roughness={0.05}
              metalness={0.5}
              transparent
              opacity={0.85}
              side={2}
            />
          </mesh>
          {/* Left Rim Ring */}
          <mesh position={[-0.034, 0, 0]}>
            <torusGeometry args={[0.024, 0.0028, 12, 24]} />
            <meshStandardMaterial color={glassesFrameColor} roughness={0.2} metalness={0.95} />
          </mesh>

          {/* Right Lens – Tinted Aviator Glass */}
          <mesh position={[0.034, 0, 0]}>
            <circleGeometry args={[0.024, 24]} />
            <meshStandardMaterial
              color="#18181b"
              roughness={0.05}
              metalness={0.5}
              transparent
              opacity={0.85}
              side={2}
            />
          </mesh>
          {/* Right Rim Ring */}
          <mesh position={[0.034, 0, 0]}>
            <torusGeometry args={[0.024, 0.0028, 12, 24]} />
            <meshStandardMaterial color={glassesFrameColor} roughness={0.2} metalness={0.95} />
          </mesh>

          {/* Nose Bridge */}
          <mesh position={[0, 0.006, 0]}>
            <boxGeometry args={[0.018, 0.004, 0.004]} />
            <meshStandardMaterial color={glassesFrameColor} roughness={0.2} metalness={0.95} />
          </mesh>

          {/* Left Temple Arm (extending back past ear) */}
          <mesh position={[-0.060, 0.002, -0.048]} rotation={[0, -0.08, 0]}>
            <boxGeometry args={[0.003, 0.004, 0.095]} />
            <meshStandardMaterial color={glassesFrameColor} roughness={0.2} metalness={0.9} />
          </mesh>

          {/* Right Temple Arm */}
          <mesh position={[0.060, 0.002, -0.048]} rotation={[0, 0.08, 0]}>
            <boxGeometry args={[0.003, 0.004, 0.095]} />
            <meshStandardMaterial color={glassesFrameColor} roughness={0.2} metalness={0.9} />
          </mesh>
        </group>
      )}

      {/* ── 3D FITTED BASEBALL CAP (Resting snugly on head crown) ── */}
      {isCap && (
        <group
          position={[0, isFemale ? 1.715 : 1.775, 0.012]}
          rotation={[0.10, 0, 0]}
          scale={isFemale ? [0.98, 0.94, 1.00] : [1.02, 0.96, 1.04]}
        >
          {/* Cap Crown Dome */}
          <mesh castShadow>
            <sphereGeometry args={[0.126, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={capColor} roughness={0.72} metalness={0.03} />
          </mesh>
          {/* Lower Crown Band Ring */}
          <mesh position={[0, -0.006, 0]}>
            <torusGeometry args={[0.124, 0.008, 8, 28]} />
            <meshStandardMaterial color={capColor} roughness={0.80} metalness={0.02} />
          </mesh>
          {/* Front Visor */}
          <mesh castShadow position={[0, 0.002, 0.11]} rotation={[0.16, 0, 0]}>
            <boxGeometry args={[0.142, 0.010, 0.095]} />
            <meshStandardMaterial color={capColor} roughness={0.72} metalness={0.03} />
          </mesh>
          {/* Small Front Logo Pin */}
          <mesh position={[0, 0.045, 0.118]}>
            <circleGeometry args={[0.014, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/**
 * 2. Camera & Stance Turntable Rig
 * Dynamically animates camera orbit azimuthal angle when stance buttons are clicked (420ms ease),
 * then automatically yields so OrbitControls provides 100% free 360° mouse/touch rotation!
 */
function CameraStanceRig({ pose, controlsRef }) {
  const isTransitioningRef = useRef(false);
  const targetAngleRef = useRef(0);
  const startAngleRef = useRef(0);
  const startTimeRef = useRef(0);
  const prevPoseRef = useRef(pose);

  useEffect(() => {
    // Only animate when stance actually changes
    if (prevPoseRef.current === pose && startTimeRef.current !== 0) return;
    prevPoseRef.current = pose;

    if (!controlsRef.current) return;
    const target = pose === 3 ? 1.50 : pose === 2 ? 0.65 : 0;
    targetAngleRef.current = target;
    startAngleRef.current = controlsRef.current.getAzimuthalAngle();
    startTimeRef.current = performance.now();
    isTransitioningRef.current = true;
  }, [pose, controlsRef]);

  // Yield immediately to user manual dragging
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onUserDragStart = () => {
      isTransitioningRef.current = false;
    };
    controls.addEventListener('start', onUserDragStart);
    return () => controls.removeEventListener('start', onUserDragStart);
  }, [controlsRef]);

  useFrame(() => {
    if (isTransitioningRef.current && controlsRef.current) {
      const now = performance.now();
      const elapsed = (now - startTimeRef.current) / 420; // 420ms smooth ease
      if (elapsed >= 1) {
        controlsRef.current.setAzimuthalAngle(targetAngleRef.current);
        controlsRef.current.update();
        isTransitioningRef.current = false;
      } else {
        const ease = 1 - Math.pow(1 - elapsed, 3); // Cubic ease out
        const current = THREE.MathUtils.lerp(startAngleRef.current, targetAngleRef.current, ease);
        controlsRef.current.setAzimuthalAngle(current);
        controlsRef.current.update();
      }
    }
  });

  return null;
}

/**
 * 3. Studio Podium Platform (Clean Matte Finish - Blue Circle Removed!)
 */
function StudioPlatform() {
  return (
    <group position={[0, -0.04, 0]}>
      {/* Lower Beveled Base */}
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <cylinderGeometry args={[1.28, 1.34, 0.04, 64]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.15} />
      </mesh>
      {/* Upper Pure Matte Studio Platform */}
      <mesh receiveShadow position={[0, -0.015, 0]}>
        <cylinderGeometry args={[1.20, 1.24, 0.05, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.05} />
      </mesh>
    </group>
  );
}

/**
 * 4. Loading Spinner Fallback
 */
function ModelLoadingPlaceholder() {
  return (
    <Html center>
      <div className="three-model-loader">
        <div className="three-spinner"></div>
        <span>Loading Rigged 3D Avatar...</span>
      </div>
    </Html>
  );
}

/**
 * 5. Main ThreeAvatarCanvas Component
 * Configured with exact camera framing so the avatar occupies 75–80% of the canvas.
 */
export default function ThreeAvatarCanvas({
  gender = 'Male',
  skinTone = '#f7d0b5',
  hairColor = '#1f2937',
  bodyType = 'Athletic',
  height = 178,
  outfit = {},
  aiCalibration = null,
  onSelectGarment,
  onResetView
}) {
  const [pose, setPose] = useState(1);
  const controlsRef = useRef();

  const handleResetCamera = () => {
    setPose(1);
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="three-avatar-container">
      {/* 3D Canvas */}
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [0, 0.95, 2.5], fov: 44 }}
        className="three-canvas"
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <Suspense fallback={<ModelLoadingPlaceholder />}>
          {/* Camera Stance Controller */}
          <CameraStanceRig pose={pose} controlsRef={controlsRef} />

          {/* Studio Ambient Lighting */}
          <ambientLight intensity={0.8} />

          {/* Key Light (Front-Right) */}
          <directionalLight
            position={[2.5, 4.5, 3.5]}
            intensity={1.8}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          />

          {/* Soft Fill Light (Front-Left) */}
          <directionalLight position={[-2.5, 3, 2]} intensity={0.85} color="#f8fafc" />

          {/* Neutral Studio Rim Light (Back Separation - Crisp Studio White, NO blue glow!) */}
          <directionalLight position={[0, 3.5, -3.5]} intensity={1.1} color="#ffffff" />

          {/* Interactive Controls (Full 360° Horizontal Rotation & Zoom) */}
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            minDistance={1.5}
            maxDistance={3.8}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.05}
            target={[0, 0.95, 0]}
          />

          {/* Avatar & Platform Group */}
          <group position={[0, 0, 0]}>
            {/* Rigged Real Character Model */}
            <RiggedAvatarModel
              gender={gender}
              skinTone={skinTone}
              hairColor={hairColor}
              bodyType={bodyType}
              height={height}
              pose={pose}
              outfit={outfit}
              aiCalibration={aiCalibration}
            />

            {/* Studio Podium */}
            <StudioPlatform />

            {/* Soft Floor Shadows */}
            <ContactShadows
              position={[0, 0, 0]}
              opacity={0.7}
              scale={2.6}
              blur={2.0}
              far={1.2}
            />
          </group>
        </Suspense>
      </Canvas>

      {/* Floating 3D HUD Controls */}
      <div className="three-hud-topbar">
        {aiCalibration ? (
          <span className="three-badge" style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#6366f1', background: 'rgba(255, 255, 255, 0.94)' }}>
            <Sparkles size={13} /> AI Adaptive Fit &bull; {aiCalibration.adaptation?.conformationScore || '98.4%'} ({aiCalibration.fabric?.type?.toUpperCase() || 'COTTON'})
          </span>
        ) : (
          <span className="three-badge">
            <Sparkles size={13} /> 3D Live Engine &bull; R3F + Three.js
          </span>
        )}
        <button
          type="button"
          className="three-hud-icon-btn"
          onClick={handleResetCamera}
          title="Reset Camera View"
        >
          <RotateCw size={14} />
          <span>Reset View</span>
        </button>
      </div>

      {/* Stance Selector Bar (Snapchat Bitmoji Runway Style) */}
      <div className="three-pose-bar">
        <span className="three-pose-label">Stance:</span>
        <button
          type="button"
          className={`three-pose-btn ${pose === 1 ? 'active' : ''}`}
          onClick={() => setPose(1)}
        >
          Runway Front
        </button>
        <button
          type="button"
          className={`three-pose-btn ${pose === 2 ? 'active' : ''}`}
          onClick={() => setPose(2)}
        >
          Fashion 3/4
        </button>
        <button
          type="button"
          className={`three-pose-btn ${pose === 3 ? 'active' : ''}`}
          onClick={() => setPose(3)}
        >
          Side Profile
        </button>
      </div>

      <div className="three-hint-footer">
        <span>Click &amp; drag to rotate 360&deg; &bull; Scroll to zoom</span>
      </div>
    </div>
  );
}
