"use client";

import React, { useEffect, useId, useRef } from "react";
import { TabiMascot, MascotMood } from "./TabiMascot";
import styles from "./assistant.module.css";

interface TabiSpotlightProps {
  mood: MascotMood;
  paused: boolean;
  onTour: () => void;
  onChat: () => void;
  onLater: () => void;
}

export default function TabiSpotlight({ mood, paused, onTour, onChat, onLater }: TabiSpotlightProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const headingId = `${uid}-title`;
  const bodyId = `${uid}-desc`;
  const cardRef = useRef<HTMLDivElement | null>(null);
  const mascotSize = typeof window !== "undefined" && window.innerWidth <= 640 ? 120 : 168;

  useEffect(() => {
    const primary = cardRef.current?.querySelector<HTMLButtonElement>("[data-primary]");
    primary?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onLater();
      return;
    }
    if (e.key === "Tab") {
      const focusables = cardRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [];
      if (focusables.length < 2) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div className={styles.spotLayer} onKeyDown={onKeyDown}>
      <button
        className={styles.spotBackdrop}
        aria-label="Dismiss Tabi intro"
        tabIndex={-1}
        onClick={onLater}
      />
      <div className={styles.spotStage} data-paused={paused ? "true" : "false"}>
        <button
          className={`${styles.spotMascot} ${mood === "excited" || mood === "celebrate" ? styles.hop : ""}`}
          onClick={onTour}
          aria-label="Start the tour with Tabi"
        >
          <TabiMascot mood={mood} paused={paused} size={mascotSize} />
        </button>
        <div
          className={styles.spotCard}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={bodyId}
          ref={cardRef}
        >
          <div className={styles.spotTitle} id={headingId}>Hi, I'm Tabi!</div>
          <p className={styles.spotBody} id={bodyId}>
            I'm Tabi, your TableOS guide. I can walk you through this page, or
            chat whenever you like.
          </p>
          <div className={styles.spotActions}>
            <button className={styles.spotPrimary} data-primary onClick={onTour}>
              Show me around
            </button>
            <button className={styles.spotSecondary} onClick={onChat}>
              Just chat
            </button>
            <button className={styles.spotGhost} onClick={onLater}>
              I'll explore myself
            </button>
          </div>
          <div className={styles.spotHint}>You can find me in the corner anytime.</div>
        </div>
      </div>
    </div>
  );
}
