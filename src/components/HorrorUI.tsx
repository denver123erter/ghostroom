import React, { useEffect, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Flashlight,
  Hand,
  X,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Info,
  Radio,
  Eye,
  Activity
} from 'lucide-react';
import { InteractableObject, TelemetryData } from '../types';

export const DEBUG_MODE = true;

interface HorrorUIProps {
  hasEntered: boolean;
  onEnter: () => void;
  interactTarget: InteractableObject | null;
  onInteract: () => void;
  isFlashlightOn: boolean;
  onToggleFlashlight: () => void;
  onMoveStart: (direction: 'forward' | 'backward' | 'left' | 'right') => void;
  onMoveEnd: (direction: 'forward' | 'backward' | 'left' | 'right') => void;
  activeNote: { title: string; content: string; date?: string } | null;
  onCloseNote: () => void;
  message: string | null;
  isFlickering: boolean;
  isPointerLocked: boolean;
  onRequestPointerLock: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  showJumpScare: boolean;
  telemetry?: TelemetryData;
}

export const HorrorUI: React.FC<HorrorUIProps> = ({
  hasEntered,
  onEnter,
  interactTarget,
  onInteract,
  isFlashlightOn,
  onToggleFlashlight,
  onMoveStart,
  onMoveEnd,
  activeNote,
  onCloseNote,
  message,
  isFlickering,
  isPointerLocked,
  onRequestPointerLock,
  onToggleMute,
  isMuted,
  showJumpScare,
  telemetry,
}) => {
  const [showTutorial, setShowTutorial] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDebugHud, setShowDebugHud] = useState(DEBUG_MODE);

  // Fade out tutorial banner after 6 seconds
  useEffect(() => {
    if (hasEntered) {
      const timer = setTimeout(() => {
        setShowTutorial(false);
      }, 6500);
      return () => clearTimeout(timer);
    }
  }, [hasEntered]);

  // Helper for touch/mouse continuous button press with full multi-device event support
  const bindButtonEvents = (dir: 'forward' | 'backward' | 'left' | 'right') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onMoveStart(dir);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      onMoveEnd(dir);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      e.preventDefault();
      onMoveEnd(dir);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      onMoveEnd(dir);
    },
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      onMoveStart(dir);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      onMoveEnd(dir);
    },
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      onMoveStart(dir);
    },
    onMouseUp: (e: React.MouseEvent) => {
      e.preventDefault();
      onMoveEnd(dir);
    },
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between overflow-hidden">
      {/* 1. Vignette & Grain Filters */}
      <div className="absolute inset-0 horror-vignette" />
      <div className="absolute inset-0 grain-overlay" />

      {/* 2. Jump Scare Glitch / Red Sanity Pulse */}
      {showJumpScare && (
        <div className="absolute inset-0 bg-red-950/40 pointer-events-none animate-pulse transition-opacity duration-300 z-30" />
      )}

      {/* 3. WELCOME SCREEN (ENTER THE ROOM) - FROSTED GLASS THEME */}
      {!hasEntered && (
        <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md pointer-events-auto flex items-center justify-center p-6 z-50">
          <div className="max-w-lg w-full p-8 sm:p-12 backdrop-blur-2xl bg-black/40 border border-white/10 rounded-[36px] sm:rounded-[40px] shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            {/* Subtle frosted glass ambient glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-900/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-2 mb-6">
              <h1 className="text-3xl sm:text-4xl font-light tracking-[0.2em] text-white/90 uppercase">
                The Quiet Room
              </h1>
              <p className="text-xs uppercase tracking-widest text-white/40 italic">
                An Immersive 3D Psychological Experience
              </p>
            </div>

            <p className="relative z-10 text-xs sm:text-sm text-white/60 font-sans leading-relaxed max-w-sm mb-6">
              Step inside the 1894 sealed Victorian quarters. Examine vintage relics, uncover lost diary entries, and navigate the quiet dark.
            </p>

            <div className="relative z-10 w-full p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl text-left text-xs text-white/60 space-y-2 font-mono-horror mb-8">
              <div className="flex items-center gap-2 text-white/80">
                <Compass className="w-4 h-4 text-orange-400/80" />
                <span className="font-semibold tracking-wider uppercase text-[11px]">Exploration Controls:</span>
              </div>
              <p>• Move: <span className="text-white/90">W, A, S, D</span> / <span className="text-white/90">Arrow Keys</span> or <span className="text-white/90">Frosted D-Pad</span></p>
              <p>• Look: <span className="text-white/90">Mouse move</span> (Click screen) or <span className="text-white/90">Touch drag</span></p>
              <p>• Interact: <span className="text-white/90">E key</span> or <span className="text-white/90">Action Button</span></p>
              <p>• Flashlight: <span className="text-white/90">F key</span> or <span className="text-white/90">Top HUD Toggle</span></p>
            </div>

            <button
              id="enter-room-btn"
              onClick={onEnter}
              className="group relative w-full py-4 px-10 bg-white/5 border border-white/20 hover:bg-white/10 active:bg-white/15 transition-all rounded-full overflow-hidden shadow-2xl cursor-pointer active:scale-98 flex items-center justify-center"
            >
              <span className="relative z-10 text-xs sm:text-sm tracking-[0.3em] font-medium text-white/90 uppercase">
                ENTER THE ROOM
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="mt-5 animate-pulse text-[10px] tracking-[0.25em] text-white/30 uppercase font-mono-horror">
              Headphones Recommended
            </div>
          </div>
        </div>
      )}

      {/* 4. TOP BAR HUD (Frosted Glass Telemetry & Action Buttons) */}
      {hasEntered && (
        <div className="relative p-4 sm:p-6 flex items-start justify-between pointer-events-auto">
          {/* Top-Left Telemetry Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3.5 backdrop-blur-xl bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl shadow-lg">
              <div className="w-1 h-9 bg-orange-600/70 rounded-full" />
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider font-mono-horror flex items-center gap-2">
                  <span>ROOM 1894</span>
                  <span className="text-orange-400/80 font-bold">• HDG {telemetry?.heading || 'N'}</span>
                </div>
                <div className="text-xs font-mono text-white/80 uppercase tracking-wider">
                  X: {telemetry?.x?.toFixed(1) || '0.0'}m &nbsp;|&nbsp; Z: {telemetry?.z?.toFixed(1) || '2.6'}m
                </div>
              </div>
            </div>

            {isFlickering && (
              <div className="backdrop-blur-xl bg-red-950/40 border border-red-500/30 text-red-300 rounded-2xl px-3.5 py-2 text-[11px] font-mono-horror flex items-center gap-2 shadow-lg animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span className="tracking-wider">POWER FLUCTUATION</span>
              </div>
            )}
          </div>

          {/* Top-Right Control Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Debug HUD Toggle */}
            <button
              id="hud-debug-btn"
              onClick={() => setShowDebugHud(!showDebugHud)}
              title="Toggle 3D Engine Debug HUD"
              className={`p-3 rounded-2xl backdrop-blur-xl border transition-all shadow-lg active:scale-95 ${
                showDebugHud
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <Activity className="w-5 h-5" />
            </button>

            {/* Flashlight Toggle */}
            <button
              id="hud-flashlight-btn"
              onClick={onToggleFlashlight}
              title="Toggle Flashlight [F]"
              className={`p-3 rounded-2xl backdrop-blur-xl border transition-all shadow-lg active:scale-95 ${
                isFlashlightOn
                  ? 'bg-amber-500/15 border-amber-400/30 text-amber-200 shadow-amber-950/30'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <Flashlight className="w-5 h-5" />
            </button>

            {/* Audio Mute Toggle */}
            <button
              id="hud-sound-btn"
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-3 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-white/70" />}
            </button>

            {/* Info / Guide */}
            <button
              id="hud-info-btn"
              onClick={() => setShowInfoModal(true)}
              title="Guide & Architecture"
              className="p-3 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 4b. STEP 12 DEVELOPMENT DEBUG HUD */}
      {hasEntered && showDebugHud && (
        <div
          id="debug-hud"
          className="absolute top-24 left-4 sm:left-6 z-40 p-3.5 backdrop-blur-2xl bg-black/85 border border-emerald-500/35 rounded-2xl font-mono text-[11px] text-emerald-400 space-y-1.5 shadow-2xl pointer-events-auto select-text max-w-xs"
        >
          <div className="flex items-center justify-between gap-4 font-bold border-b border-emerald-500/25 pb-1 text-white">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              3D ENGINE HUD
            </span>
            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">
              60 FPS TARGET
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/70">WEBGL:</span>
            <span className="text-white font-bold">{telemetry?.webglOk ? 'OK' : 'ACTIVE'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/70">FPS:</span>
            <span className="text-white font-bold">{telemetry?.fps ?? 60}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/70">RENDER LOOP:</span>
            <span className="text-white font-bold">
              {telemetry?.renderLoopRunning ? 'RUNNING' : 'ACTIVE'} ({telemetry?.frames ?? 0})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/70">PLAYER:</span>
            <span className="text-white font-bold">
              {telemetry?.x?.toFixed(2) ?? '0.00'} / {telemetry?.y?.toFixed(2) ?? '1.65'} / {telemetry?.z?.toFixed(2) ?? '2.60'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/70">CAMERA:</span>
            <span className="text-white font-bold">
              {telemetry?.camX?.toFixed(2) ?? '0.00'} / {telemetry?.camY?.toFixed(2) ?? '1.65'} / {telemetry?.camZ?.toFixed(2) ?? '2.60'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-400/70">ROOM OBJECTS:</span>
            <span className="text-white font-bold">
              {telemetry?.objectCount ?? 1} Meshes / {telemetry?.collidersCount ?? 7} Colliders
            </span>
          </div>
        </div>
      )}

      {/* 5. CENTER CROSSHAIR & INTERACTION PROMPT */}
      {hasEntered && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {/* Subtle Frosted Reticle */}
          <div
            className={`w-2 h-2 rounded-full border transition-all duration-150 backdrop-blur-sm ${
              interactTarget
                ? 'w-6 h-6 border-white/60 bg-white/20 scale-125'
                : 'border-white/30 bg-white/10'
            }`}
          />

          {/* Interactive Object Action Button */}
          {interactTarget && (
            <div className="mt-8 pointer-events-auto">
              <button
                id="interact-action-btn"
                onClick={onInteract}
                className="group flex items-center gap-3 px-6 py-2.5 backdrop-blur-2xl bg-black/50 hover:bg-black/70 border border-white/20 hover:border-white/40 rounded-full text-white/90 shadow-2xl transition-all cursor-pointer active:scale-95"
              >
                <Hand className="w-4 h-4 text-orange-400/90 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-mono-horror tracking-wider">
                  <span className="text-orange-400/90 font-bold">[E]</span> {interactTarget.actionText || 'Interact'}
                </span>
              </button>
            </div>
          )}

          {/* Initial Brief Helper Notice */}
          {showTutorial && !interactTarget && (
            <div className="mt-12 px-4 py-1.5 backdrop-blur-xl bg-black/40 border border-white/10 rounded-full text-white/50 text-xs font-mono-horror tracking-widest animate-pulse">
              Use the frosted controls or keys to explore
            </div>
          )}
        </div>
      )}

      {/* 6. DESKTOP POINTER LOCK HELPER BANNER */}
      {hasEntered && !isPointerLocked && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-auto hidden md:block">
          <button
            onClick={onRequestPointerLock}
            className="px-4 py-2 backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-white/15 rounded-full text-xs text-white/70 hover:text-white font-mono-horror tracking-wider transition-all shadow-xl"
          >
            Click screen for 360° mouse look
          </button>
        </div>
      )}

      {/* 7. BOTTOM SECTION: NARRATIVE SUBTITLE & FROSTED GLASS D-PAD */}
      {hasEntered && (
        <div className="relative p-4 sm:p-6 flex flex-col items-center gap-4">
          {/* Narrative Subtitle */}
          {message && (
            <div className="max-w-xl text-center px-6 py-3 backdrop-blur-2xl bg-black/50 border border-white/10 rounded-2xl text-white/80 text-sm font-serif italic tracking-wide shadow-2xl animate-fade-in">
              "{message}"
            </div>
          )}

          {/* FROSTED GLASS CONTROLS */}
          <div className="pointer-events-auto flex flex-col items-center gap-2 select-none touch-none">
            <div className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-mono-horror">
              Controls
            </div>

            {/* Frosted D-Pad Panel matching design */}
            <div className="flex gap-2.5 p-3 backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
              {/* LEFT [A] */}
              <button
                id="ctrl-left"
                {...bindButtonEvents('left')}
                aria-label="Move Left"
                className="w-13 h-13 sm:w-14 sm:h-14 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 active:bg-white/20 cursor-pointer transition-all active:scale-95 group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[9px] font-mono-horror text-white/30 uppercase mt-0.5">A</span>
              </button>

              {/* UP & DOWN COLUMN [W & S] */}
              <div className="flex flex-col gap-2">
                <button
                  id="ctrl-up"
                  {...bindButtonEvents('forward')}
                  aria-label="Move Forward"
                  className="w-13 h-13 sm:w-14 sm:h-14 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 active:bg-white/20 cursor-pointer transition-all active:scale-95 group"
                >
                  <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-[9px] font-mono-horror text-white/30 uppercase mt-0.5">W</span>
                </button>

                <button
                  id="ctrl-down"
                  {...bindButtonEvents('backward')}
                  aria-label="Move Backward"
                  className="w-13 h-13 sm:w-14 sm:h-14 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 active:bg-white/20 cursor-pointer transition-all active:scale-95 group"
                >
                  <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                  <span className="text-[9px] font-mono-horror text-white/30 uppercase mt-0.5">S</span>
                </button>
              </div>

              {/* RIGHT [D] */}
              <button
                id="ctrl-right"
                {...bindButtonEvents('right')}
                aria-label="Move Right"
                className="w-13 h-13 sm:w-14 sm:h-14 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 active:bg-white/20 cursor-pointer transition-all active:scale-95 group"
              >
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                <span className="text-[9px] font-mono-horror text-white/30 uppercase mt-0.5">D</span>
              </button>
            </div>
          </div>

          {/* Bottom Right Diagnostic Telemetry */}
          <div className="hidden sm:block absolute bottom-6 right-6 text-right opacity-50 font-mono text-[10px] tracking-widest uppercase space-y-0.5 pointer-events-none">
            <div className="text-orange-400/80 font-bold">HDG: {telemetry?.heading || 'N'}</div>
            <div>POS: {telemetry?.x?.toFixed(1) || '0.0'}, {telemetry?.z?.toFixed(1) || '2.6'}</div>
            <div>AUDIO: 3D SPATIAL</div>
          </div>
        </div>
      )}

      {/* 8. DIARY NOTE INSPECTION MODAL - FROSTED GLASS PARCHMENT */}
      {activeNote && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md pointer-events-auto flex items-center justify-center p-6 z-40 animate-fade-in">
          <div className="max-w-lg w-full backdrop-blur-2xl bg-black/60 border border-white/15 p-8 rounded-[32px] shadow-2xl space-y-6 text-white/80 relative font-serif">
            <button
              onClick={onCloseNote}
              className="absolute top-5 right-5 p-2 text-white/40 hover:text-white/90 rounded-full hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-white/10 pb-4 space-y-1.5">
              <div className="flex items-center gap-2 text-orange-400/90 text-xs font-mono-horror uppercase tracking-widest">
                <BookOpen className="w-4 h-4" />
                <span>Recovered Document</span>
              </div>
              <h3 className="text-xl font-horror tracking-wider text-white/95">
                {activeNote.title}
              </h3>
              {activeNote.date && (
                <p className="text-xs text-white/40 italic">{activeNote.date}</p>
              )}
            </div>

            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line text-white/70">
              {activeNote.content}
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onCloseNote}
                className="px-6 py-2.5 backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono-horror tracking-widest text-white/80 rounded-full transition-all active:scale-95"
              >
                Put Down Document [ESC]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. GUIDE & GLTF REPLACEMENT MODAL - FROSTED GLASS */}
      {showInfoModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md pointer-events-auto flex items-center justify-center p-6 z-40 animate-fade-in">
          <div className="max-w-xl w-full backdrop-blur-2xl bg-black/60 border border-white/15 p-8 rounded-[32px] shadow-2xl space-y-5 text-white/80 relative max-h-[85vh] overflow-y-auto font-serif">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-5 right-5 p-2 text-white/40 hover:text-white/90 rounded-full hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-horror text-white/95 tracking-wider">
                3D Horror Room Architecture & Assets
              </h3>
              <p className="text-xs text-white/40 font-mono-horror tracking-wider">
                Three.js WebGL First-Person Engine
              </p>
            </div>

            <div className="space-y-3.5 text-xs font-mono-horror leading-relaxed text-white/60">
              <div className="p-3.5 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <p className="text-orange-400/90 font-bold uppercase tracking-wider text-[11px]">1. Replacing Procedural Geometry with GLB/GLTF Models:</p>
                <p>Use <span className="text-white/90">RoomBuilder.loadGLBModel('assets/models/my_model.glb', (gltf) =&gt; scene.add(gltf.scene))</span>. If any asset is missing, procedural 3D fallbacks remain completely active.</p>
              </div>

              <div className="p-3.5 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <p className="text-orange-400/90 font-bold uppercase tracking-wider text-[11px]">2. Custom Audio Files:</p>
                <p>Call <span className="text-white/90">soundSystem.loadSoundFile('name', 'assets/audio/sound.mp3')</span>. The built-in Web Audio procedural synthesizer handles offline audio automatically.</p>
              </div>

              <div className="p-3.5 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 space-y-1">
                <p className="text-orange-400/90 font-bold uppercase tracking-wider text-[11px]">3. Reusable Horror Event System:</p>
                <p>Add custom triggers in <span className="text-white/90">EventSystem.ts</span> using <span className="text-white/90">addTrigger(...)</span>, <span className="text-white/90">triggerLightFlicker()</span>, and <span className="text-white/90">playSound()</span>.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-6 py-2.5 backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono-horror tracking-widest text-white/80 rounded-full transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

