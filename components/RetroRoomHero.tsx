'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Eye, Home, Terminal, ArrowRight, User } from 'lucide-react';

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
  style: { top: string; left: string; width: string; height: string };
  walkTarget: { x: number; y: number };
  dialog: string;
  highlightWords: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  gtmEvent: { event: string; zone: string; content_group: string; xp_reward: number };
}

const ROOM_SPRITES: RoomSpriteItem[] = [
  {
    id: 'computer',
    title: 'Analytics Workstation',
    badge: 'PROJECTS & PIPELINES',
    spriteSrc: '/sprite_computer_desk.png',
    hoverSpriteSrc: '/sprite_computer_desk_hover.png',
    style: { top: '11.6%', left: '34.4%', width: '28.0%', height: '28.0%' },
    walkTarget: { x: 48, y: 38 },
    dialog: 'You selected my computer — would you like to explore my',
    highlightWords: 'marketing & product analytics projects, sGTM pipelines, and SQL models?!',
    primaryCta: { label: 'PROJECTS', href: '/projects' },
    secondaryCta: { label: 'BLOGS', href: '/blog' },
    gtmEvent: { event: 'retro_room_interaction', zone: 'workstation_pc', content_group: 'analytics_projects', xp_reward: 50 },
  },
  {
    id: 'library',
    title: 'Bookshelf & Technical Blog',
    badge: 'BLOG & ARTICLES',
    spriteSrc: '/sprite_library_bookshelf.png',
    hoverSpriteSrc: '/sprite_library_bookshelf_hover.png',
    style: { top: '28.3%', left: '81.3%', width: '15.1%', height: '32.5%' },
    walkTarget: { x: 72, y: 48 },
    dialog: 'Welcome to my library! Here you can read my latest posts on',
    highlightWords: 'GA4, Server-Side GTM, AppsFlyer SDK, BigQuery & First-Party Data + AI!',
    primaryCta: { label: 'READ BLOGS', href: '/blog' },
    gtmEvent: { event: 'retro_room_interaction', zone: 'library_bookshelf', content_group: 'technical_blog', xp_reward: 40 },
  },
  {
    id: 'yoga',
    title: 'Yoga & Pilates Corner',
    badge: 'LIFE & BALANCE',
    spriteSrc: '/sprite_ecem_yoga.png',
    hoverSpriteSrc: '/sprite_ecem_yoga_stretch.png',
    style: { top: '63.9%', left: '11.6%', width: '31.8%', height: '26.5%' },
    walkTarget: { x: 34, y: 62 },
    dialog: 'When I am not debugging tracking specs or SQL queries, you will find me here doing',
    highlightWords: 'pilates & yoga flows, baking sourdough bread, or running by the coast!',
    primaryCta: { label: 'ABOUT ECEM', href: '#about' },
    gtmEvent: { event: 'retro_room_interaction', zone: 'yoga_pilates_mat', content_group: 'about_me', xp_reward: 35 },
  },
  {
    id: 'arcade',
    title: 'Retro Arcade Machine',
    badge: 'TOOLS & EXPERIMENTS',
    spriteSrc: '/sprite_arcade_cabinet.png',
    hoverSpriteSrc: '/sprite_arcade_cabinet_hover.png',
    style: { top: '35.9%', left: '1.8%', width: '11.8%', height: '31.0%' },
    walkTarget: { x: 20, y: 50 },
    dialog: 'Player 1 Ready! You found my arcade cabinet — check out my interactive',
    highlightWords: 'Data Layer & Tracking Spec generators, SEO/UTM checklists, and experiments!',
    primaryCta: { label: 'EXPLORE TOOLS', href: '/projects' },
    gtmEvent: { event: 'retro_room_interaction', zone: 'arcade_cabinet', content_group: 'interactive_tools', xp_reward: 60 },
  },
  {
    id: 'tv_console',
    title: 'Retro TV & Console',
    badge: 'RETRO GAMING',
    spriteSrc: '/sprite_retro_tv_console.png',
    hoverSpriteSrc: '/sprite_retro_tv_console_hover.png',
    style: { top: '29.8%', left: '13.9%', width: '15.9%', height: '25.7%' },
    walkTarget: { x: 28, y: 46 },
    dialog: 'A classic CRT monitor hooked up to a retro console! Perfect for a quick round of',
    highlightWords: '8-bit tank battles and debugging custom mobile attribution events!',
    primaryCta: { label: 'VIEW POSTS', href: '/blog' },
    gtmEvent: { event: 'retro_room_interaction', zone: 'retro_tv_console', content_group: 'easter_egg', xp_reward: 25 },
  },
  {
    id: 'coffee_notes',
    title: 'Tracking Specs & Brew',
    badge: 'DOCS & GUIDES',
    spriteSrc: '/sprite_coffee_notes.png',
    hoverSpriteSrc: '/sprite_coffee_notes_hover.png',
    style: { top: '37.4%', left: '66.2%', width: '15.6%', height: '16.6%' },
    walkTarget: { x: 60, y: 48 },
    dialog: 'Fresh coffee and handwritten measurement plans! Dive into my step-by-step',
    highlightWords: 'GTM update breakdowns, UTM auto-tagging tables, and currency import guides!',
    primaryCta: { label: 'OPEN GUIDES', href: '/blog' },
    gtmEvent: { event: 'retro_room_interaction', zone: 'coffee_and_specs', content_group: 'guides_checklists', xp_reward: 30 },
  },
  {
    id: 'bed',
    title: 'Cozy Rest Zone',
    badge: 'RECHARGE',
    spriteSrc: '/sprite_bed.png',
    hoverSpriteSrc: '/sprite_bed_hover.png',
    style: { top: '60.1%', left: '47.2%', width: '35.6%', height: '28.8%' },
    walkTarget: { x: 52, y: 58 },
    dialog: 'Even data pipelines need scheduled downtime! Recharge your HP before exploring more',
    highlightWords: 'analytics articles, server-side setups, and product measurement case studies.',
    primaryCta: { label: 'ALL CONTENT', href: '/blog' },
    gtmEvent: { event: 'retro_room_interaction', zone: 'rest_zone_bed', content_group: 'recharge_hp', xp_reward: 20 },
  },
];

