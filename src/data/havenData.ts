export type RoomId = 'favorites' | 'living' | 'kitchen' | 'bathroom' | 'bedroom' | string;

export type RailSectionId = 'home' | 'lighting' | 'climate' | 'security' | 'settings';

export type DialStatusKind = 'heating' | 'cooling' | 'preheating' | 'off';

export interface RoomConfig {
  id: RoomId;
  label: string;
  tabIcon: 'heart' | 'sofa' | 'utensils' | 'bath' | 'bed' | 'spark';
  cameraKind: 'video' | 'image';
  cameraSrc: string;
  cameraPoster?: string;
  cameraLabel: string;
  dialTitle: string;
  dialSubtitle: string;
  dialDefault: number;
  dialMin: number;
  dialMax: number;
  ambientTemp: number;
  isOven?: boolean;
  sceneName: string;
  sceneSubtitle: string;
  sceneIcon: 'sun' | 'coffee' | 'droplet' | 'moon';
  sceneTargetTemp: number;
  sceneTargetBrightness: number;
  sceneToast: string;
  applianceTitle: string;
  applianceIdleStatus: string;
  applianceActiveStatus: string;
  applianceActiveSub: (pct: number) => string;
  applianceIcon: 'vacuum' | 'dishwasher' | 'towel' | 'purifier';
  lightsTitle: string;
  defaultBrightness: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
  cover: string;
}

export const ASSETS = {
  roomVideo:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261118_005751_ccbea518-0364-45d9-8951-be0c8e36bd0a.mp4',
  roomStill:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261118_005657_e8371ddf-b918-4539-b7c2-07cd5010e4e6.png&w=1920&q=85',
  kitchenCam:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261118_005653_23f1bd6a-f11f-492b-99af-c726f290bb4e.png&w=1100&q=85',
  bathroomCam:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261118_005653_c18141e3-13e9-4ca0-b182-094207ea14b2.png&w=1100&q=85',
  bedroomCam:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261118_005652_b7c02446-6122-4a60-bf93-2f968214b55e.png&w=1100&q=85',
  albumSlowBloom:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261118_005653_8b53b6f2-a379-434c-9c37-3766a3c6ae3f.png&w=400&q=85',
  albumSeaGlass:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261118_005653_bd9be7e9-7cc8-4336-9688-ba74f5a13e75.png&w=400&q=85',
  albumFernLight:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261118_005653_60c08159-38f9-4ed3-a13d-e9c65cee4f7b.png&w=400&q=85',
} as const;

