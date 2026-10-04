"use client";

import React from "react";

interface HeroDiningAssetProps {
  theme?: string;
}

export function HeroDiningAsset({ theme = "" }: HeroDiningAssetProps) {
  return (
    <svg
      className="hero-svg"
      viewBox="0 0 800 700"
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Ambient background glow */}
        <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--b)" stopOpacity="0.55" />
          <stop offset="60%" stopColor="var(--b)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--b)" stopOpacity="0" />
        </radialGradient>

        {/* Metallic cutlery gradient */}
        <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c5bcab" />
          <stop offset="25%" stopColor="#eae3d2" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="75%" stopColor="#d5ccba" />
          <stop offset="100%" stopColor="#9a8f7c" />
        </linearGradient>

        {/* Cutlery highlight spine */}
        <linearGradient id="metalSpine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
        </linearGradient>

        {/* Spoon inner bowl depth */}
        <radialGradient id="spoonBowlInner" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#d2c9b6" />
          <stop offset="85%" stopColor="#8c816f" />
          <stop offset="100%" stopColor="#544c40" />
        </radialGradient>

        {/* Plate porcelain shading */}
        <radialGradient id="platePorcelain" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fffcf5" />
          <stop offset="70%" stopColor="#f4ecdd" />
          <stop offset="95%" stopColor="#e3d8c2" />
          <stop offset="100%" stopColor="#c9bea6" />
        </radialGradient>

        {/* Soft shadow for cutlery */}
        <filter id="cutleryShadow" x="-20%" y="-10%" width="140%" height="120%">
          <feDropShadow dx="3" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.45" />
        </filter>

        {/* Dish transition style */}
        <style>{`
          .dish-group {
            transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            transform-origin: 400px 350px;
          }
          .dish-active {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          .dish-hidden {
            opacity: 0;
            transform: scale(0.92) rotate(-5deg);
            pointer-events: none;
          }
          @keyframes steamDrift {
            0% { transform: translateY(0) scaleX(1); opacity: 0; }
            30% { opacity: 0.35; }
            70% { opacity: 0.2; }
            100% { transform: translateY(-28px) scaleX(1.3); opacity: 0; }
          }
          .steam-1 { animation: steamDrift 3.6s ease-out infinite; transform-origin: center bottom; }
          .steam-2 { animation: steamDrift 4.2s ease-out infinite 1.2s; transform-origin: center bottom; }
          .steam-3 { animation: steamDrift 3.9s ease-out infinite 2.1s; transform-origin: center bottom; }
        `}</style>
      </defs>

      {/* ── 1. AMBIENT GLOW ── */}
      <circle cx="400" cy="350" r="360" fill="url(#heroGlow)" />

      {/* ── 2. REFINED CUTLERY (FORK - LEFT) ── */}
      <g filter="url(#cutleryShadow)">
        {/* Fork Prongs (4 Sleek Tines) */}
        <rect x="99" y="172" width="4.5" height="48" rx="2" fill="url(#metalGrad)" />
        <rect x="107" y="170" width="4.5" height="52" rx="2" fill="url(#metalGrad)" />
        <rect x="115" y="170" width="4.5" height="52" rx="2" fill="url(#metalGrad)" />
        <rect x="123" y="172" width="4.5" height="48" rx="2" fill="url(#metalGrad)" />

        {/* Fork Bridge & Neck */}
        <path
          d="M 98 214 
             C 98 238, 107 254, 111 262
             L 115 262
             C 119 254, 128 238, 128 214
             Z"
          fill="url(#metalGrad)"
        />

        {/* Fork Ergonomic Handle */}
        <path
          d="M 111 260
             C 111 310, 108 380, 105 440
             C 102 485, 101 508, 104 515
             C 106 521, 120 521, 122 515
             C 125 508, 124 485, 121 440
             C 118 380, 115 310, 115 260
             Z"
          fill="url(#metalGrad)"
        />
        {/* Fork Spine Specular Highlight */}
        <path
          d="M 113 262 L 113 440 C 111 485, 110 514, 113 518"
          stroke="url(#metalSpine)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* ── 3. REFINED CUTLERY (SPOON - RIGHT) ── */}
      <g filter="url(#cutleryShadow)">
        {/* Spoon Oval Bowl Outer Rim */}
        <ellipse cx="685" cy="216" rx="24" ry="48" fill="url(#metalGrad)" />
        {/* Spoon Concave Inner Bowl (Depth & Shading) */}
        <ellipse cx="685" cy="216" rx="19.5" ry="41" fill="url(#spoonBowlInner)" />
        {/* Specular Inner Glint Curve */}
        <path
          d="M 673 194 C 670 210, 672 232, 677 248"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.8"
          fill="none"
        />

        {/* Spoon Neck Bridge */}
        <path
          d="M 681 262 L 689 262 L 687 274 L 683 274 Z"
          fill="url(#metalGrad)"
        />

        {/* Spoon Ergonomic Handle */}
        <path
          d="M 687 268
             C 687 315, 690 380, 693 440
             C 696 485, 697 508, 694 515
             C 692 521, 678 521, 676 515
             C 673 508, 674 485, 677 440
             C 680 380, 683 315, 683 268
             Z"
          fill="url(#metalGrad)"
        />
        {/* Spoon Spine Specular Highlight */}
        <path
          d="M 685 270 L 685 440 C 687 485, 688 514, 685 518"
          stroke="url(#metalSpine)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* ── 4. CELEBRATION COCKTAIL / WINE GLASS (TOP RIGHT) ── */}
      <g opacity="0.9">
        <circle cx="650" cy="112" r="48" fill="#ffffff08" stroke="#f4ecdd35" strokeWidth="1.5" />
        <circle cx="650" cy="112" r="23" fill="var(--b2)" opacity="0.65" />
        <circle cx="650" cy="112" r="14" fill="var(--b)" opacity="0.45" />
        <ellipse cx="642" cy="104" rx="5" ry="2.5" fill="#ffffff" opacity="0.5" />
      </g>

      {/* ── 5. PORCELAIN DINING PLATE & CHARGER ── */}
      {/* Outer Charger Plate (Dark Slate with fine gold inlay) */}
      <circle cx="400" cy="350" r="240" fill="#18130e" stroke="rgba(244, 236, 221, 0.16)" strokeWidth="2" />
      <circle cx="400" cy="350" r="228" fill="none" stroke="var(--b)" strokeWidth="1" opacity="0.35" />

      {/* Inner Fine Bone China Porcelain Plate */}
      <circle cx="400" cy="350" r="190" fill="url(#platePorcelain)" />
      {/* Plate Rim Bevel Depth Shadow */}
      <circle cx="400" cy="350" r="154" fill="none" stroke="#0b09071f" strokeWidth="2.5" />
      <circle cx="400" cy="350" r="148" fill="none" stroke="var(--b)" strokeWidth="1" strokeDasharray="3 5" opacity="0.3" />

      {/* ── 6. DYNAMIC ANIMATED DISHES BASED ON THEME ── */}

      {/* DISH 1: IMPERIAL AMBER ("") — Classic Sunny-Side Golden Brunch */}
      <g className={`dish-group ${theme === "" ? "dish-active" : "dish-hidden"}`}>
        {/* Crisped, delicate organic egg white */}
        <path
          d="M 320 330 
             C 310 280, 360 250, 410 255 
             C 460 260, 495 295, 490 350 
             C 485 405, 445 445, 395 440 
             C 345 435, 330 380, 320 330 Z"
          fill="#fdfbf7"
          stroke="#d2b885"
          strokeWidth="1.5"
          opacity="0.96"
        />
        {/* Golden Yolk */}
        <radialGradient id="amberYolk" cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#FFC837" />
          <stop offset="45%" stopColor="#FF8008" />
          <stop offset="90%" stopColor="#D4562C" />
          <stop offset="100%" stopColor="#9C2706" />
        </radialGradient>
        <circle cx="400" cy="350" r="54" fill="url(#amberYolk)" filter="drop-shadow(0 4px 10px rgba(212, 86, 44, 0.45))" />
        {/* Specular yolk shine */}
        <ellipse cx="384" cy="334" rx="14" ry="9" fill="#ffffff" opacity="0.65" transform="rotate(-20 384 334)" />
        <circle cx="396" cy="326" r="3.5" fill="#ffffff" opacity="0.8" />
        {/* Cracked black pepper */}
        <circle cx="355" cy="305" r="2.2" fill="#2d2215" />
        <circle cx="368" cy="318" r="1.8" fill="#2d2215" />
        <circle cx="442" cy="310" r="2" fill="#2d2215" />
        <circle cx="458" cy="375" r="2.3" fill="#2d2215" />
        <circle cx="348" cy="382" r="1.7" fill="#2d2215" />
        {/* Fresh garden chives */}
        <rect x="362" y="380" width="14" height="3" rx="1.5" transform="rotate(32 362 380)" fill="#489e3b" />
        <rect x="428" y="295" width="13" height="3" rx="1.5" transform="rotate(-40 428 295)" fill="#54b844" />
        <rect x="450" y="340" width="12" height="3" rx="1.5" transform="rotate(15 450 340)" fill="#489e3b" />
      </g>

      {/* DISH 2: BOTANICAL JADE ("jade") — Garden Burrata & Avocado Carpaccio */}
      <g className={`dish-group ${theme === "jade" ? "dish-active" : "dish-hidden"}`}>
        {/* Spiraled Avocado slices */}
        <g stroke="#1e5c3c" strokeWidth="1">
          <ellipse cx="360" cy="340" rx="34" ry="18" transform="rotate(-35 360 340)" fill="#68d391" />
          <ellipse cx="380" cy="310" rx="34" ry="18" transform="rotate(5 380 310)" fill="#48bb78" />
          <ellipse cx="425" cy="315" rx="34" ry="18" transform="rotate(45 425 315)" fill="#38a169" />
          <ellipse cx="445" cy="355" rx="34" ry="18" transform="rotate(85 445 355)" fill="#2f855a" />
          <ellipse cx="420" cy="390" rx="34" ry="18" transform="rotate(130 420 390)" fill="#38a169" />
          <ellipse cx="375" cy="385" rx="34" ry="18" transform="rotate(170 375 385)" fill="#48bb78" />
        </g>
        {/* Creamy white burrata ball in center */}
        <circle cx="400" cy="350" r="42" fill="#fcfbf9" filter="drop-shadow(0 4px 12px rgba(20, 80, 50, 0.25))" />
        {/* Burrata pleat top */}
        <path d="M 394 336 Q 400 326 406 336 Q 400 342 394 336 Z" fill="#48bb78" opacity="0.8" />
        <circle cx="400" cy="344" r="5" fill="#f6e05e" opacity="0.9" />
        {/* Basil oil droplets */}
        <circle cx="340" cy="310" r="4" fill="#38a169" />
        <circle cx="455" cy="320" r="5" fill="#38a169" />
        <circle cx="450" cy="405" r="4.5" fill="#2f855a" />
        <circle cx="345" cy="370" r="3.5" fill="#48bb78" />
        {/* Pine nuts */}
        <ellipse cx="385" cy="330" rx="6" ry="3" transform="rotate(25 385 330)" fill="#ecc94b" />
        <ellipse cx="420" cy="370" rx="6" ry="3" transform="rotate(-40 420 370)" fill="#ecc94b" />
      </g>

      {/* DISH 3: CRIMSON SCARLET ("scarlet") — Heirloom Pomodoro & Buffalo Mozzarella */}
      <g className={`dish-group ${theme === "scarlet" ? "dish-active" : "dish-hidden"}`}>
        {/* Tomato carpaccio base */}
        <circle cx="370" cy="335" r="38" fill="#e53e3e" opacity="0.9" />
        <circle cx="425" cy="330" r="36" fill="#c53030" opacity="0.9" />
        <circle cx="415" cy="380" r="38" fill="#e53e3e" opacity="0.9" />
        <circle cx="365" cy="375" r="34" fill="#9b2c2c" opacity="0.9" />
        {/* Fresh torn mozzarella pearls */}
        <circle cx="395" cy="340" r="22" fill="#ffffff" filter="drop-shadow(0 2px 8px rgba(150, 20, 20, 0.3))" />
        <circle cx="428" cy="360" r="16" fill="#ffffff" />
        <circle cx="370" cy="360" r="15" fill="#ffffff" />
        {/* Basil leaves */}
        <path d="M 380 320 C 370 300, 395 295, 410 305 C 415 320, 390 325, 380 320 Z" fill="#38a169" />
        <path d="M 430 380 C 445 370, 460 385, 450 400 C 435 405, 425 390, 430 380 Z" fill="#2f855a" />
        {/* Balsamic glaze spiral */}
        <path
          d="M 350 330 Q 400 300 440 340 T 380 400"
          stroke="#2d1515"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        {/* Sea salt flakes */}
        <rect x="390" y="338" width="3" height="3" fill="#ffffff" transform="rotate(45 390 338)" />
        <rect x="424" y="356" width="2.5" height="2.5" fill="#ffffff" transform="rotate(20 424 356)" />
      </g>

      {/* DISH 4: VELVET VIOLET ("violet") — Wild Blackberry & Fig Tart */}
      <g className={`dish-group ${theme === "violet" ? "dish-active" : "dish-hidden"}`}>
        {/* Pastry crust ring */}
        <circle cx="400" cy="350" r="62" fill="#d69e2e" stroke="#b7791f" strokeWidth="3" />
        <circle cx="400" cy="350" r="54" fill="#44337a" />
        {/* Blackberry mirror glaze */}
        <radialGradient id="violetGlaze" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#9f7aea" />
          <stop offset="60%" stopColor="#6b46c1" />
          <stop offset="100%" stopColor="#322659" />
        </radialGradient>
        <circle cx="400" cy="350" r="48" fill="url(#violetGlaze)" />
        {/* Fresh Blackberries */}
        <circle cx="380" cy="335" r="14" fill="#211738" stroke="#805ad5" strokeWidth="1.5" />
        <circle cx="410" cy="330" r="15" fill="#1a102f" stroke="#805ad5" strokeWidth="1.5" />
        <circle cx="420" cy="360" r="14" fill="#211738" stroke="#805ad5" strokeWidth="1.5" />
        <circle cx="390" cy="365" r="15" fill="#1a102f" stroke="#805ad5" strokeWidth="1.5" />
        {/* Sliced Fig in Center */}
        <ellipse cx="400" cy="350" rx="16" ry="24" transform="rotate(25 400 350)" fill="#9b2c2c" stroke="#d53f8c" strokeWidth="1.5" />
        <ellipse cx="400" cy="350" rx="9" ry="16" transform="rotate(25 400 350)" fill="#fed7e2" />
        {/* Edible gold leaf flake */}
        <polygon points="380,320 386,322 383,328 376,325" fill="#ffd700" />
      </g>

      {/* DISH 5: OCEAN COBALT ("cobalt") — Pacific King Scallop Crudo */}
      <g className={`dish-group ${theme === "cobalt" ? "dish-active" : "dish-hidden"}`}>
        {/* Ocean reduction broth pool */}
        <radialGradient id="cobaltBroth" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#63b3ed" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#3182ce" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1a365d" stopOpacity="0.8" />
        </radialGradient>
        <circle cx="400" cy="350" r="64" fill="url(#cobaltBroth)" />
        {/* 3 Seared King Scallop Medallions */}
        <g stroke="#dd6b20" strokeWidth="1.5">
          <circle cx="380" cy="330" r="24" fill="#fffaf0" filter="drop-shadow(0 3px 8px rgba(20,50,100,0.3))" />
          <circle cx="425" cy="340" r="23" fill="#fffaf0" filter="drop-shadow(0 3px 8px rgba(20,50,100,0.3))" />
          <circle cx="395" cy="375" r="24" fill="#fffaf0" filter="drop-shadow(0 3px 8px rgba(20,50,100,0.3))" />
        </g>
        {/* Sear marks */}
        <ellipse cx="380" cy="330" rx="14" ry="6" fill="#c05621" opacity="0.6" />
        <ellipse cx="425" cy="340" rx="13" ry="5" fill="#c05621" opacity="0.6" />
        <ellipse cx="395" cy="375" rx="14" ry="6" fill="#c05621" opacity="0.6" />
        {/* Lime caviar pearls */}
        <circle cx="410" cy="315" r="3.5" fill="#9ae6b4" />
        <circle cx="365" cy="360" r="3" fill="#9ae6b4" />
        <circle cx="435" cy="375" r="3.5" fill="#9ae6b4" />
        {/* Blue edible cornflower petals */}
        <path d="M 370 310 Q 375 305 380 312 Z" fill="#3182ce" />
        <path d="M 435 320 Q 442 316 440 326 Z" fill="#4299e1" />
      </g>

      {/* DISH 6: SUNSET ROSE ("rose") — Rosewater Raspberry Blossom */}
      <g className={`dish-group ${theme === "rose" ? "dish-active" : "dish-hidden"}`}>
        {/* Rose coulis mirror glaze pool */}
        <radialGradient id="roseCoulis" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbb6ce" stopOpacity="0.5" />
          <stop offset="70%" stopColor="#ed64a6" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#97266d" stopOpacity="0.9" />
        </radialGradient>
        <circle cx="400" cy="350" r="62" fill="url(#roseCoulis)" />
        {/* Rose Petal Pastry Flower */}
        <g fill="#f687b3" stroke="#b83280" strokeWidth="1">
          <ellipse cx="380" cy="335" rx="18" ry="12" transform="rotate(-30 380 335)" />
          <ellipse cx="415" cy="330" rx="18" ry="12" transform="rotate(20 415 330)" />
          <ellipse cx="425" cy="360" rx="18" ry="12" transform="rotate(70 425 360)" />
          <ellipse cx="395" cy="375" rx="18" ry="12" transform="rotate(130 395 375)" />
          <ellipse cx="370" cy="355" rx="18" ry="12" transform="rotate(180 370 355)" />
        </g>
        {/* Inner blossom bud */}
        <circle cx="400" cy="350" r="16" fill="#d53f8c" stroke="#702459" strokeWidth="1.5" />
        <circle cx="400" cy="350" r="8" fill="#fed7e2" />
        {/* Fresh Raspberries on side */}
        <circle cx="360" cy="325" r="9" fill="#9b2c2c" stroke="#e53e3e" strokeWidth="1.5" />
        <circle cx="440" cy="345" r="9.5" fill="#9b2c2c" stroke="#e53e3e" strokeWidth="1.5" />
        {/* Mint leaf accent */}
        <path d="M 412 372 C 424 372, 428 385, 420 390 C 412 388, 410 380, 412 372 Z" fill="#48bb78" />
      </g>

      {/* ── 7. ETHEREAL STEAM PARTICLES (ANIMATED STEAM) ── */}
      <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path className="steam-1" d="M 385 295 Q 380 275 390 255 T 385 235" />
        <path className="steam-2" d="M 405 290 Q 415 270 405 250 T 415 230" />
        <path className="steam-3" d="M 425 298 Q 432 278 422 260 T 430 240" />
      </g>
    </svg>
  );
}
