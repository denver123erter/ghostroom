import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from './engine/SceneManager';
import { HorrorUI } from './components/HorrorUI';
import { InteractableObject, TelemetryData } from './types';
import { soundSystem } from './audio/SoundSystem';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  // Application States
  const [hasEntered, setHasEntered] = useState(false);
  const [interactTarget, setInteractTarget] = useState<InteractableObject | null>(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState(true);
  const [activeNote, setActiveNote] = useState<{ title: string; content: string; date?: string } | null>(null);
  const [narrativeMessage, setNarrativeMessage] = useState<string | null>(null);
  const [isFlickering, setIsFlickering] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showJumpScare, setShowJumpScare] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    x: 0,
    y: 1.65,
    z: 2.6,
    camX: 0,
    camY: 1.65,
    camZ: 2.6,
    heading: 'N',
    fov: 70,
    fps: 60,
    frames: 0,
    objectCount: 1,
    collidersCount: 7,
    webglOk: true,
    renderLoopRunning: true,
  });

  const messageTimeoutRef = useRef<number | null>(null);

  const showNarrativeMessage = useCallback((msg: string) => {
    setNarrativeMessage(msg);
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = window.setTimeout(() => {
      setNarrativeMessage(null);
    }, 5000);
  }, []);

  // Stable callback bridge so SceneManager never needs recreation
  const callbacksRef = useRef({
    onInteractTargetChange: (target: InteractableObject | null) => setInteractTarget(target),
    onShowNote: (note: { title: string; content: string; date?: string }) => setActiveNote(note),
    onMessage: (msg: string) => showNarrativeMessage(msg),
    onFlickerChange: (flickering: boolean) => setIsFlickering(flickering),
    onHeartbeatChange: (_active: boolean) => {},
    onJumpScare: () => {
      setShowJumpScare(true);
      setTimeout(() => setShowJumpScare(false), 800);
    },
    onTelemetry: (data: TelemetryData) => setTelemetry(data),
  });

  // Keep callback references fresh
  useEffect(() => {
    callbacksRef.current = {
      onInteractTargetChange: (target) => setInteractTarget(target),
      onShowNote: (note) => setActiveNote(note),
      onMessage: (msg) => showNarrativeMessage(msg),
      onFlickerChange: (flickering) => setIsFlickering(flickering),
      onHeartbeatChange: () => {},
      onJumpScare: () => {
        setShowJumpScare(true);
        setTimeout(() => setShowJumpScare(false), 800);
      },
      onTelemetry: (data) => setTelemetry(data),
    };
  }, [showNarrativeMessage]);

  // Initialize Three.js SceneManager once on mount and run continuously
  useEffect(() => {
    if (!containerRef.current) return;

    const manager = new SceneManager({
      container: containerRef.current,
      onInteractTargetChange: (target) => callbacksRef.current.onInteractTargetChange(target),
      onShowNote: (note) => callbacksRef.current.onShowNote(note),
      onMessage: (msg) => callbacksRef.current.onMessage(msg),
      onFlickerChange: (flickering) => callbacksRef.current.onFlickerChange(flickering),
      onHeartbeatChange: (active) => callbacksRef.current.onHeartbeatChange(active),
      onJumpScare: () => callbacksRef.current.onJumpScare(),
      onTelemetry: (data) => callbacksRef.current.onTelemetry(data),
    });

    sceneManagerRef.current = manager;
    // Start rendering 3D environment immediately on mount
    manager.start();

    // Track pointer lock changes
    const onPointerLockChange = () => {
      setIsPointerLocked(!!document.pointerLockElement);
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      manager.cleanup();
    };
  }, []);

  // Handle Enter Room
  const handleEnterRoom = useCallback(() => {
    if (!hasEntered) {
      setHasEntered(true);
      soundSystem.init();
      if (sceneManagerRef.current) {
        sceneManagerRef.current.start();
        if (window.innerWidth >= 768) {
          sceneManagerRef.current.player.requestPointerLock();
        }
      }
    }
  }, [hasEntered]);

  // Auto-enter if user presses movement/action keys
  useEffect(() => {
    const handleInitialKeyPress = (e: KeyboardEvent) => {
      if (!hasEntered) {
        const triggers = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'];
        if (triggers.includes(e.code)) {
          handleEnterRoom();
        }
      }
    };
    window.addEventListener('keydown', handleInitialKeyPress);
    return () => window.removeEventListener('keydown', handleInitialKeyPress);
  }, [hasEntered, handleEnterRoom]);

  // Toggle Flashlight
  const handleToggleFlashlight = () => {
    if (!hasEntered) handleEnterRoom();
    if (sceneManagerRef.current) {
      const state = sceneManagerRef.current.toggleFlashlight();
      setIsFlashlightOn(state);
    }
  };

  // Toggle Audio Mute
  const handleToggleMute = () => {
    const muted = soundSystem.toggleMute();
    setIsMuted(muted);
  };

  // Trigger Current Interaction
  const handleInteract = () => {
    if (!hasEntered) handleEnterRoom();
    if (sceneManagerRef.current) {
      sceneManagerRef.current.interaction.triggerCurrentInteraction();
    }
  };

  // Pointer lock request from button
  const handleRequestPointerLock = () => {
    if (!hasEntered) handleEnterRoom();
    if (sceneManagerRef.current) {
      sceneManagerRef.current.player.requestPointerLock();
    }
  };

  // Virtual On-Screen D-Pad handlers
  const handleMoveStart = (direction: 'forward' | 'backward' | 'left' | 'right') => {
    if (!hasEntered) handleEnterRoom();
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.player.controls[direction] = true;
  };

  const handleMoveEnd = (direction: 'forward' | 'backward' | 'left' | 'right') => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.player.controls[direction] = false;
  };

  // Close Note modal with ESC key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && activeNote) {
        setActiveNote(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeNote]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        id="webgl-container"
        className="w-full h-full cursor-crosshair"
        onClick={() => {
          if (!hasEntered) {
            handleEnterRoom();
          } else if (!activeNote && window.innerWidth >= 768) {
            sceneManagerRef.current?.player.requestPointerLock();
          }
        }}
      />

      {/* Horror UI Overlay */}
      <HorrorUI
        hasEntered={hasEntered}
        onEnter={handleEnterRoom}
        interactTarget={interactTarget}
        onInteract={handleInteract}
        isFlashlightOn={isFlashlightOn}
        onToggleFlashlight={handleToggleFlashlight}
        onMoveStart={handleMoveStart}
        onMoveEnd={handleMoveEnd}
        activeNote={activeNote}
        onCloseNote={() => setActiveNote(null)}
        message={narrativeMessage}
        isFlickering={isFlickering}
        isPointerLocked={isPointerLocked}
        onRequestPointerLock={handleRequestPointerLock}
        onToggleMute={handleToggleMute}
        isMuted={isMuted}
        showJumpScare={showJumpScare}
        telemetry={telemetry}
      />
    </div>
  );
}
