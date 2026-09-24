"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  ContactShadows,
  RoundedBox,
  OrbitControls,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";

// ============================================================================
// Canvas 2D Texture Generators (Ultra High-DPI, Crisp & Photo-realistic)
// ============================================================================

/** Generates an authentic, luxury restaurant QR Standee texture */
function useQRStandeeTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1440;
    const ctx = canvas.getContext("2d")!;

    // 1. Background - Deep obsidian with subtle inner gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1440);
    bgGrad.addColorStop(0, "#16191E");
    bgGrad.addColorStop(0.5, "#0F1115");
    bgGrad.addColorStop(1, "#0A0B0E");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1440);

    // 2. Luxury Brass/Gold Border
    ctx.strokeStyle = "#E5A93C";
    ctx.lineWidth = 14;
    ctx.strokeRect(36, 36, 952, 1368);

    ctx.strokeStyle = "rgba(229, 169, 60, 0.35)";
    ctx.lineWidth = 4;
    ctx.strokeRect(54, 54, 916, 1332);

    // 3. Top Restaurant Header
    ctx.textAlign = "center";
    ctx.fillStyle = "#E5A93C";
    ctx.font = "bold 44px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("THE SPICE ROUTE", 512, 160);

    ctx.fillStyle = "#9CA3AF";
    ctx.font = "600 24px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText("FINE CONTEMPORARY DINING", 512, 205);

    // 4. White High-Contrast QR Code Plaque
    const qrX = 172;
    const qrY = 260;
    const qrSize = 680;

    // Rounded background for the QR code
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 36);
    ctx.fill();

    // Subtle drop shadow around the white QR plaque
    ctx.strokeStyle = "rgba(229, 169, 60, 0.6)";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Draw Realistic QR Matrix
    const matrixSize = 29;
    const cellSize = (qrSize - 100) / matrixSize;
    const startX = qrX + 50;
    const startY = qrY + 50;

    ctx.fillStyle = "#0F1115";

    // Helper: draw square finder patterns
    const drawFinderPattern = (fx: number, fy: number) => {
      // Outer box 7x7
      ctx.fillRect(fx, fy, cellSize * 7, cellSize * 7);
      // White inner ring 5x5
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(
        fx + cellSize,
        fy + cellSize,
        cellSize * 5,
        cellSize * 5
      );
      // Solid center 3x3
      ctx.fillStyle = "#0F1115";
      ctx.fillRect(
        fx + cellSize * 2,
        fy + cellSize * 2,
        cellSize * 3,
        cellSize * 3
      );
    };

    drawFinderPattern(startX, startY);
    drawFinderPattern(startX + (matrixSize - 7) * cellSize, startY);
    drawFinderPattern(startX, startY + (matrixSize - 7) * cellSize);

    // Deterministic procedural QR data modules
    ctx.fillStyle = "#0F1115";
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        // Skip finder pattern zones
        const isFinderZone =
          (r < 8 && c < 8) ||
          (r < 8 && c >= matrixSize - 8) ||
          (r >= matrixSize - 8 && c < 8);
        if (isFinderZone) continue;

        // Skip center logo zone
        if (r >= 11 && r <= 17 && c >= 11 && c <= 17) continue;

        // Pseudo-random pattern based on table token seed
        const pseudoRand =
          Math.sin(r * 12.9898 + c * 78.233 + 42) * 43758.5453;
        if ((pseudoRand - Math.floor(pseudoRand)) > 0.45) {
          ctx.beginPath();
          ctx.roundRect(
            startX + c * cellSize,
            startY + r * cellSize,
            cellSize - 1.5,
            cellSize - 1.5,
            2
          );
          ctx.fill();
        }
      }
    }

    // Center Golden Table Emblem on the QR code
    const emblemSize = cellSize * 7;
    const emblemX = startX + 11 * cellSize;
    const emblemY = startY + 11 * cellSize;
    ctx.fillStyle = "#16191E";
    ctx.beginPath();
    ctx.roundRect(emblemX, emblemY, emblemSize, emblemSize, 14);
    ctx.fill();
    ctx.strokeStyle = "#E5A93C";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = "#E5A93C";
    ctx.font = "bold 38px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("T1", emblemX + emblemSize / 2, emblemY + emblemSize / 2 + 13);

    // 5. Bottom Instructions & Badges
    ctx.fillStyle = "#F3F4F6";
    ctx.font = "bold 44px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("SCAN TO DINE & PAY", 512, 1020);

    ctx.fillStyle = "#E5A93C";
    ctx.font = "600 30px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("TABLE T1 • INSTANT SERVICE", 512, 1075);

    ctx.fillStyle = "#6B7280";
    ctx.font = "24px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("Point phone camera • Zero App Install Required", 512, 1140);

    // 6. Security & TableOS Footer
    ctx.fillStyle = "rgba(229, 169, 60, 0.15)";
    ctx.beginPath();
    ctx.roundRect(260, 1220, 504, 76, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(229, 169, 60, 0.4)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#F59E0B";
    ctx.font = "bold 26px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("⚡ POWERED BY TABLEOS", 512, 1268);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    return texture;
  }, []);
}

