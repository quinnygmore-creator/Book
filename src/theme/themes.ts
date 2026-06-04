/**
 * Theme system — the four reading themes that make a page feel like a
 * book instead of a text box. Each theme is a complete typographic +
 * color treatment. Font family names match the keys loaded in App.tsx.
 */

export type ThemeId = 'journal' | 'handwritten' | 'minimal' | 'sketchbook';

export interface ReadingTheme {
  id: ThemeId;
  name: string;

  // Page surface
  pageColor: string;
  inkColor: string;
  mutedInk: string;
  accent: string;
  ruleColor: string;

  // Typography
  titleFont: string;
  bodyFont: string;
  titleSize: number;
  bodySize: number;
  bodyLineHeight: number;
  letterSpacing: number;

  // Decorations
  ruled: boolean; // notebook-style left margin rule (journal)
  dashedBorder: boolean; // sketchbook frame
}

export const THEMES: Record<ThemeId, ReadingTheme> = {
  journal: {
    id: 'journal',
    name: 'Journal',
    pageColor: '#FBF6EC',
    inkColor: '#3A332B',
    mutedInk: '#9C9081',
    accent: '#A8754F',
    ruleColor: '#E8DDC9',
    titleFont: 'PlayfairDisplay_700Bold',
    bodyFont: 'Lora_400Regular',
    titleSize: 30,
    bodySize: 18,
    bodyLineHeight: 30,
    letterSpacing: 0,
    ruled: true,
    dashedBorder: false,
  },
  handwritten: {
    id: 'handwritten',
    name: 'Handwritten',
    pageColor: '#FCFBF7',
    inkColor: '#27364B',
    mutedInk: '#8794A3',
    accent: '#3E5C76',
    ruleColor: '#DCE3EC',
    titleFont: 'Caveat_700Bold',
    bodyFont: 'Caveat_400Regular',
    titleSize: 42,
    bodySize: 24,
    bodyLineHeight: 34,
    letterSpacing: 0.3,
    ruled: false,
    dashedBorder: false,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    pageColor: '#FFFFFF',
    inkColor: '#1C1C1E',
    mutedInk: '#A0A0A6',
    accent: '#1C1C1E',
    ruleColor: '#EEEEEF',
    titleFont: 'Inter_600SemiBold',
    bodyFont: 'Inter_400Regular',
    titleSize: 24,
    bodySize: 17,
    bodyLineHeight: 28,
    letterSpacing: -0.2,
    ruled: false,
    dashedBorder: false,
  },
  sketchbook: {
    id: 'sketchbook',
    name: 'Sketchbook',
    pageColor: '#F4F1EA',
    inkColor: '#2B2622',
    mutedInk: '#9A9081',
    accent: '#C0492F',
    ruleColor: '#D8D1C4',
    titleFont: 'PatrickHand_400Regular',
    bodyFont: 'PatrickHand_400Regular',
    titleSize: 32,
    bodySize: 20,
    bodyLineHeight: 30,
    letterSpacing: 0.2,
    ruled: false,
    dashedBorder: true,
  },
};

export const DEFAULT_THEME: ThemeId = 'journal';
export const THEME_LIST: ReadingTheme[] = Object.values(THEMES);

export function getTheme(id?: string): ReadingTheme {
  return (id && THEMES[id as ThemeId]) || THEMES[DEFAULT_THEME];
}