export const INITIAL_ROOMS: RoomConfig[] = [
  {
    id: 'favorites',
    label: 'Favorites',
    tabIcon: 'heart',
    cameraKind: 'video',
    cameraSrc: ASSETS.roomVideo,
    cameraPoster: ASSETS.roomStill,
    cameraLabel: 'Living room',
    dialTitle: 'Thermostat',
    dialSubtitle: 'Target temperature',
    dialDefault: 22,
    dialMin: 16,
    dialMax: 30,
    ambientTemp: 20.5,
    sceneName: 'Morning',
    sceneSubtitle: 'Scene',
    sceneIcon: 'sun',
    sceneTargetTemp: 22,
    sceneTargetBrightness: 86,
    sceneToast: 'Morning scene · lights 86%, 22°, music on',
    applianceTitle: 'Robot vacuum',
    applianceIdleStatus: 'Docked',
    applianceActiveStatus: 'Cleaning',
    applianceActiveSub: (pct) => `Cleaning · ${pct}% done`,
    applianceIcon: 'vacuum',
    lightsTitle: 'Ceiling lights',
    defaultBrightness: 72,
  },
  {
    id: 'living',
    label: 'Living room',
    tabIcon: 'sofa',
    cameraKind: 'video',
    cameraSrc: ASSETS.roomVideo,
    cameraPoster: ASSETS.roomStill,
    cameraLabel: 'Living room',
    dialTitle: 'Thermostat',
    dialSubtitle: 'Target temperature',
    dialDefault: 22,
    dialMin: 16,
    dialMax: 30,
    ambientTemp: 20.5,
    sceneName: 'Morning',
    sceneSubtitle: 'Scene',
    sceneIcon: 'sun',
    sceneTargetTemp: 22,
    sceneTargetBrightness: 86,
    sceneToast: 'Morning scene · lights 86%, 22°, music on',
    applianceTitle: 'Robot vacuum',
    applianceIdleStatus: 'Docked',
    applianceActiveStatus: 'Cleaning',
    applianceActiveSub: (pct) => `Cleaning · ${pct}% done`,
    applianceIcon: 'vacuum',
    lightsTitle: 'Ceiling lights',
    defaultBrightness: 72,
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    tabIcon: 'utensils',
    cameraKind: 'image',
    cameraSrc: ASSETS.kitchenCam,
    cameraLabel: 'Kitchen',
    dialTitle: 'Oven',
    dialSubtitle: 'Target temperature',
    dialDefault: 180,
    dialMin: 50,
    dialMax: 250,
    ambientTemp: 180,
    isOven: true,
    sceneName: 'Breakfast',
    sceneSubtitle: 'Scene',
    sceneIcon: 'coffee',
    sceneTargetTemp: 180,
    sceneTargetBrightness: 86,
    sceneToast: 'Breakfast scene · lights 86%, 180°, music on',
    applianceTitle: 'Dishwasher',
    applianceIdleStatus: 'Idle',
    applianceActiveStatus: 'Washing',
    applianceActiveSub: (pct) => `Washing · ${pct}% done`,
    applianceIcon: 'dishwasher',
    lightsTitle: 'Pendant lights',
    defaultBrightness: 84,
  },
  {
    id: 'bathroom',
    label: 'Bathroom',
    tabIcon: 'bath',
    cameraKind: 'image',
    cameraSrc: ASSETS.bathroomCam,
    cameraLabel: 'Bathroom',
    dialTitle: 'Floor heat',
    dialSubtitle: 'Target temperature',
    dialDefault: 26,
    dialMin: 16,
    dialMax: 30,
    ambientTemp: 23,
    sceneName: 'Spa',
    sceneSubtitle: 'Scene',
    sceneIcon: 'droplet',
    sceneTargetTemp: 26,
    sceneTargetBrightness: 86,
    sceneToast: 'Spa scene · lights 86%, 26°, music on',
    applianceTitle: 'Towel warmer',
    applianceIdleStatus: 'Off',
    applianceActiveStatus: 'Warming',
    applianceActiveSub: (pct) => `Warming · ${pct}% done`,
    applianceIcon: 'towel',
    lightsTitle: 'Mirror light',
    defaultBrightness: 65,
  },
  {
    id: 'bedroom',
    label: 'Bedroom',
    tabIcon: 'bed',
    cameraKind: 'image',
    cameraSrc: ASSETS.bedroomCam,
    cameraLabel: 'Bedroom',
    dialTitle: 'Thermostat',
    dialSubtitle: 'Target temperature',
    dialDefault: 19,
    dialMin: 16,
    dialMax: 30,
    ambientTemp: 20.5,
    sceneName: 'Wind down',
    sceneSubtitle: 'Scene',
    sceneIcon: 'moon',
    sceneTargetTemp: 19,
    sceneTargetBrightness: 42,
    sceneToast: 'Wind down scene · lights 42%, 19°, music on',
    applianceTitle: 'Air purifier',
    applianceIdleStatus: 'Standby',
    applianceActiveStatus: 'Purifying',
    applianceActiveSub: (pct) => `Purifying · ${pct}% done`,
    applianceIcon: 'purifier',
    lightsTitle: 'Bedside lamps',
    defaultBrightness: 48,
  },
];

export const TRACKS: Track[] = [
  {
    id: 'slow-bloom',
    title: 'Slow Bloom',
    artist: 'Nami',
    durationSec: 204,
    cover: ASSETS.albumSlowBloom,
  },
  {
    id: 'sea-glass',
    title: 'Sea Glass',
    artist: 'Oda Marin',
    durationSec: 238,
    cover: ASSETS.albumSeaGlass,
  },
  {
    id: 'fern-light',
    title: 'Fern Light',
    artist: 'Juniper',
    durationSec: 189,
    cover: ASSETS.albumFernLight,
  },
];

export const RAIL_ITEMS: { id: RailSectionId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'climate', label: 'Climate' },
  { id: 'security', label: 'Security' },
  { id: 'settings', label: 'Settings' },
];
