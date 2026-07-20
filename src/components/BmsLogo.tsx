"use client";

import React from "react";

type BmsLogoProps = {
  variant?: "header" | "sidebar" | "icon" | "hero" | "footer";
  className?: string;
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  BMS (Business Management Solutions) — A BNLV Group of Company
 *  OFFICIAL BRAND SEAL — SOVEREIGN FINAL BUILD · APPROVED · LOCKED
 * ════════════════════════════════════════════════════════════════════
 *
 * FINAL RATIFICATION — issued by the sovereign, official architect
 * of the firm. The interior of the seal is cleared of all figures
 * and ornament. What remains is the singular, eternal statement:
 *
 *   THE SEAL (bms-logo.png) — Enterprise Edition, bespoke (matching approved attachment):
 *     · Polished gold outer border and a rich, light royal maroon lacquer ring
 *     · Main circular ring of premium light-cream birch wood with natural grain
 *       under a smooth glossy finish
 *     · Royal navy blue serif capital inscriptions — "BUSINESS MANAGEMENT SOLUTIONS"
 *       (upper arc) · "A BNLV GROUP OF COMPANY" (lower arc)
 *     · Two small polished golden dome rivets separating the text at left and right
 *     · Central core: High-resolution, photorealistic natural satellite view
 *       of planet Earth (Blue Marble) with deep blue oceans and green-tan continents
 *       under a glassy dome with a light specular gloss highlight.
 *     · No extra birds, chariot, or ornaments — clean, corporate, and sovereign.
 *
 *   MEANING: The world itself is the mark. Clean, sovereign,
 *   self-evident — an identity that cannot age.
 *
 *   BRAND ARCHIVE (/public/brand/) — historical record only:
 *     · bms-logo-default.png         → first approved eagle medallion
 *     · bms-logo-chariot-edition.png → seven-horse chariot exploration
 *
 *   GOVERNANCE: LOGO_SRC is the single source of truth. This build
 *   is APPROVED and CLOSED. Archives exist for record, not use.
 *
 * Lockup rule: written context LEFT · emblem fitted RIGHT.
 * ════════════════════════════════════════════════════════════════════
 */

const LOGO_SRC = "/brand/bms-logo.png"; // SOVEREIGN FINAL — APPROVED

function Emblem({ size = 48 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="BMS — Business Management Solutions, A BNLV Group of Company"
      width={size}
      height={size}
      className="h-full w-full shrink-0 select-none rounded-2xl object-cover shadow-md ring-1 ring-sand-300/60 transition-transform duration-300 group-hover:scale-[1.03]"
      draggable={false}
    />
  );
}

export function BmsLogo({ variant = "header", className = "" }: BmsLogoProps) {
  if (variant === "icon") {
    return (
      <div className={`group h-11 w-11 ${className}`}>
        <Emblem size={44} />
      </div>
    );
  }

  if (variant === "sidebar") {
    // Text on the left · emblem fitted to the right
    return (
      <div className={`group flex items-center gap-2.5 ${className}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-navy-900">BMS</span>
            <span className="rounded bg-maroon-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-maroon-700 ring-1 ring-inset ring-maroon-200">
              Enterprise
            </span>
          </div>
          <div className="truncate text-[10px] font-semibold tracking-tight text-navy-600">
            Business Management Solutions
          </div>
          <div className="truncate text-[8.5px] font-bold uppercase tracking-[0.14em] text-maroon-600">
            A BNLV Group of Company
          </div>
        </div>
        <div className="h-14 w-14 shrink-0">
          <Emblem size={56} />
        </div>
      </div>
    );
  }

  if (variant === "hero") {
    // Vertical stack: Massive Emblem on top, minimal Text below
    return (
      <div className={`group flex flex-col items-center justify-center text-center ${className}`}>
        {/* Massive Emblem fitting the frame */}
        <div className="h-64 w-64 shrink-0 sm:h-[28rem] sm:w-[28rem]">
          <Emblem size={448} />
        </div>
        {/* Minimal Text directly below the emblem */}
        <div className="mt-6 flex flex-col items-center">
          <h2 className="text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
            BMS
          </h2>
          <div className="mt-1 text-xs font-semibold tracking-tight text-navy-700 sm:text-sm">
            Business Management Solutions
          </div>
          <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-maroon-600">
            A BNLV Group of Company
          </div>
          <div className="mt-3 h-0.5 w-12 rounded-full bg-gradient-to-r from-maroon-400 via-navy-400 to-jade-500" />
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`group flex items-center gap-3 ${className}`}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-navy-900">BMS Studio</span>
            <span className="text-[10px] font-semibold text-maroon-600">· A BNLV Group of Company</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Business Management Solutions Enterprise Platform
          </div>
        </div>
        <div className="h-12 w-12 shrink-0">
          <Emblem size={48} />
        </div>
      </div>
    );
  }

  // Header (default): written context left · emblem right
  return (
    <div className={`group flex items-center gap-2.5 ${className}`}>
      <div className="hidden text-right sm:block">
        <div className="flex items-center justify-end gap-1.5">
          <span className="rounded-full bg-navy-900 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-sand-50">
            Enterprise
          </span>
          <span className="text-sm font-extrabold tracking-tight text-navy-900 sm:text-base">BMS</span>
        </div>
        <div className="text-[10px] font-semibold leading-tight tracking-tight text-navy-700">
          Business Management Solutions
        </div>
        <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-maroon-600">
          A BNLV Group of Company
        </div>
      </div>
      <div className="h-12 w-12 shrink-0 sm:h-14 sm:w-14">
        <Emblem size={56} />
      </div>
    </div>
  );
}
