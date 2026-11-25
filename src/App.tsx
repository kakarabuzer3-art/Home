import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApplianceCard } from './components/ApplianceCard';
import { BrightnessSlider } from './components/BrightnessSlider';
import { CameraCard } from './components/CameraCard';
import { IconRail } from './components/IconRail';
import { LightsCard } from './components/LightsCard';
import { MusicCard } from './components/MusicCard';
import { RecCursor } from './components/RecCursor';
import { ScenePill } from './components/ScenePill';
import { TabBar } from './components/TabBar';
import { ThermostatCard } from './components/ThermostatCard';
import { Toast } from './components/Toast';
import {
  ASSETS,
  INITIAL_ROOMS,
  TRACKS,
  type RailSectionId,
  type RoomConfig,
  type RoomId,
} from './data/havenData';
import {
  computeRoomDimOpacity,
  computeSunGlowOpacity,
  easeOutCubic,
  formatTempDisplay,
  lerp,
  resolvePrevTrackAction,
  stepApplianceProgress,
} from './lib/havenLogic';

interface RoomRuntimeState {
  dialValue: number;
  dialPower: boolean;
  lightsOn: boolean;
  brightness: number;
  applianceActive: boolean;
  applianceProgress: number;
}

const EXTRA_ROOMS: RoomConfig[] = [
  {
    id: 'studio',
    label: 'Studio',
    tabIcon: 'spark',
    cameraKind: 'image',
    cameraSrc: ASSETS.bedroomCam,
    cameraLabel: 'Studio',
    dialTitle: 'Thermostat',
    dialSubtitle: 'Target temperature',
    dialDefault: 21,
    dialMin: 16,
    dialMax: 30,
    ambientTemp: 20,
    sceneName: 'Focus',
    sceneSubtitle: 'Scene',
    sceneIcon: 'sun',
    sceneTargetTemp: 21,
    sceneTargetBrightness: 90,
    sceneToast: 'Focus scene · lights 90%, 21°, music on',
    applianceTitle: 'Air purifier',
    applianceIdleStatus: 'Standby',
    applianceActiveStatus: 'Purifying',
    applianceActiveSub: (pct) => `Purifying · ${pct}% done`,
    applianceIcon: 'purifier',
    lightsTitle: 'Track lights',
    defaultBrightness: 82,
  },
  {
    id: 'terrace',
    label: 'Terrace',
    tabIcon: 'spark',
    cameraKind: 'video',
    cameraSrc: ASSETS.roomVideo,
    cameraPoster: ASSETS.roomStill,
    cameraLabel: 'Terrace',
    dialTitle: 'Patio heat',
    dialSubtitle: 'Target temperature',
    dialDefault: 24,
    dialMin: 16,
    dialMax: 30,
    ambientTemp: 19,
    sceneName: 'Evening',
    sceneSubtitle: 'Scene',
    sceneIcon: 'moon',
    sceneTargetTemp: 24,
    sceneTargetBrightness: 64,
    sceneToast: 'Evening scene · lights 64%, 24°, music on',
    applianceTitle: 'Robot vacuum',
    applianceIdleStatus: 'Docked',
    applianceActiveStatus: 'Cleaning',
    applianceActiveSub: (pct) => `Cleaning · ${pct}% done`,
    applianceIcon: 'vacuum',
    lightsTitle: 'String lights',
    defaultBrightness: 68,
  },
];

function createInitialRoomStates(rooms: RoomConfig[], skipIntro: boolean): Record<RoomId, RoomRuntimeState> {
  const map: Record<RoomId, RoomRuntimeState> = {};
  for (const r of rooms) {
    const isInitialLiving = r.id === 'living';
    map[r.id] = {
      dialValue: !skipIntro && isInitialLiving ? 16 : r.dialDefault,
      dialPower: true,
      lightsOn: true,
      brightness: !skipIntro && isInitialLiving ? 20 : r.defaultBrightness,
      applianceActive: false,
      applianceProgress: 0,
    };
  }
  return map;
}

