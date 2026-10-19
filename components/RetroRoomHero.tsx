'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Eye, Home, Sparkles, Terminal, ArrowRight, Play, User } from 'lucide-react';

export type HotspotId =
  | 'computer'
  | 'library'
  | 'arcade'
  | 'yoga'
  | 'tv_console'
  | 'coffee_notes'
  | 'bed';

interface RoomSpriteItem {
  id: HotspotId;
  title: string;
  badge: string;
  spriteSrc: string;
  hoverSpriteSrc: string;
  style: {
    top: string;
    left: string;
    width: string;
    height: string;
  };
  walkTarget: { x: number; y: number };
  dialog: string;
  highlightWords: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  gtmEvent: {
    event: string;
    zone: string;
    content_group: string;
    xp_reward: number;
  };
}

const ROOM_SPRITES: RoomSpriteItem[] = [
  {
    id: 'computer',
    title: 'Analytics Workstation',
    badge: 'PROJECTS & PIPELINES',
    spriteSrc: '/sprites/sprite_computer_desk.png',
    hoverSpriteSrc: '/sprites/sprite_computer_desk_hover.png',
    style: { top: '11.6%', left: '34.4%', width: '28.0%', height: '28.0%' },
    walkTarget: { x: 48, y: 38 },
    dialog: 'You selected my computer — would you like to explore my',
    highlightWords: 'marketing & product analytics projects, sGTM pipelines, and SQL models?!',
    primaryCta: { label: 'PROJECTS', href: '/projects' },
    secondaryCta: { label: 'BLOGS', href: '/blog' },
    gtmEvent: {
      event: 'retro_room_interaction',
      zone: 'workstation_pc',
      content_group: 'analytics_projects',
      xp_reward: 50,
    },
  },
  {
    id: 'library',
    title: 'Bookshelf & Technical Blog',
    badge: 'BLOG & ARTICLES',
    spriteSrc: '/sprites/sprite_library_bookshelf.png',
    hoverSpriteSrc: '/sprites/sprite_library_bookshelf_hover.png',
    style: { top: '28.3%', left: '81.3%', width: '15.1%', height: '32.5%' },
    walkTarget: { x: 72, y: 48 },
    dialog: 'Welcome to my library! Here you can read my latest posts on',
    highlightWords: 'GA4, Server-Side GTM, AppsFlyer SDK, BigQuery & First-Party Data + AI!',
    primaryCta: { label: 'READ BLOGS', href: '/blog' },
    gtmEvent: {
      event: 'retro_room_interaction',
      zone: 'library_bookshelf',
      content_group: 'technical_blog',
      xp_reward: 40,
    },
  },
  {
    id: 'yoga',
    title: 'Yoga & Pilates Corner',
    badge: 'LIFE & BALANCE',
    spriteSrc: '/sprites/sprite_ecem_yoga.png',
    hoverSpriteSrc: '/sprites/sprite_ecem_yoga_hover.png',
    style: { top: '63.9%', left: '11.6%', width: '31.8%', height: '26.5%' },
    walkTarget: { x: 34, y: 62 },
    dialog: 'When I am not debugging tracking specs or SQL queries, you will find me here doing',
    highlightWords: 'pilates & yoga flows, baking sourdough bread, or running by the coast!',
    primaryCta: { label: 'ABOUT ECEM', href: '/about' },
    gtmEvent: {
      event: 'retro_room_interaction',
      zone: 'yoga_pilates_mat',
      content_group: 'about_me',
      xp_reward: 35,
    },
  },
  {
    id: 'arcade',
    title: 'Retro Arcade Machine',
    badge: 'TOOLS & EXPERIMENTS',
    spriteSrc: '/sprites/sprite_arcade_cabinet.png',
    hoverSpriteSrc: '/sprites/sprite_arcade_cabinet_hover.png',
    style: { top: '35.9%', left: '1.8%', width: '11.8%', height: '31.0%' },
    walkTarget: { x: 20, y: 50 },
    dialog: 'Player 1 Ready! You found my arcade cabinet — check out my interactive',
    highlightWords: 'Data Layer & Tracking Spec generators, SEO/UTM checklists, and experiments!',
    primaryCta: { label: 'EXPLORE TOOLS', href: '/projects' },
    gtmEvent: {
      event: 'retro_room_interaction',
      zone: 'arcade_cabinet',
      content_group: 'interactive_tools',
      xp_reward: 60,
    },
  },
  {
    id: 'tv_console',
    title: 'Retro TV & Console',
    badge: 'RETRO GAMING',
    spriteSrc: '/sprites/sprite_retro_tv_console.png',
    hoverSpriteSrc: '/sprites/sprite_retro_tv_console_hover.png',
    style: { top: '29.8%', left: '13.9%', width: '15.9%', height: '25.7%' },
    walkTarget: { x: 28, y: 46 },
    dialog: 'A classic CRT monitor hooked up to a retro console! Perfect for a quick round of',
    highlightWords: '8-bit tank battles and debugging custom mobile attribution events!',
    primaryCta: { label: 'VIEW POSTS', href: '/blog' },
    gtmEvent: {
      event: 'retro_room_interaction',
      zone: 'retro_tv_console',
      content_group: 'easter_egg',
      xp_reward: 25,
    },
  },
  {
    id: 'coffee_notes',
    title: 'Tracking Specs & Brew',
    badge: 'DOCS & GUIDES',
    spriteSrc: '/sprites/sprite_coffee_notes.png',
    hoverSpriteSrc: '/sprites/sprite_coffee_notes_hover.png',
    style: { top: '37.4%', left: '66.2%', width: '15.6%', height: '16.6%' },
    walkTarget: { x: 60, y: 48 },
    dialog: 'Fresh coffee and handwritten measurement plans! Dive into my step-by-step',
    highlightWords: 'GTM update breakdowns, UTM auto-tagging tables, and currency import guides!',
    primaryCta: { label: 'OPEN GUIDES', href: '/blog' },
    gtmEvent: {
      event: 'retro_room_interaction',
      zone: 'coffee_and_specs',
      content_group: 'guides_checklists',
      xp_reward: 30,
    },
  },
  {
    id: 'bed',
    title: 'Cozy Rest Zone',
    badge: 'RECHARGE',
    spriteSrc: '/sprites/sprite_bed.png',
    hoverSpriteSrc: '/sprites/sprite_bed_hover.png',
    style: { top: '60.1%', left: '47.2%', width: '35.6%', height: '28.8%' },
    walkTarget: { x: 52, y: 58 },
    dialog: 'Even data pipelines need scheduled downtime! Recharge your HP before exploring more',
    highlightWords: 'analytics articles, server-side setups, and product measurement case studies.',
    primaryCta: { label: 'ALL CONTENT', href: '/blog' },
    gtmEvent: {
      event: 'retro_room_interaction',
      zone: 'rest_zone_bed',
      content_group: 'recharge_hp',
      xp_reward: 20,
    },
  },
];

