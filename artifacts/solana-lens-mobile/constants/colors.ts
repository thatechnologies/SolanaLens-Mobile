/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#F3F4F8',
    tint: '#8B6CFF',
    background: '#0B0D13',
    foreground: '#F3F4F8',
    card: '#12151D',
    cardForeground: '#F3F4F8',
    primary: '#8B6CFF',
    primaryForeground: '#FFFFFF',
    secondary: '#191D28',
    secondaryForeground: '#F3F4F8',
    muted: '#191D28',
    mutedForeground: '#8B91A4',
    accent: '#5B8CFF',
    accentForeground: '#FFFFFF',
    destructive: '#FF6B7A',
    destructiveForeground: '#FFFFFF',
    border: '#232837',
    input: '#232837',
    positive: '#3ECF8E',
    positiveSoft: '#19352D',
    negative: '#FF6B7A',
    negativeSoft: '#3B2029',
    faint: '#565C70',
    surface3: '#20242F',
  },
  dark: {
    text: '#F3F4F8',
    tint: '#8B6CFF',
    background: '#0B0D13',
    foreground: '#F3F4F8',
    card: '#12151D',
    cardForeground: '#F3F4F8',
    primary: '#8B6CFF',
    primaryForeground: '#FFFFFF',
    secondary: '#191D28',
    secondaryForeground: '#F3F4F8',
    muted: '#191D28',
    mutedForeground: '#8B91A4',
    accent: '#5B8CFF',
    accentForeground: '#FFFFFF',
    destructive: '#FF6B7A',
    destructiveForeground: '#FFFFFF',
    border: '#232837',
    input: '#232837',
    positive: '#3ECF8E',
    positiveSoft: '#19352D',
    negative: '#FF6B7A',
    negativeSoft: '#3B2029',
    faint: '#565C70',
    surface3: '#20242F',
  },
  radius: 20,
};

export default colors;
