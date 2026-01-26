export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // New nested structure
  bg: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  component: {
    background: string;
    border: string;
    borderHover: string;
    hover: string;
    active: string;
  };
  semantic: {
    primary: string;
    primaryHover: string;
    secondary: string;
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    error: string;
    errorLight: string;
    info: string;
    infoLight: string;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };

  // Old flat structure for compatibility
  background: string;
  white: string;
  primary: string;
  textMain: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
}

export interface ThemeShadows {
  card: string;
}

export interface Theme {
  colors: ThemeColors;
  shadows: ThemeShadows;
}

const lightColors: ThemeColors = {
  bg: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    overlay: 'rgba(0, 0, 0, 0.4)',
  },
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
  },
  component: {
    background: '#FFFFFF',
    border: '#E2E8F0',
    borderHover: '#CBD5E1',
    hover: '#F1F5F9',
    active: '#E2E8F0',
  },
  semantic: {
    primary: '#4B70F5',
    primaryHover: '#3B5FE5',
    secondary: '#F69B42',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  // Old flat properties
  background: "#F8FAFF",
  white: "#FFFFFF",
  primary: "#4B8BFF",
  textMain: "#1A1D1F",
  textSecondary: "#6F767E",
  border: "#EDF1F5",
  success: "#45B36B",
  warning: "#FFBC99",
};

const darkColors: ThemeColors = {
  bg: {
    primary: '#0F172A',
    secondary: '#1E293B',
    tertiary: '#334155',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    inverse: '#0F172A',
  },
  component: {
    background: '#1E293B',
    border: '#334155',
    borderHover: '#475569',
    hover: '#334155',
    active: '#475569',
  },
  semantic: {
    primary: '#60A5FA',
    primaryHover: '#3B82F6',
    secondary: '#FB923C',
    success: '#34D399',
    successLight: 'rgba(52, 211, 153, 0.1)',
    warning: '#FBBF24',
    warningLight: 'rgba(251, 191, 36, 0.1)',
    error: '#F87171',
    errorLight: 'rgba(248, 113, 113, 0.1)',
    info: '#60A5FA',
    infoLight: 'rgba(96, 165, 250, 0.1)',
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
  },

  // Dark mode flat counterparts (approximated)
  background: "#0F172A",
  white: "#1E293B",
  primary: "#60A5FA",
  textMain: "#F8FAFC",
  textSecondary: "#94A3B8",
  border: "#334155",
  success: "#34D399",
  warning: "#FBBF24",
};

const shadows: ThemeShadows = {
  card: "0px 4px 12px rgba(0, 0, 0, 0.03)",
};

export const themes: Record<ThemeMode, Theme> = {
  light: { colors: lightColors, shadows },
  dark: { colors: darkColors, shadows },
};

export const theme = themes.light;