export default function RetroRoomHero() {
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

  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => () => { void audioRef.current?.close(); }, []);

  const playSfx = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const context = audioRef.current ?? new AudioContext();
      audioRef.current = context;
      void context.resume().then(() => {
        if (context.state !== 'running') return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.setValueAtTime(660, now + 0.06);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.13);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      }).catch(() => {});
    } catch {
      // Room navigation remains available if the browser blocks audio.
    }
  }, [soundEnabled]);

  const activeItem = ROOM_SPRITES.find((item) => item.id === (hoveredId || selectedId)) || ROOM_SPRITES[0];

  const triggerAnalyticsEvent = useCallback((item: RoomSpriteItem, actionType: 'hover' | 'click') => {
    const payload = {
      event: item.gtmEvent.event,
      action_type: actionType,
      zone_id: item.gtmEvent.zone,
      content_group: item.gtmEvent.content_group,
      xp_earned: actionType === 'click' ? item.gtmEvent.xp_reward : 5,
      timestamp: new Date().toISOString(),
    };
    if (actionType === 'click') playSfx();
    setLastPayload(payload);
    setXp((prev) => prev + (actionType === 'click' ? item.gtmEvent.xp_reward : 5));

    if (typeof window !== 'undefined') {
      const win = window as unknown as { dataLayer?: Record<string, unknown>[] };
      win.dataLayer = win.dataLayer || [];
      win.dataLayer.push(payload);
    }
  }, [playSfx]);

  const handleRoomKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
    const key = e.key.toLowerCase();
    const direction = ['arrowright', 'arrowdown', 'd', 's'].includes(key)
      ? 1
      : ['arrowleft', 'arrowup', 'a', 'w'].includes(key) ? -1 : 0;
    if (!direction) return;
    e.preventDefault();
    setHoveredId(null);
    const index = ROOM_SPRITES.findIndex((item) => item.id === selectedId);
    const item = ROOM_SPRITES[(index + direction + ROOM_SPRITES.length) % ROOM_SPRITES.length];
    setSelectedId(item.id);
    triggerAnalyticsEvent(item, 'click');
  };

  return (
    <section className="relative w-full bg-[#0b0d1e] text-slate-100 overflow-hidden px-4 py-6 md:px-10 md:py-8 flex flex-col justify-between select-none border-b-4 border-slate-800/80">
      <link rel="preload" as="image" href="/sprite_ecem_yoga_stretch.png" />
      <div className="max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3 bg-[#131731] border-2 border-[#6495ed] px-3.5 py-1.5 shadow-[4px_4px_0_#000]">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs md:text-sm tracking-wider text-blue-200 font-bold">PLAYER: ECEM</span>
          <span className="text-xs font-mono bg-blue-950/90 border border-blue-500/50 text-amber-300 px-2 py-0.5">XP: {xp}</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedId('computer')} title="Reset Room Focus" className="bg-[#7aa2e3] hover:bg-[#93b5ec] text-[#0b0d1e] p-2 border-2 border-[#0b0d1e] shadow-[3px_3px_0_#000]">
            <Home className="w-4 h-4" />
          </button>
          <button onClick={() => setShowDataLayer((v) => !v)} title="Toggle Live dataLayer" aria-pressed={showDataLayer} className={`p-2 border-2 border-[#0b0d1e] shadow-[3px_3px_0_#000] ${showDataLayer ? 'bg-amber-300 text-[#0b0d1e]' : 'bg-[#7aa2e3] text-[#0b0d1e]'}`}>
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => setSoundEnabled((v) => !v)} title="Toggle SFX" aria-pressed={soundEnabled} className="bg-[#7aa2e3] hover:bg-[#93b5ec] text-[#0b0d1e] p-2 border-2 border-[#0b0d1e] shadow-[3px_3px_0_#000]">
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={() => setCharacterMode((m) => (m === 'yoga' ? 'walk' : 'yoga'))} className="bg-[#7aa2e3] hover:bg-[#93b5ec] text-[#0b0d1e] px-3 py-1.5 font-mono text-xs font-bold border-2 border-[#0b0d1e] shadow-[3px_3px_0_#000] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {characterMode === 'yoga' ? 'POSE: YOGA' : 'POSE: WALK'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        <div className="lg:col-span-6 min-w-0 flex flex-col justify-between space-y-6 z-10">
          <div className="relative flex flex-col sm:flex-row items-start sm:items-end gap-6 sm:gap-4 pt-4">
            <motion.div whileHover={{ scale: 1.03 }} className="w-40 sm:w-48 md:w-56 shrink-0 relative z-20">
              <Image unoptimized width={310} height={333} src="/ecem_avatar_portrait.png" alt="Ecem Portrait" className="w-full h-auto [image-rendering:pixelated] drop-shadow-[6px_6px_0_#000]" />
            </motion.div>

            <div className="min-w-0 w-full bg-[#090b16]/95 border-2 border-[#5b7db1] p-5 shadow-[8px_8px_0_#000] relative z-10">
              <div className="absolute -top-4 left-4 bg-[#6390c8] text-[#090b16] font-mono font-extrabold text-sm px-4 py-0.5 border-2 border-[#090b16] shadow-[3px_3px_0_#000]">
                Ecem
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-between mb-2 mt-1">
                <span className="text-[11px] font-mono uppercase tracking-widest text-blue-300/90 bg-blue-950/70 px-2 py-0.5 border border-blue-800">{activeItem.badge}</span>
                <span className="text-[11px] font-mono text-slate-400">[WASD / Arrows or Click]</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.p key={activeItem.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }} className="font-mono text-sm sm:text-base leading-relaxed text-slate-100 min-h-[4.5rem]">
                  {activeItem.dialog} <span className="text-amber-300 font-bold">{activeItem.highlightWords}</span>
                </motion.p>
              </AnimatePresence>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link href={activeItem.primaryCta.href} className="bg-[#5c87bf] hover:bg-[#749ed3] text-white font-mono text-xs sm:text-sm font-bold px-5 py-2.5 border-2 border-[#090b16] shadow-[4px_4px_0_#000] flex items-center gap-2">
                  {activeItem.primaryCta.label} <ArrowRight className="w-4 h-4" />
                </Link>
                {activeItem.secondaryCta && (
                  <Link href={activeItem.secondaryCta.href} className="bg-[#3d315b] hover:bg-[#514277] text-slate-200 font-mono text-xs sm:text-sm font-bold px-5 py-2.5 border-2 border-[#090b16] shadow-[4px_4px_0_#000]">
                    {activeItem.secondaryCta.label}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showDataLayer && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-[#070913] border-2 border-slate-800 p-3.5 shadow-[6px_6px_0_#000] font-mono text-xs">
                <div className="flex flex-wrap gap-2 items-center justify-between text-slate-400 pb-2 mb-2 border-b border-slate-800/80">
                  <span className="flex items-center gap-1.5 text-blue-300 font-bold">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" /> window.dataLayer.push() — LIVE STREAM
                  </span>
                  <span className="text-emerald-400 text-[11px]">● GTM READY</span>
                </div>
                <pre className="text-emerald-300 overflow-x-auto leading-relaxed">{JSON.stringify(lastPayload, null, 2)}</pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-6 min-w-0 flex flex-col items-center justify-center">
          <div onKeyDown={handleRoomKeyDown} role="group" aria-label="Interactive retro room. Use arrow keys or WASD to explore." className="relative w-full max-w-[540px] aspect-square">
            <Image unoptimized fill src="/room_base.png" alt="Ecem Room" className="w-full h-full object-contain [image-rendering:pixelated] drop-shadow-[0_14px_30px_rgba(0,0,0,0.85)]" />
            {ROOM_SPRITES.map((item) => {
              const isSelected = selectedId === item.id;
              const isHovered = hoveredId === item.id;
              const isActive = isSelected || isHovered;
              const showHoverSprite = item.id === 'yoga' ? isHovered : isActive;
              return (
                <motion.button key={item.id} type="button" style={item.style} onMouseEnter={() => { setHoveredId(item.id); triggerAnalyticsEvent(item, 'hover'); }} onMouseLeave={() => setHoveredId(null)} onClick={() => { setSelectedId(item.id); triggerAnalyticsEvent(item, 'click'); }} whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.96 }} animate={item.id === 'yoga' ? { y: [0, -2.5, 0] } : { y: isSelected ? -2 : 0 }} transition={item.id === 'yoga' ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { type: 'spring', stiffness: 300, damping: 20 }} className="absolute group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 z-10 cursor-pointer" aria-label={item.title} aria-pressed={isSelected} onFocus={() => setHoveredId(item.id)} onBlur={() => setHoveredId(null)}>
                  <Image unoptimized fill src={showHoverSprite ? item.hoverSpriteSrc : item.spriteSrc} alt={item.title} className={`w-full h-full object-contain [image-rendering:pixelated] transition-all duration-150 ${isActive ? 'drop-shadow-[0_0_10px_rgba(254,249,195,0.85)] opacity-100' : 'opacity-95'}`} />
                  <AnimatePresence>
                    {isActive && (
                      <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#090b16] text-amber-300 border border-[#7aa2e3] px-2 py-0.5 font-mono text-[10px] font-bold shadow-[2px_2px_0_#000] pointer-events-none z-30">
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
            <AnimatePresence>
              {characterMode === 'walk' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, left: `${activeItem.walkTarget.x}%`, top: `${activeItem.walkTarget.y}%` }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} style={{ width: '13%', height: '13%' }} className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
                  <Image unoptimized fill src="/sprite_ecem_standing_hover.png" alt="Ecem Walking" className="w-full h-full object-contain [image-rendering:pixelated] drop-shadow-[0_6px_8px_rgba(0,0,0,0.8)] animate-bounce" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-3 font-mono text-xs text-slate-400 text-center">
            ✨ Hover or click on the <span className="text-blue-300">Computer</span>, <span className="text-blue-300">Library</span>, <span className="text-pink-300">Yoga Ecem</span>, or <span className="text-amber-300">Arcade</span> sprites!
          </p>
        </div>
      </div>
    </section>
  );
}
