# DESIGN.md: Zynk Design Direction & System Specification

> **Design Read:**
> Personal bio link and showcase platform for creators, engineers, and independent builders, crafted in a warm modern editorial style with tactile precision.
> **Dials:** ENERGY 2 / RHYTHM 2 / MOTION 1

---

## 1. Identity & Soul

Zynk is not another bloated, frosted-glass AI template with glowing purple mesh gradients and floating blobs.
Zynk is a high-speed, typography-driven, and tactile personal bio link space. It treats links, projects, and personal profiles with the dignity of an editorial publication: clear hierarchy, honest surfaces, purposeful contrast, and effortless utility.

- **Focal Point:** The person's identity and their curated links. The interface steps back and lets content lead.
- **Character:** Sharp, confident, editorial, tactile, human.
- **Soul Motif:** A crisp structural hairline frame with deliberate color accents and clean typographic hierarchy.

---

## 2. Dial Configuration

| Dial | Level | Implementation in Zynk |
| :--- | :---: | :--- |
| **ENERGY** | **2 (Balanced)** | Confident and clean. No generic rainbow mesh gradients or full-page glows. High-contrast typography paired with one deliberate, punchy accent color. |
| **RHYTHM** | **2 (Structured)** | Sections and link groups have distinct, intentional breathing room. The visual weight transitions naturally from the profile header down through grouped sections and secondary utilities. |
| **MOTION** | **1 (Calm)** | Fast, purposeful micro-interactions (150ms transitions, subtle tactile press states). No gratuitous floating blobs, pulsing orbs, or disorienting ambient movement. Respects `prefers-reduced-motion`. |

---

## 3. Color & Contrast System (WCAG AA Certified)

All text pairings are strictly audited to satisfy WCAG AA minimum contrast standards (>= 4.5:1 for normal text, >= 3.0:1 for large text).

### Neutral Foundation

| Token | Light Mode Hex | Dark Mode Hex | Usage | Contrast Ratio |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas** | `#faf9f6` (Warm paper) | `#0c0d10` (Deep obsidian) | Page background | Base |
| **Surface** | `#ffffff` (Crisp white) | `#14171d` (Solid slate) | Cards, modals, containers | Elevated base |
| **Surface Hover** | `#f4f3ef` | `#1c2028` | Hover / interactive surface | Interactive |
| **Text Primary** | `#18181b` (Zinc 900) | `#f4f4f5` (Zinc 100) | Headings, titles, labels | > 15:1 (Pass AA & AAA) |
| **Text Secondary** | `#52525b` (Zinc 600) | `#a1a1aa` (Zinc 400) | Descriptions, handles, meta | >= 5.8:1 (Pass AA) |
| **Text Muted** | `#71717a` (Zinc 500) | `#8b8fa0` | Secondary metadata, dates | >= 4.6:1 (Pass AA) |
| **Border Subdued** | `#e4e4e7` (Zinc 200) | `#27272a` (Zinc 800) | Structural dividing lines | 3:1 non-text boundary |
| **Border Active** | `var(--accent-color)` | `var(--accent-color)` | Focused / active items | High visibility |

### Curated Accent Palette (Strict Single Accent Rule)

Only **one** accent color is active at a time. The accent is applied solely to primary actions, active pills, and focus indicators.

- **Cobalt (Default):** `#2563eb` (Light hover: `#1d4ed8`, Dark hover: `#3b82f6`)
- **Teal / Cyan:** `#0d9488` (Light hover: `#0f766e`, Dark hover: `#14b8a6`)
- **Violet:** `#7c3aed` (Light hover: `#6d28d9`, Dark hover: `#8b5cf6`)
- **Emerald:** `#059669` (Light hover: `#047857`, Dark hover: `#10b981`)
- **Rose:** `#e11d48` (Light hover: `#be123c`, Dark hover: `#f43f5e`)
- **Amber:** `#d97706` (Light hover: `#b45309`, Dark hover: `#f59e0b`)

---

## 4. Typography Hierarchy

- **Font Family:** `Inter`, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Headlines (H1):** `font-extrabold text-2xl md:text-3xl tracking-tight leading-snug`.
- **Section Headers (H2):** `font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400`.
- **Card Titles (H3):** `font-bold text-sm md:text-base leading-snug text-zinc-900 dark:text-zinc-100`.
- **Body & Bio:** `font-normal text-xs md:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300`.
- **Numbers & Analytics:** `font-mono tabular-nums font-bold`.

---

## 5. Component & Surface Architecture

### Cards & Sections
- Solid tactile surface with crisp 1px borders (`border border-zinc-200/90 dark:border-zinc-800`).
- Subtle 1-step elevation on hover: `hover:-translate-y-0.5 hover:shadow-md hover:border-accent transition-all duration-150`.
- Tap state: `active:translate-y-0 active:scale-[0.99]`.

### Navigation Bar
- Single subtle backdrop layer: `bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800`.
- Does not compete with page content; maintains clear landmark structure.

### Buttons & Tap Targets
- Minimum touch target: `44px x 44px` on all mobile devices.
- Explicit keyboard focus ring: `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent outline-none`.
- Cursor pointer explicitly defined on all interactive controls (`button`, `a[href]`, `input[type="checkbox"]`, `select`).

### Modals & Dialogs
- Background backdrop: `bg-zinc-950/60 backdrop-blur-sm`.
- Card container: Solid elevated container with clear title, distinct primary/secondary action buttons, and `Escape` keyboard dismissal.

---

## 6. Copywriting & Content Rules

- **Zero Em Dashes:** Forbidden to use em dashes in UI copy, titles, or descriptions. Use commas, colons, or parentheses.
- **No AI Buzzwords:** Remove "Platform Generasi Baru", "AI-Powered", "Seamless", "Revolutionary". Speak like a thoughtful human engineer.
- **Honest Labels:** CTAs state the exact action ("Klaim Username", "Buka Tautan", "Simpan Perubahan", "Salin Link").

---

## 7. Responsive Architecture

- Mobile-first reflow: single centered column with comfortable padding (`px-4 py-6`).
- No horizontal overflow on any viewport (`max-w-full overflow-x-hidden`).
- Live preview mockup in dashboard maintains proportion on desktop and collapses gracefully beneath the form on narrow screens.