/** Generates an authentic, beautiful TableOS Mobile App interface texture */
function usePhoneScreenTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 2340;
    const ctx = canvas.getContext("2d")!;

    // 1. Dark Modern Hospitality App Canvas
    ctx.fillStyle = "#0F1115";
    ctx.fillRect(0, 0, 1080, 2340);

    // 2. iOS Status Bar
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 42px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("9:41", 90, 100);

    // Dynamic Island
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(390, 48, 300, 75, 38);
    ctx.fill();

    // 3. TableOS Navigation Bar
    const navGrad = ctx.createLinearGradient(0, 150, 0, 360);
    navGrad.addColorStop(0, "#16191E");
    navGrad.addColorStop(1, "#121418");
    ctx.fillStyle = navGrad;
    ctx.fillRect(0, 150, 1080, 210);
    ctx.strokeStyle = "#2A303C";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.lineTo(1080, 360);
    ctx.stroke();

    // Restaurant Title & Table Badge
    ctx.fillStyle = "#F3F4F6";
    ctx.font = "bold 56px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("The Spice Route", 64, 250);

    // Emerald Active Table Pill
    ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
    ctx.beginPath();
    ctx.roundRect(64, 280, 260, 56, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#34D399";
    ctx.beginPath();
    ctx.arc(96, 308, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 28px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("TABLE T1 • LIVE", 118, 318);

    // 4. AI Search Bar Pill
    ctx.fillStyle = "#1A1E26";
    ctx.beginPath();
    ctx.roundRect(64, 400, 952, 110, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(229, 169, 60, 0.4)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#E5A93C";
    ctx.font = "bold 38px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("✨ Ask AI: 'Best spicy chicken under ₹300?'", 100, 470);

    // 5. Category Chips Row
    const categories = [
      { name: "All (24)", active: true },
      { name: "Starters", active: false },
      { name: "Main Curries", active: false },
      { name: "Breads", active: false },
    ];
    let chipX = 64;
    categories.forEach((cat) => {
      const chipWidth = cat.active ? 200 : 180;
      ctx.fillStyle = cat.active ? "#E5A93C" : "#1A1E26";
      ctx.beginPath();
      ctx.roundRect(chipX, 550, chipWidth, 75, 22);
      ctx.fill();
      if (!cat.active) {
        ctx.strokeStyle = "#2A303C";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = cat.active ? "#0F1115" : "#9CA3AF";
      ctx.font = "bold 32px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(cat.name, chipX + chipWidth / 2, 600);
      chipX += chipWidth + 24;
    });

    // 6. Food Card 1 - Butter Chicken
    const drawDishCard = (
      y: number,
      title: string,
      price: string,
      tags: string[],
      qty: number | null
    ) => {
      ctx.fillStyle = "#16191E";
      ctx.beginPath();
      ctx.roundRect(64, y, 952, 380, 32);
      ctx.fill();
      ctx.strokeStyle = "#262C38";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Food placeholder thumbnail with warm gradient
      const imgGrad = ctx.createLinearGradient(92, y + 36, 360, y + 340);
      imgGrad.addColorStop(0, "#3D2413");
      imgGrad.addColorStop(1, "#1E140C");
      ctx.fillStyle = imgGrad;
      ctx.beginPath();
      ctx.roundRect(96, y + 40, 300, 300, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(229, 169, 60, 0.3)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Icon on food thumbnail
      ctx.textAlign = "center";
      ctx.font = "72px system-ui";
      ctx.fillText("🍲", 246, y + 210);

      // Dish Title
      ctx.textAlign = "left";
      ctx.fillStyle = "#F3F4F6";
      ctx.font = "bold 46px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.fillText(title, 430, y + 100);

      // Dietary & Chef Badges
      let tagX = 430;
      tags.forEach((tag) => {
        const isVeg = tag === "VEG";
        ctx.fillStyle = isVeg ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)";
        ctx.beginPath();
        ctx.roundRect(tagX, y + 135, 130, 48, 12);
        ctx.fill();
        ctx.fillStyle = isVeg ? "#34D399" : "#F87171";
        ctx.font = "bold 24px 'Plus Jakarta Sans', system-ui, sans-serif";
        ctx.fillText(tag, tagX + 22, y + 168);
        tagX += 150;
      });

      // Price in INR
      ctx.fillStyle = "#E5A93C";
      ctx.font = "bold 48px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.fillText(price, 430, y + 265);

      // Action Button
      if (qty !== null) {
        // Quantity Pill [ - 1 + ]
        ctx.fillStyle = "rgba(229, 169, 60, 0.15)";
        ctx.beginPath();
        ctx.roundRect(740, y + 220, 240, 80, 24);
        ctx.fill();
        ctx.strokeStyle = "#E5A93C";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#E5A93C";
        ctx.font = "bold 40px 'Plus Jakarta Sans', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("-", 780, y + 275);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(String(qty), 860, y + 275);
        ctx.fillStyle = "#E5A93C";
        ctx.fillText("+", 940, y + 275);
      } else {
        // Add Button
        ctx.fillStyle = "#E5A93C";
        ctx.beginPath();
        ctx.roundRect(800, y + 220, 180, 80, 24);
        ctx.fill();
        ctx.fillStyle = "#0F1115";
        ctx.font = "bold 34px 'Plus Jakarta Sans', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("+ ADD", 890, y + 273);
      }
    };

    drawDishCard(660, "Butter Chicken", "₹480.00", ["NON-VEG", "BESTSELLER"], 1);
    drawDishCard(1080, "Garlic Naan (x2)", "₹160.00", ["VEG", "CRISPY"], 2);
    drawDishCard(1500, "Dum Biryani", "₹540.00", ["NON-VEG"], null);

    // 7. Floating Bottom Cart Drawer Banner
    const cartGrad = ctx.createLinearGradient(0, 2020, 0, 2260);
    cartGrad.addColorStop(0, "#E5A93C");
    cartGrad.addColorStop(1, "#D97706");
    ctx.fillStyle = cartGrad;
    ctx.beginPath();
    ctx.roundRect(64, 2040, 952, 160, 36);
    ctx.fill();

    // Shadow glow
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#0F1115";
    ctx.font = "bold 46px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("3 Dishes in Cart", 120, 2125);

    ctx.font = "bold 32px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("₹640.00 • Taxes calculated", 120, 2168);

    ctx.textAlign = "right";
    ctx.font = "bold 44px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText("View Bill →", 960, 2140);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    return texture;
  }, []);
}

// ============================================================================
// 3D Meshes with Physically Based Rendering (PBR)
// ============================================================================

/** Luxury American Walnut Dining Table with Brushed Brass Inlay & Hairpin Legs */
function DiningTable() {
  return (
    <group position={[0, -0.65, 0]}>
      {/* 1. Walnut Solid Wood Tabletop */}
      <RoundedBox
        args={[4.4, 0.22, 2.7]}
        radius={0.06}
        smoothness={6}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color="#3A2416" // Rich dark American walnut
          roughness={0.45}
          metalness={0.12}
        />
      </RoundedBox>

      {/* 2. Perimeter Brushed Brass Inlay Ribbon */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[4.42, 0.04, 2.72]} />
        <meshStandardMaterial
          color="#E5A93C"
          roughness={0.25}
          metalness={0.9}
        />
      </mesh>

      {/* 3. Under-table Substructure (Matte Black Steel) */}
      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[3.8, 0.08, 2.2]} />
        <meshStandardMaterial color="#13161C" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* 4. Elegant Hairpin Table Legs with Brass Caps */}
      {[
        [-1.7, -0.85, -1.0],
        [1.7, -0.85, -1.0],
        [-1.7, -0.85, 1.0],
        [1.7, -0.85, 1.0],
      ].map(([x, y, z], idx) => (
        <group key={idx} position={[x, y, z]}>
          {/* Main Black Steel Leg */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.04, 0.025, 1.3, 16]} />
            <meshStandardMaterial
              color="#1A1E24"
              roughness={0.3}
              metalness={0.85}
            />
          </mesh>
          {/* Brass Foot Cap */}
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.028, 0.035, 0.15, 16]} />
            <meshStandardMaterial
              color="#E5A93C"
              roughness={0.2}
              metalness={0.95}
            />
          </mesh>
        </group>
      ))}

      {/* Ground Contact Shadow */}
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.7}
        scale={6}
        blur={2.5}
        far={3}
        color="#000000"
      />
    </group>
  );
}