export default function App() {
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const recMode = urlParams.has('rec');
  const skipIntro = urlParams.get('autostart') === '1';

  const [rooms, setRooms] = useState<RoomConfig[]>(INITIAL_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState<RoomId>('living');
  const [roomStates, setRoomStates] = useState<Record<RoomId, RoomRuntimeState>>(() =>
    createInitialRoomStates(INITIAL_ROOMS, skipIntro),
  );

  // Intro choreography flags
  const [roomBlurred, setRoomBlurred] = useState<boolean>(!skipIntro);
  const [windowRevealed, setWindowRevealed] = useState<boolean>(skipIntro);
  const [tabsRevealed, setTabsRevealed] = useState<boolean>(skipIntro);
  const [railRevealed, setRailRevealed] = useState<boolean>(skipIntro);
  const [cardsRevealed, setCardsRevealed] = useState<boolean>(skipIntro);

  // Room-switch micro choreography
  const [cardsDip, setCardsDip] = useState(false);
  const [dialAnimSeed, setDialAnimSeed] = useState(0);

  // Spatial UI state
  const [activeRail, setActiveRail] = useState<RailSectionId>('lighting');
  const [cameraExpanded, setCameraExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draggingBrightness, setDraggingBrightness] = useState(false);

  // Preferences inside settings sheet
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [parallaxEnabled, setParallaxEnabled] = useState(true);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(true);

  // Music player state (starts on Slow Bloom at 1:12 / 3:24, playing)
  const [trackIndex, setTrackIndex] = useState(0);
  const [prevCover, setPrevCover] = useState<string | null>(null);
  const [trackAnimKey, setTrackAnimKey] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(72);

  // Toast state
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  // Refs for parallax, video, brightness animation, and ?rec clock
  const roomLayerRef = useRef<HTMLDivElement | null>(null);
  const uiLayerRef = useRef<HTMLDivElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const recClockRef = useRef<number>(0);
  const brightnessAnimRef = useRef<number>(0);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) ?? rooms[1],
    [rooms, activeRoomId],
  );
  const activeState = roomStates[activeRoom.id] ?? {
    dialValue: activeRoom.dialDefault,
    dialPower: true,
    lightsOn: true,
    brightness: activeRoom.defaultBrightness,
    applianceActive: false,
    applianceProgress: 0,
  };

  const showToast = useCallback((message: string) => {
    setToastMsg(message);
    setToastVisible(true);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
    }, 2400);
  }, []);

  const animateRoomBrightness = useCallback(
    (roomId: RoomId, fromVal: number, toVal: number, durationMs = 700) => {
      if (brightnessAnimRef.current) {
        window.cancelAnimationFrame(brightnessAnimRef.current);
      }
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const current = fromVal + (toVal - fromVal) * easeOutCubic(t);
        setRoomStates((prev) => {
          const existing = prev[roomId];
          if (!existing) return prev;
          return {
            ...prev,
            [roomId]: { ...existing, brightness: current },
          };
        });
        if (t < 1) {
          brightnessAnimRef.current = window.requestAnimationFrame(step);
        } else {
          setRoomStates((prev) => {
            const existing = prev[roomId];
            if (!existing) return prev;
            return {
              ...prev,
              [roomId]: { ...existing, brightness: toVal },
            };
          });
        }
      };
      brightnessAnimRef.current = window.requestAnimationFrame(step);
    },
    [],
  );

  // Intro choreography sequence
  useEffect(() => {
    if (skipIntro) return;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setRoomBlurred(false), 60));
    timers.push(window.setTimeout(() => setWindowRevealed(true), 120));
    timers.push(window.setTimeout(() => setTabsRevealed(true), 280));
    timers.push(window.setTimeout(() => setRailRevealed(true), 420));
    timers.push(window.setTimeout(() => setCardsRevealed(true), 460));
    timers.push(
      window.setTimeout(() => {
        setRoomStates((prev) => ({
          ...prev,
          living: {
            ...prev.living,
            dialValue: 22,
          },
        }));
        setDialAnimSeed((s) => s + 1);
        animateRoomBrightness('living', 20, 72, 850);
      }, 720),
    );
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [skipIntro, animateRoomBrightness]);

  // ?rec mode deterministic page clock stepping for background video
  useEffect(() => {
    if (!recMode) return;
    let rafId = 0;
    const origin = performance.now();
    const step = (now: number) => {
      const elapsed = (now - origin) / 1000;
      recClockRef.current = elapsed;
      const vid = bgVideoRef.current;
      if (vid && vid.duration && Number.isFinite(vid.duration)) {
        if (!vid.paused) vid.pause();
        vid.currentTime = elapsed % vid.duration;
      }
      rafId = window.requestAnimationFrame(step);
    };
    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [recMode]);

  // Smooth mouse parallax (lerp 0.05) on desktop (>900px), demand-driven so it settles cleanly
  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    let sx = 0;
    let sy = 0;
    let rafId = 0;

    const applyTransforms = (desktopActive: boolean) => {
      const roomEl = roomLayerRef.current;
      if (roomEl) {
        roomEl.style.transform = desktopActive
          ? `scale(1.04) translate3d(${(sx * 18).toFixed(2)}px, ${(sy * 12).toFixed(2)}px, 0)`
          : 'scale(1.04) translate3d(0px, 0px, 0px)';
      }

      const uiEl = uiLayerRef.current;
      if (uiEl) {
        uiEl.style.transform =
          desktopActive && (Math.abs(sx) > 0.0005 || Math.abs(sy) > 0.0005)
            ? `translate3d(${(sx * -14).toFixed(2)}px, ${(sy * -10).toFixed(2)}px, 0) rotateY(${(sx * 4).toFixed(3)}deg) rotateX(${(-sy * 3).toFixed(3)}deg)`
            : '';
      }
    };

    const tick = () => {
      rafId = 0;
      const desktopActive = window.innerWidth > 900 && parallaxEnabled;
      const tx = desktopActive ? targetX : 0;
      const ty = desktopActive ? targetY : 0;
      sx = lerp(sx, tx, 0.05);
      sy = lerp(sy, ty, 0.05);

      const settled = Math.abs(tx - sx) < 0.003 && Math.abs(ty - sy) < 0.003;
      if (settled) {
        sx = tx;
        sy = ty;
      }

      applyTransforms(desktopActive);

      if (!settled) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const scheduleTick = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (window.innerWidth <= 900 || !parallaxEnabled) return;
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      scheduleTick();
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      scheduleTick();
    };

    const onResize = () => {
      if (window.innerWidth <= 900) {
        targetX = 0;
        targetY = 0;
        sx = 0;
        sy = 0;
        applyTransforms(false);
      }
    };

    applyTransforms(window.innerWidth > 900 && parallaxEnabled);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', onResize);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
    };
  }, [parallaxEnabled]);

  // Escape key closes expanded camera or settings sheet
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (cameraExpanded) setCameraExpanded(false);
        if (settingsOpen) setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cameraExpanded, settingsOpen]);

  // Appliance 2% per second progression & auto-dock at 100%
  useEffect(() => {
    const id = window.setInterval(() => {
      let finishedTitle: string | null = null;
      setRoomStates((prev) => {
        let changed = false;
        const next: Record<RoomId, RoomRuntimeState> = { ...prev };
        for (const r of rooms) {
          const st = prev[r.id];
          if (!st || !st.applianceActive) continue;
          changed = true;
          const stepped = stepApplianceProgress(st.applianceProgress);
          if (stepped.completed) {
            next[r.id] = {
              ...st,
              applianceActive: false,
              applianceProgress: 0,
            };
            if (r.id === activeRoomId) {
              finishedTitle = `${r.applianceTitle} complete · ${r.applianceIdleStatus.toLowerCase()}`;
            }
          } else {
            next[r.id] = {
              ...st,
              applianceProgress: stepped.nextProgress,
            };
          }
        }
        return changed ? next : prev;
      });

      if (finishedTitle) {
        showToast(finishedTitle);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [rooms, activeRoomId, showToast]);

  // Music clock ticking every second & auto-advance at track end
  useEffect(() => {
    if (!musicPlaying) return;
    const id = window.setInterval(() => {
      setElapsedSec((sec) => {
        const currentTrack = TRACKS[trackIndex];
        if (sec + 1 >= currentTrack.durationSec) {
          setPrevCover(currentTrack.cover);
          setTrackIndex((idx) => (idx + 1) % TRACKS.length);
          setTrackAnimKey((k) => k + 1);
          return 0;
        }
        return sec + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [musicPlaying, trackIndex]);

  // Handlers
  const handleSelectRoom = (id: RoomId) => {
    if (id === activeRoomId) return;
    const targetRoom = rooms.find((r) => r.id === id);
    if (!targetRoom) return;

    setCameraExpanded(false);
    setSettingsOpen(false);
    setActiveRoomId(id);
    setCardsDip(true);
    setDialAnimSeed((s) => s + 1);
    window.setTimeout(() => setCardsDip(false), 320);

    showToast(`${targetRoom.label} · ${targetRoom.dialTitle} ${formatTempDisplay(roomStates[id]?.dialValue ?? targetRoom.dialDefault, tempUnit)}`);
  };

  const handleAddRoom = () => {
    const nextExtra = EXTRA_ROOMS.find((extra) => !rooms.some((r) => r.id === extra.id));
    if (!nextExtra) {
      showToast('All smart zones connected');
      return;
    }
    setRooms((prev) => [...prev, nextExtra]);
    setRoomStates((prev) => ({
      ...prev,
      [nextExtra.id]: {
        dialValue: nextExtra.dialDefault,
        dialPower: true,
        lightsOn: true,
        brightness: nextExtra.defaultBrightness,
        applianceActive: false,
        applianceProgress: 0,
      },
    }));
    setActiveRoomId(nextExtra.id);
    setCardsDip(true);
    setDialAnimSeed((s) => s + 1);
    window.setTimeout(() => setCardsDip(false), 320);
    showToast(`${nextExtra.label} added to HAVEN`);
  };

  const handleSelectRail = (section: RailSectionId) => {
    setActiveRail(section);
    if (section === 'settings') {
      setSettingsOpen((open) => !open);
      return;
    }
    setSettingsOpen(false);
    if (section === 'security') {
      showToast(`Security · ${activeRoom.cameraLabel} feed active`);
    } else if (section === 'climate') {
      showToast(`${activeRoom.dialTitle} · ${formatTempDisplay(activeState.dialValue, tempUnit)}`);
    } else if (section === 'lighting') {
      showToast(`${activeRoom.lightsTitle} · ${activeState.lightsOn ? `${Math.round(activeState.brightness)}%` : 'Off'}`);
    } else {
      showToast('Home overview');
    }
  };

  const handleChangeDial = (val: number) => {
    setRoomStates((prev) => ({
      ...prev,
      [activeRoom.id]: {
        ...prev[activeRoom.id],
        dialValue: val,
        dialPower: true,
      },
    }));
  };

  const handleCommitDial = (val: number) => {
    showToast(`${activeRoom.dialTitle} set to ${formatTempDisplay(val, tempUnit)}`);
  };

  const handleToggleDialPower = () => {
    const nextPower = !activeState.dialPower;
    setRoomStates((prev) => ({
      ...prev,
      [activeRoom.id]: {
        ...prev[activeRoom.id],
        dialPower: nextPower,
      },
    }));
    showToast(`${activeRoom.dialTitle} ${nextPower ? 'turned on' : 'turned off'}`);
  };

  const handlePlayScene = () => {
    const roomId = activeRoom.id;
    const startBrightness = activeState.lightsOn ? activeState.brightness : 20;
    setRoomStates((prev) => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        lightsOn: true,
        dialPower: true,
        dialValue: activeRoom.sceneTargetTemp,
      },
    }));
    setDialAnimSeed((s) => s + 1);
    animateRoomBrightness(roomId, startBrightness, activeRoom.sceneTargetBrightness, 750);
    setMusicPlaying(true);
    showToast(activeRoom.sceneToast);
  };

  const handleToggleAppliance = () => {
    const nextActive = !activeState.applianceActive;
    setRoomStates((prev) => ({
      ...prev,
      [activeRoom.id]: {
        ...prev[activeRoom.id],
        applianceActive: nextActive,
        applianceProgress: nextActive ? Math.max(2, prev[activeRoom.id].applianceProgress) : 0,
      },
    }));
    showToast(
      nextActive
        ? `${activeRoom.applianceTitle} · ${activeRoom.applianceActiveStatus}`
        : `${activeRoom.applianceTitle} · ${activeRoom.applianceIdleStatus}`,
    );
  };

  const handleToggleLights = () => {
    const nextOn = !activeState.lightsOn;
    setRoomStates((prev) => ({
      ...prev,
      [activeRoom.id]: {
        ...prev[activeRoom.id],
        lightsOn: nextOn,
      },
    }));
    showToast(
      nextOn
        ? `${activeRoom.lightsTitle} on · ${Math.round(activeState.brightness)}%`
        : `${activeRoom.lightsTitle} turned off`,
    );
  };

  const handleChangeBrightness = (value: number) => {
    if (brightnessAnimRef.current) {
      window.cancelAnimationFrame(brightnessAnimRef.current);
    }
    setRoomStates((prev) => ({
      ...prev,
      [activeRoom.id]: {
        ...prev[activeRoom.id],
        brightness: value,
      },
    }));
  };

  const handleNextTrack = () => {
    setPrevCover(TRACKS[trackIndex].cover);
    const nextIdx = (trackIndex + 1) % TRACKS.length;
    setTrackIndex(nextIdx);
    setTrackAnimKey((k) => k + 1);
    setElapsedSec(0);
    setMusicPlaying(true);
  };

  const handlePrevTrack = () => {
    const res = resolvePrevTrackAction(trackIndex, elapsedSec, TRACKS.length);
    if (res.trackChanged) {
      setPrevCover(TRACKS[trackIndex].cover);
      setTrackIndex(res.nextIndex);
      setTrackAnimKey((k) => k + 1);
    }
    setElapsedSec(res.nextElapsedSec);
    setMusicPlaying(true);
  };

  const handleResetLiving = () => {
    setRoomStates(createInitialRoomStates(rooms, true));
    setTempUnit('C');
    setParallaxEnabled(true);
    setScanlinesEnabled(true);
    setSettingsOpen(false);
    setActiveRail('lighting');
    showToast('HAVEN restored to morning defaults');
  };

  const dimOpacity = computeRoomDimOpacity(activeState.lightsOn, activeState.brightness);
  const sunGlowOpacity = computeSunGlowOpacity(activeState.lightsOn, activeState.brightness);
  const currentTrack = TRACKS[trackIndex];

  return (
    <>
      {/* Full-bleed background Scandinavian living room scene */}
      <div
        id="room"
        ref={roomLayerRef}
        className={roomBlurred ? 'room-intro-blur' : ''}
        data-lights-on={activeState.lightsOn ? 'true' : 'false'}
        data-brightness={Math.round(activeState.brightness)}
      >
        <img
          src={ASSETS.roomStill}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="room-media"
        />
        <video
          ref={bgVideoRef}
          className="room-media"
          src={ASSETS.roomVideo}
          poster={ASSETS.roomStill}
          autoPlay={!recMode}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className={`room-sun-glow ${draggingBrightness ? 'dragging-fast' : ''}`}
          style={{ opacity: sunGlowOpacity }}
        />
        <div aria-hidden="true" className="room-vignette" />
        <div
          aria-hidden="true"
          data-testid="room-dim-layer"
          className={`room-dim ${draggingBrightness ? 'dragging-fast' : ''}`}
          style={{ opacity: dimOpacity }}
        />
      </div>

      {/* 3D Spatial Perspective Stage */}
      <div className="stage">
        <div ref={uiLayerRef} className="spatial-ui">
          {/* Top-centre room tab bar */}
          <TabBar
            rooms={rooms}
            activeRoomId={activeRoom.id}
            onSelectRoom={handleSelectRoom}
            onAddRoom={handleAddRoom}
            introRevealed={tabsRevealed}
          />

          {/* Left icon rail */}
          <IconRail
            activeSection={activeRail}
            onSelectSection={handleSelectRail}
            introRevealed={railRevealed}
          />

          {/* Main floating frosted-glass spatial window */}
          <main
            aria-label={`HAVEN ${activeRoom.label} smart-home dashboard`}
            className={`haven-window glass ${windowRevealed ? '' : 'intro-hidden'} ${cardsDip ? 'cards-dip' : ''}`}
          >
            <CameraCard
              room={activeRoom}
              expanded={cameraExpanded}
              onToggleExpand={() => setCameraExpanded((e) => !e)}
              introHidden={!cardsRevealed}
              spotlight={activeRail === 'security'}
              recMode={recMode}
              recClockRef={recClockRef}
              scanlinesEnabled={scanlinesEnabled}
            />

            <ThermostatCard
              room={activeRoom}
              targetValue={activeState.dialValue}
              powerOn={activeState.dialPower}
              tempUnit={tempUnit}
              onChangeValue={handleChangeDial}
              onCommitValue={handleCommitDial}
              onTogglePower={handleToggleDialPower}
              onOpenSettings={() => {
                setActiveRail('settings');
                setSettingsOpen(true);
              }}
              introHidden={!cardsRevealed}
              spotlight={activeRail === 'climate'}
              animSeed={dialAnimSeed}
            />

            <ScenePill
              room={activeRoom}
              onPlayScene={handlePlayScene}
              introHidden={!cardsRevealed}
              spotlight={activeRail === 'home'}
            />

            <ApplianceCard
              room={activeRoom}
              active={activeState.applianceActive}
              progress={activeState.applianceProgress}
              onToggle={handleToggleAppliance}
              introHidden={!cardsRevealed}
              spotlight={activeRail === 'home'}
            />

            <LightsCard
              room={activeRoom}
              lightsOn={activeState.lightsOn}
              brightness={activeState.brightness}
              onToggleLights={handleToggleLights}
              introHidden={!cardsRevealed}
              spotlight={activeRail === 'lighting'}
            />

            <BrightnessSlider
              brightness={activeState.brightness}
              disabled={!activeState.lightsOn}
              onChangeBrightness={handleChangeBrightness}
              onDragStateChange={setDraggingBrightness}
              introHidden={!cardsRevealed}
              spotlight={activeRail === 'lighting'}
            />

            <MusicCard
              track={currentTrack}
              prevCover={prevCover}
              trackKey={trackAnimKey}
              playing={musicPlaying}
              elapsedSec={elapsedSec}
              onTogglePlay={() => setMusicPlaying((p) => !p)}
              onPrev={handlePrevTrack}
              onNext={handleNextTrack}
              onSeek={(sec) => setElapsedSec(sec)}
              introHidden={!cardsRevealed}
              spotlight={false}
            />

            {/* Spatial Settings Sheet */}
            {settingsOpen && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="HAVEN Spatial Preferences"
                className="settings-sheet"
              >
                <div>
                  <div className="flex items-center justify-between gap-[1.6rem] pb-[2rem] border-b border-white/14">
                    <div>
                      <h2 className="m-0 text-[2.4rem] font-semibold tracking-[-0.02em] text-white">
                        Spatial Preferences
                      </h2>
                      <p className="m-0 mt-[0.35rem] text-[1.4rem] text-[var(--muted)]">
                        Configure climate units, motion tilt, and camera feed rendering.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsOpen(false);
                        setActiveRail('lighting');
                      }}
                      className="px-[1.8rem] py-[0.9rem] rounded-full bg-white text-[#151a17] text-[1.35rem] font-semibold hover:opacity-90 transition-opacity"
                    >
                      Done
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-[1.6rem] mt-[2.6rem]">
                    <div className="p-[2rem] rounded-[2.2rem] bg-white/8 border border-white/12 flex flex-col justify-between gap-[1.6rem]">
                      <div>
                        <div className="text-[1.6rem] font-semibold text-white">
                          Temperature scale
                        </div>
                        <div className="text-[1.3rem] text-[var(--muted)] mt-[0.35rem]">
                          Switch thermostat and oven readouts between Celsius and Fahrenheit.
                        </div>
                      </div>
                      <div className="flex items-center gap-[0.8rem]">
                        <button
                          type="button"
                          onClick={() => {
                            setTempUnit('C');
                            showToast('Temperature scale · Celsius (°C)');
                          }}
                          className={`flex-1 py-[0.85rem] rounded-full text-[1.4rem] font-semibold transition-colors ${
                            tempUnit === 'C'
                              ? 'bg-white text-[#151a17]'
                              : 'bg-white/10 text-white/80 hover:bg-white/16'
                          }`}
                        >
                          °C Celsius
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTempUnit('F');
                            showToast('Temperature scale · Fahrenheit (°F)');
                          }}
                          className={`flex-1 py-[0.85rem] rounded-full text-[1.4rem] font-semibold transition-colors ${
                            tempUnit === 'F'
                              ? 'bg-white text-[#151a17]'
                              : 'bg-white/10 text-white/80 hover:bg-white/16'
                          }`}
                        >
                          °F Fahrenheit
                        </button>
                      </div>
                    </div>

                    <div className="p-[2rem] rounded-[2.2rem] bg-white/8 border border-white/12 flex flex-col justify-between gap-[1.6rem]">
                      <div>
                        <div className="text-[1.6rem] font-semibold text-white">
                          Spatial 3D tilt
                        </div>
                        <div className="text-[1.3rem] text-[var(--muted)] mt-[0.35rem]">
                          Subtle depth parallax tracking pointer movement across the room.
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[1.35rem] font-semibold text-white/80">
                          {parallaxEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={parallaxEnabled}
                          aria-label="Toggle spatial 3D tilt"
                          onClick={() => setParallaxEnabled((p) => !p)}
                          className="haven-toggle"
                        >
                          <span className="haven-toggle-thumb" />
                        </button>
                      </div>
                    </div>

                    <div className="p-[2rem] rounded-[2.2rem] bg-white/8 border border-white/12 flex flex-col justify-between gap-[1.6rem]">
                      <div>
                        <div className="text-[1.6rem] font-semibold text-white">
                          Camera scanlines
                        </div>
                        <div className="text-[1.3rem] text-[var(--muted)] mt-[0.35rem]">
                          Overlay subtle CRT scanlines across live security camera tiles.
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[1.35rem] font-semibold text-white/80">
                          {scanlinesEnabled ? 'Active' : 'Off'}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={scanlinesEnabled}
                          aria-label="Toggle camera scanlines"
                          onClick={() => setScanlinesEnabled((s) => !s)}
                          className="haven-toggle"
                        >
                          <span className="haven-toggle-thumb" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-[2rem] border-t border-white/12">
                  <span className="text-[1.3rem] text-[var(--muted)]">
                    HAVEN Spatial Home · {rooms.length} zones active
                  </span>
                  <button
                    type="button"
                    onClick={handleResetLiving}
                    className="px-[1.6rem] py-[0.8rem] rounded-full bg-white/12 border border-white/16 text-[1.35rem] font-semibold text-white hover:bg-white/20 transition-colors"
                  >
                    Restore defaults
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Bottom centre glass toast */}
      <Toast message={toastMsg} visible={toastVisible} />

      {/* ?rec mode custom frosted cursor */}
      {recMode && <RecCursor />}
    </>
  );
}
