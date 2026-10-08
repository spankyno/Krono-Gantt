import { ThemePalette, ColorMode, TaskStatus, TaskPriority } from '../types/gantt';

export interface ThemeConfig {
  name: string;
  id: ThemePalette;
  description: string;
  colors: {
    bgApp: string;
    bgHeader: string;
    bgSurface: string;
    bgSurfaceHover: string;
    bgTimeline: string;
    border: string;
    borderLight: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryHover: string;
    gridLine: string;
    weekendBg: string;
    todayLine: string;
    dependencyLine: string;
    dependencyArrow: string;
    baselineBar: string;
    baselineBorder: string;
    statusBar: {
      todo: string;
      in_progress: string;
      review: string;
      done: string;
      blocked: string;
    };
  };
}

export const THEME_CONFIGS: Record<ColorMode, Record<ThemePalette, ThemeConfig>> = {
  dark: {
    pastel: {
      id: 'pastel',
      name: 'Pastel Suave',
      description: 'Tonos relajantes en lavanda, menta y melocotón',
      colors: {
        bgApp: '#13111C',
        bgHeader: '#1A1826',
        bgSurface: '#1F1C2E',
        bgSurfaceHover: '#2A263D',
        bgTimeline: '#14121F',
        border: '#2E2A42',
        borderLight: '#3D3757',
        textPrimary: '#F1EFFF',
        textSecondary: '#C5C0E0',
        textMuted: '#8D87AF',
        primary: '#A78BFA',
        primaryHover: '#C4B5FD',
        gridLine: '#262238',
        weekendBg: 'rgba(167, 139, 250, 0.04)',
        todayLine: '#F472B6',
        dependencyLine: '#A78BFA',
        dependencyArrow: '#C4B5FD',
        baselineBar: 'rgba(255, 255, 255, 0.16)',
        baselineBorder: 'rgba(255, 255, 255, 0.35)',
        statusBar: {
          todo: '#818CF8',
          in_progress: '#38BDF8',
          review: '#FBBF24',
          done: '#34D399',
          blocked: '#FB7185',
        },
      },
    },
    corporate: {
      id: 'corporate',
      name: 'Corporativa Formal',
      description: 'Azul cobalto, pizarra y esmeralda de grado ejecutivo',
      colors: {
        bgApp: '#0B0F17',
        bgHeader: '#111827',
        bgSurface: '#151F30',
        bgSurfaceHover: '#1E2C42',
        bgTimeline: '#0D131E',
        border: '#1F2E45',
        borderLight: '#2D3E5B',
        textPrimary: '#F0F6FC',
        textSecondary: '#CBD5E1',
        textMuted: '#64748B',
        primary: '#2563EB',
        primaryHover: '#3B82F6',
        gridLine: '#162234',
        weekendBg: 'rgba(37, 99, 235, 0.05)',
        todayLine: '#38BDF8',
        dependencyLine: '#60A5FA',
        dependencyArrow: '#93C5FD',
        baselineBar: 'rgba(148, 163, 184, 0.18)',
        baselineBorder: 'rgba(148, 163, 184, 0.4)',
        statusBar: {
          todo: '#64748B',
          in_progress: '#2563EB',
          review: '#D97706',
          done: '#059669',
          blocked: '#DC2626',
        },
      },
    },
    neon: {
      id: 'neon',
      name: 'Neón Minimalista',
      description: 'Estética ciberpunk moderna inspirada en Linear y Raycast',
      colors: {
        bgApp: '#08080C',
        bgHeader: '#0E0E15',
        bgSurface: '#14141F',
        bgSurfaceHover: '#1D1D2D',
        bgTimeline: '#0A0A0F',
        border: '#232336',
        borderLight: '#32324C',
        textPrimary: '#FFFFFF',
        textSecondary: '#A0A0BA',
        textMuted: '#666680',
        primary: '#6366F1',
        primaryHover: '#818CF8',
        gridLine: '#1A1A28',
        weekendBg: 'rgba(99, 102, 241, 0.05)',
        todayLine: '#06B6D4',
        dependencyLine: '#818CF8',
        dependencyArrow: '#A5B4FC',
        baselineBar: 'rgba(255, 255, 255, 0.14)',
        baselineBorder: 'rgba(255, 255, 255, 0.3)',
        statusBar: {
          todo: '#6366F1',
          in_progress: '#06B6D4',
          review: '#F59E0B',
          done: '#10B981',
          blocked: '#F43F5E',
        },
      },
    },
    neutral: {
      id: 'neutral',
      name: 'Neutral Profesional',
      description: 'Monocromo elegante con gris carbón y acentos plata',
      colors: {
        bgApp: '#0A0A0A',
        bgHeader: '#141414',
        bgSurface: '#1A1A1A',
        bgSurfaceHover: '#262626',
        bgTimeline: '#0D0D0D',
        border: '#2A2A2A',
        borderLight: '#3A3A3A',
        textPrimary: '#EDEDED',
        textSecondary: '#A1A1AA',
        textMuted: '#71717A',
        primary: '#E4E4E7',
        primaryHover: '#FFFFFF',
        gridLine: '#1E1E1E',
        weekendBg: 'rgba(255, 255, 255, 0.02)',
        todayLine: '#38BDF8',
        dependencyLine: '#A1A1AA',
        dependencyArrow: '#D4D4D8',
        baselineBar: 'rgba(255, 255, 255, 0.15)',
        baselineBorder: 'rgba(255, 255, 255, 0.35)',
        statusBar: {
          todo: '#71717A',
          in_progress: '#38BDF8',
          review: '#EAB308',
          done: '#22C55E',
          blocked: '#EF4444',
        },
      },
    },
  },
  light: {
    pastel: {
      id: 'pastel',
      name: 'Pastel Suave',
      description: 'Tonos suaves y claros',
      colors: {
        bgApp: '#F8F7FF',
        bgHeader: '#FFFFFF',
        bgSurface: '#FFFFFF',
        bgSurfaceHover: '#F1EFFF',
        bgTimeline: '#FAF9FF',
        border: '#E4E0F4',
        borderLight: '#D2CCEB',
        textPrimary: '#201A38',
        textSecondary: '#574F75',
        textMuted: '#8D84AE',
        primary: '#8B5CF6',
        primaryHover: '#7C3AED',
        gridLine: '#EEEBFA',
        weekendBg: 'rgba(139, 92, 246, 0.04)',
        todayLine: '#EC4899',
        dependencyLine: '#8B5CF6',
        dependencyArrow: '#7C3AED',
        baselineBar: 'rgba(0, 0, 0, 0.12)',
        baselineBorder: 'rgba(0, 0, 0, 0.25)',
        statusBar: {
          todo: '#818CF8',
          in_progress: '#0284C7',
          review: '#D97706',
          done: '#10B981',
          blocked: '#E11D48',
        },
      },
    },
    corporate: {
      id: 'corporate',
      name: 'Corporativa Formal',
      description: 'Blanco nítido, azul institucional y gris slate',
      colors: {
        bgApp: '#F8FAFC',
        bgHeader: '#FFFFFF',
        bgSurface: '#FFFFFF',
        bgSurfaceHover: '#F1F5F9',
        bgTimeline: '#F8FAFC',
        border: '#E2E8F0',
        borderLight: '#CBD5E1',
        textPrimary: '#0F172A',
        textSecondary: '#475569',
        textMuted: '#94A3B8',
        primary: '#1D4ED8',
        primaryHover: '#1E40AF',
        gridLine: '#E2E8F0',
        weekendBg: 'rgba(29, 78, 216, 0.04)',
        todayLine: '#0284C7',
        dependencyLine: '#3B82F6',
        dependencyArrow: '#1D4ED8',
        baselineBar: 'rgba(100, 116, 139, 0.14)',
        baselineBorder: 'rgba(100, 116, 139, 0.3)',
        statusBar: {
          todo: '#64748B',
          in_progress: '#2563EB',
          review: '#D97706',
          done: '#059669',
          blocked: '#DC2626',
        },
      },
    },
    neon: {
      id: 'neon',
      name: 'Neón Minimalista',
      description: 'Limpio con detalles contrastantes',
      colors: {
        bgApp: '#FAFAFC',
        bgHeader: '#FFFFFF',
        bgSurface: '#FFFFFF',
        bgSurfaceHover: '#F3F4F9',
        bgTimeline: '#FAFAFC',
        border: '#E5E7EB',
        borderLight: '#D1D5DB',
        textPrimary: '#111827',
        textSecondary: '#4B5563',
        textMuted: '#9CA3AF',
        primary: '#4F46E5',
        primaryHover: '#4338CA',
        gridLine: '#F3F4F6',
        weekendBg: 'rgba(79, 70, 229, 0.04)',
        todayLine: '#0891B2',
        dependencyLine: '#6366F1',
        dependencyArrow: '#4F46E5',
        baselineBar: 'rgba(0, 0, 0, 0.12)',
        baselineBorder: 'rgba(0, 0, 0, 0.25)',
        statusBar: {
          todo: '#6366F1',
          in_progress: '#0891B2',
          review: '#D97706',
          done: '#059669',
          blocked: '#E11D48',
        },
      },
    },
    neutral: {
      id: 'neutral',
      name: 'Neutral Profesional',
      description: 'Estilo Notion sobrio en blanco y grafito',
      colors: {
        bgApp: '#FFFFFF',
        bgHeader: '#FFFFFF',
        bgSurface: '#FFFFFF',
        bgSurfaceHover: '#F7F7F8',
        bgTimeline: '#FAFAFA',
        border: '#E5E5E5',
        borderLight: '#D4D4D4',
        textPrimary: '#171717',
        textSecondary: '#525252',
        textMuted: '#A3A3A3',
        primary: '#171717',
        primaryHover: '#000000',
        gridLine: '#EEEEEE',
        weekendBg: 'rgba(0, 0, 0, 0.02)',
        todayLine: '#0284C7',
        dependencyLine: '#737373',
        dependencyArrow: '#404040',
        baselineBar: 'rgba(0, 0, 0, 0.12)',
        baselineBorder: 'rgba(0, 0, 0, 0.28)',
        statusBar: {
          todo: '#737373',
          in_progress: '#0284C7',
          review: '#CA8A04',
          done: '#16A34A',
          blocked: '#DC2626',
        },
      },
    },
  },
};

export function getTheme(mode: ColorMode, palette: ThemePalette): ThemeConfig {
  return THEME_CONFIGS[mode]?.[palette] || THEME_CONFIGS.dark.neon;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Por Hacer',
  in_progress: 'En Progreso',
  review: 'En Revisión',
  done: 'Completada',
  blocked: 'Bloqueada',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#64748B',
  medium: '#38BDF8',
  high: '#F59E0B',
  urgent: '#EF4444',
};