/** Luxury Brushed Brass & Frosted Acrylic QR Standee */
function QRStandee() {
  const qrTexture = useQRStandeeTexture();

  return (
    <group position={[-0.85, -0.22, 0.35]} rotation={[0, 0.45, 0]}>
      {/* 1. Heavy Solid Brushed Brass Base */}
      <RoundedBox
        args={[0.88, 0.14, 0.45]}
        radius={0.03}
        smoothness={4}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color="#D4AF37"
          roughness={0.22}
          metalness={0.95}
        />
      </RoundedBox>

      {/* 2. Glass / Acrylic Plaque Body */}
      <group position={[0, 0.72, 0]}>
        {/* Crystal Acrylic Frame with Refraction */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.82, 1.32, 0.04]} />
          <meshPhysicalMaterial
            color="#FFFFFF"
            transmission={0.94}
            opacity={0.95}
            transparent
            roughness={0.08}
            ior={1.5}
            thickness={0.05}
          />
        </mesh>

        {/* Crisp QR Standee Front Plate */}
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[0.78, 1.28]} />
          <meshBasicMaterial map={qrTexture} toneMapped={false} />
        </mesh>

        {/* Mirror Backing */}
        <mesh position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.78, 1.28]} />
          <meshStandardMaterial
            color="#16191E"
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      </group>

      {/* Local Contact Shadow on the wood table */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.5}
        scale={1.4}
        blur={1.5}
        far={0.5}
        color="#000000"
      />
    </group>
  );
}