export default function RetroRoomHero({
  onSwitchToClassic,
}: {
  onSwitchToClassic?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<HotspotId>('computer');
  const [hoveredId, setHoveredId] = useState<HotspotId | null>(null);
  const [xp, setXp] = useState<number>(420);
  const [characterMode, setCharacterMode] = useState<'yoga' | 'walk'>('yoga');
  const [showDataLayer, setShowDataLayer] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [lastPayload, setLastPayload] = useState<Record<string, unknown>>({
    event: 'retro_room_loaded',
    player: 'ecem',
    character_pose: 'cobra_yoga_stretch',
    active_zone: 'workstation_pc',
  });

  const activeItem =
    ROOM_SPRITES.find((item) => item.id === (hoveredId || selectedId)) ||
    ROOM_SPRITES[0];

  const triggerAnalyticsEvent = useCallback(
    (item: RoomSpriteItem, actionType: 'hover' | 'click') => {
      const payload = {
        event: item.gtmEvent.event,
        action_type: actionType,
        zone_id: item.gtmEvent.zone,
        content_group: item.gtmEvent.content_group,
        xp_earned: actionType === 'click' ? item.gtmEvent.xp_reward : 10,
        timestamp: new Date().toISOString(),
      };

      setLastPayload(payload);
      setXp((prev) => prev + (actionType === 'click' ? item.gtmEvent.xp_reward : 5));

      if (typeof window !== 'undefined') {
        const win = window as unknown as { dataLayer?: Record<string, unknown>[] };
        win.dataLayer = win.dataLayer || [];
        win.dataLayer.push(payload);
      }
    },
    []
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'd', 's'].includes(e.key)) {
        e.preventDefault();
        const idx = ROOM_SPRITES.findIndex((i) => i.id === selectedId);
        const nextItem = ROOM_SPRITES[(idx + 1) % ROOM_SPRITES.length];
        setSelectedId(nextItem.id);
        triggerAnalyticsEvent(nextItem, 'click');
      } else if (['ArrowLeft', 'ArrowUp', 'a', 'w'].includes(e.key)) {
        e.preventDefault();
        const idx = ROOM_SPRITES.findIndex((i) => i.id === selectedId);
        const prevItem =
          ROOM_SPRITES[(idx - 1 + ROOM_SPRITES.length) % ROOM_SPRITES.length];
        setSelectedId(prevItem.id);
        triggerAnalyticsEvent(prevItem, 'click');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, triggerAnalyticsEvent]);

  return (
    <section className="relative min-h-[88vh] w-full bg-[#0b0d1e] text-slate-100 overflow-hidden px-4 py-6 md:px-10 md:py-8 flex flex-col justify-between select-none">
      <div className="max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3 bg-[#131731] border-2 border-[#6495ed] px-3.5 py-1.5 shadow-[4px_4px_0_#000]">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs md:text-sm tracking-wider text-blue-200 font-bold">
            PLAYER: ECEM
          </span>
          <span className="text-xs font-mono bg-blue-950/90 border border-blue-500/50 text-amber-300 px-2 py-0.5">
            XP: {xp}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedId('computer')}
            title="Reset Room Focus"
            className="bg-[#7aa2e3] hover:bg-[#93b5ec] text-[#0b0d1e] p-2 border-2 border-[#0b0d1e] shadow-[3px_3px_0_#000] transition active:translate-y-0.5"
          >
            <Home className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDataLayer((v) => !v)}
            title="Toggle Live dataLayer Inspector"
            className={`p-2 border-2 border-[#0b0d1e] shadow-[3px_3px_0_#000] transition active:translate-y-0.5 ${
              showDataLayer ? 'bg-amber-300 text-[#0b0d1e]' : 'bg-[#7aa2e3] text-[#0b0d1e]'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            title="Toggle Retro SFX"
            className="bg-[#7aa2e3] hover:bg-[#93b5ec] text-[#0b0d1e] p-2 border-2 border-[#0b0d1e] shadow-[3px_3px_0_#000] transition active:translate-y-0.5"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() =>
              setCharacterMode((m) => (m === 'yoga' ? 'walk' : 'yoga'))
            }
            title="Switch Ecem Pose (Yoga Mat vs Walking Sprite)"
            className="bg-[#7aa2e3] hover:bg-[#93b5ec] text-[#0b0d1e] px-3 py-1.5 font-mono text-xs font-bold border-2 border-[#0b0d1e] shadow-[3px_3px_0_#000] flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            {characterMode === 'yoga' ? 'POSE: YOGA' : 'POSE: WALK'}
          </button>
          {onSwitchToClassic && (
            <button
              onClick={onSwitchToClassic}
              className="ml-2 bg-[#1c2242] hover:bg-[#28315e] text-blue-200 border-2 border-[#7aa2e3] px-3 py-1.5 font-mono text-xs font-bold shadow-[3px_3px_0_#000]"
            >
              CLASSIC VIEW
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-4">
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6 z-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-64 sm:w-80 md:w-96"
          >
            <img
              src="/sprites/ecem_fyi_logo.png"
              alt="Ecem.fyi"
              className="w-full h-auto object-contain [image-rendering:pixelated] drop-shadow-[0_0_18px_rgba(96,165,250,0.45)]"
            />
          </motion.div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-end gap-0 sm:gap-4 pt-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="w-40 sm:w-48 md:w-56 shrink-0 relative z-20 -mb-2 sm:mb-0"
            >
              <img
                src="/sprites/ecem_avatar_portrait.png"
                alt="Ecem Pixel Portrait"
                className="w-full h-auto [image-rendering:pixelated] drop-shadow-[6px_6px_0_#000]"
              />
            </motion.div>

            <div className="w-full bg-[#090b16]/95 border-2 border-[#5b7db1] p-5 shadow-[8px_8px_0_#000] relative z-10">
              <div className="
                absolute -top-4 left-4 bg-[#6390c8] text-[#090b16]
                font-mono font-extrabold text-sm px-4 py-0.5
                border-2 border-[#090b16] shadow-[3px_3px_0_#000]
              ">
                Ecem
              </div>

              <div className="flex items-center justify-between mb-2 mt-1">
                <span className="text-[11px] font-mono uppercase tracking-widest text-blue-300/90 bg-blue-950/70 px-2 py-0.5 border border-blue-800">
                  {activeItem.badge}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  [WASD / Arrows or Click]
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={activeItem.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                  className="font-mono text-sm sm:text-base leading-relaxed text-slate-100 min-h-[4.5rem]"
                >
                  {activeItem.dialog}{' '}
                  <span className="text-amber-300 font-bold">
                    {activeItem.highlightWords}
                  </span>
                </motion.p>
              </AnimatePresence>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={activeItem.primaryCta.href}
                  className="bg-[#5c87bf] hover:bg-[#749ed3] text-white font-mono text-xs sm:text-sm font-bold px-5 py-2.5 border-2 border-[#090b16] shadow-[4px_4px_0_#000] transition active:translate-y-0.5 flex items-center gap-2"
                >
                  {activeItem.primaryCta.label}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {activeItem.secondaryCta && (
                  <Link
                    href={activeItem.secondaryCta.href}
                    className="bg-[#3d315b] hover:bg-[#514277] text-slate-200 font-mono text-xs sm:text-sm font-bold px-5 py-2.5 border-2 border-[#090b16] shadow-[4px_4px_0_#000] transition active:translate-y-0.5"
                  >
                    {activeItem.secondaryCta.label}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showDataLayer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#070913] border-2 border-slate-800 p-3.5 shadow-[6px_6px_0_#000] font-mono text-xs"
              >
                <div className="flex items-center justify-between text-slate-400 pb-2 mb-2 border-b border-slate-800/80">
                  <span className="flex items-center gap-1.5 text-blue-300 font-bold">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    window.dataLayer.push() — LIVE STREAM
                  </span>
                  <span className="text-emerald-400 text-[11px]">● GTM READY</span>
                </div>
                <pre className="text-emerald-300 overflow-x-auto leading-relaxed">
                  {JSON.stringify(lastPayload, null, 2)}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[540px] aspect-square">
            <img
              src="/sprites/room_base.png"
              alt="Ecem.fyi Pixel Room"
              className="w-full h-full object-contain [image-rendering:pixelated] drop-shadow-[0_14px_30px_rgba(0,0,0,0.85)]"
            />

            {ROOM_SPRITES.map((item) => {
              const isSelected = selectedId === item.id;
              const isHovered = hoveredId === item.id;
              const isActive = isSelected || isHovered;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  style={item.style}
                  onMouseEnter={() => {
                    setHoveredId(item.id);
                    triggerAnalyticsEvent(item, 'hover');
                  }}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => {
                    setSelectedId(item.id);
                    triggerAnalyticsEvent(item, 'click');
                  }}
                  whileHover={{ scale: 1.06, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  animate={
                    item.id === 'yoga'
                      ? {
                          y: [0, -2.5, 0],
                        }
                      : {
                          y: isSelected ? -2 : 0,
                        }
                  }
                  transition={
                    item.id === 'yoga'
                      ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
                      : { type: 'spring', stiffness: 300, damping: 20 }
                  }
                  className="absolute group focus:outline-none z-10 cursor-pointer"
                  aria-label={item.title}
                >
                  <img
                    src={isActive ? item.hoverSpriteSrc : item.spriteSrc}
                    alt={item.title}
                    className={`w-full h-full object-contain [image-rendering:pixelated] transition-all duration-150 ${
                      isActive
                        ? 'drop-shadow-[0_0_10px_rgba(254,249,195,0.85)] opacity-100'
                        : 'opacity-95'
                    }`}
                  />

                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#090b16] text-amber-300 border border-[#7aa2e3] px-2 py-0.5 font-mono text-[10px] font-bold shadow-[2px_2px_0_#000] pointer-events-none z-30"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}

            <AnimatePresence>
              {characterMode === 'walk' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    left: `${activeItem.walkTarget.x}%`,
                    top: `${activeItem.walkTarget.y}%`,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                  style={{ width: '13%', height: '13%' }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
                >
                  <img
                    src="/sprites/sprite_ecem_standing_hover.png"
                    alt="Walking Ecem Sprite"
                    className="w-full h-full object-contain [image-rendering:pixelated] drop-shadow-[0_6px_8px_rgba(0,0,0,0.8)] animate-bounce"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-3 font-mono text-xs text-slate-400 text-center">
            ✨ Hover or click on the <span className="text-blue-300">Computer</span>,{' '}
            <span className="text-blue-300">Library</span>,{' '}
            <span className="text-pink-300">Yoga Ecem</span>, or{' '}
            <span className="text-amber-300">Arcade</span> sprites!
          </p>
        </div>
      </div>
    </section>
  );
}