/** Modern Floating Smartphone with Titanium Frame & Live TableOS Screen */
function FloatingSmartphone() {
  const phoneTexture = usePhoneScreenTexture();
  const phoneRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (phoneRef.current) {
      const t = state.clock.getElapsedTime();
      // Gentle, organic floating oscillation
      phoneRef.current.position.y = 0.55 + Math.sin(t * 1.5) * 0.04;
      phoneRef.current.rotation.z = -0.06 + Math.sin(t * 0.9) * 0.015;
      phoneRef.current.rotation.y = -0.42 + Math.sin(t * 0.6) * 0.025;
    }
  });

  return (
    <group
      ref={phoneRef}
      position={[0.9, 0.55, 0.55]}
      rotation={[-0.24, -0.42, -0.06]}
    >
      {/* 1. Phone Body (Titanium Obsidian Matte Frame) */}
      <RoundedBox
        args={[1.08, 2.22, 0.08]}
        radius={0.09}
        smoothness={6}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color="#1E232B"
          roughness={0.25}
          metalness={0.9}
        />
      </RoundedBox>

      {/* 2. Side Titanium Bezel Highlight */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.09, 2.23, 0.04]} />
        <meshStandardMaterial
          color="#E5A93C"
          roughness={0.2}
          metalness={0.95}
        />
      </mesh>

      {/* 3. Glass Front Screen */}
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[1.0, 2.14]} />
        <meshBasicMaterial map={phoneTexture} toneMapped={false} />
      </mesh>

      {/* Screen Glare Glass Layer */}
      <mesh position={[0, 0, 0.043]}>
        <planeGeometry args={[1.0, 2.14]} />
        <meshPhysicalMaterial
          color="#FFFFFF"
          transmission={0.92}
          transparent
          opacity={0.3}
          roughness={0.04}
          ior={1.52}
        />
      </mesh>

      {/* Soft Contact Shadow beneath hovering phone */}
      <ContactShadows
        position={[0, -0.9, 0]}
        opacity={0.4}
        scale={2.2}
        blur={2}
        far={1.5}
        color="#000000"
      />
    </group>
  );
}

/** Luxury Ceramic Coaster with Ambient Golden Tea-Light Candle */
function TableCandleAccent() {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      // Natural candlelight flicker
      const t = state.clock.getElapsedTime();
      lightRef.current.intensity = 1.4 + Math.sin(t * 8) * 0.15 + Math.cos(t * 13) * 0.08;
    }
  });

  return (
    <group position={[0.0, -0.48, -0.4]}>
      {/* Matte Black Ceramic Plate */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.28, 0.04, 32]} />
        <meshStandardMaterial color="#111317" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Frosted Glass Candle Cup */}
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.16, 0.14, 0.16, 24]} />
        <meshPhysicalMaterial
          color="#FDE68A"
          transmission={0.88}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Candle Flame / Core */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>

      {/* Warm Ambient Candle Light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.22, 0]}
        color="#F59E0B"
        intensity={1.4}
        distance={2.5}
        decay={2}
      />
    </group>
  );
}

/** Gentle Floating Warm Golden Bokeh Embers */
function WarmBokehEmbers({ count = 30 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = Math.random() * 2.5 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.getElapsedTime() * 0.015;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#F59E0B"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ============================================================================
// Main Exported Scene Component
// ============================================================================

export function DiningTableScene() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) =>
        setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  if (!mounted || prefersReducedMotion) {
    return (
      <div className="w-full h-full min-h-[460px] rounded-3xl bg-gradient-to-br from-[#16191E] via-[#0F1115] to-[#0A0B0E] border border-surface-border flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-2xl">
        <div className="w-24 h-24 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center shadow-glow mb-4">
          <span className="text-3xl font-extrabold text-amber-400 font-display">T1</span>
        </div>
        <h3 className="text-xl font-bold text-gray-100 font-display">
          TableOS Interactive Experience
        </h3>
        <p className="text-sm text-gray-400 text-center max-w-sm mt-2">
          Scan the brass QR standee to start dining, order dishes, and settle with zero friction.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] md:h-[580px] rounded-3xl overflow-hidden relative border border-surface-border/70 shadow-2xl bg-gradient-to-b from-[#13161D] via-[#0E1015] to-[#090A0D]">
      {/* Soft studio vignette glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(229,169,60,0.12),transparent_70%)] pointer-events-none" />

      <Canvas
        camera={{ position: [0, 1.4, 4.0], fov: 38 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Orbit Controls with Silky Damping */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 3.4}
          maxAzimuthAngle={Math.PI / 3.5}
          minAzimuthAngle={-Math.PI / 3.5}
          dampingFactor={0.06}
        />

        {/* Warm Studio Lighting */}
        <ambientLight intensity={1.1} color="#FDF6E2" />

        {/* Primary Warm Amber Key Light */}
        <spotLight
          position={[2.5, 4.5, 3.2]}
          angle={0.6}
          penumbra={0.7}
          intensity={3.5}
          color="#FBBF24"
          castShadow
        />

        {/* Soft Cyan/Slate Rim Light for Depth Separation */}
        <directionalLight
          position={[-3.5, 3.0, -2.5]}
          intensity={1.2}
          color="#93C5FD"
        />

        {/* Subtle Fill Light from Front */}
        <directionalLight
          position={[0, 0.5, 3.5]}
          intensity={0.6}
          color="#FDF6E2"
        />

        {/* Scene Objects */}
        <DiningTable />
        <QRStandee />
        <FloatingSmartphone />
        <TableCandleAccent />
        <WarmBokehEmbers count={35} />

        {/* Subtle Environment Reflection Map */}
        <Environment preset="city" />
      </Canvas>

      {/* Floating Glassmorphic Badges */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="glass-card px-3.5 py-1.5 rounded-full flex items-center gap-2 pointer-events-auto shadow-lg border border-surface-border/60">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-gray-200">
            Live 3D Standee & Dining App • Table T1
          </span>
        </div>
        <div className="glass-card px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-300 border border-amber-500/30 shadow-lg pointer-events-auto">
          Rotate with Mouse or Touch ✦
        </div>
      </div>
    </div>
  );
}
