import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ReadingTheme } from '../theme/themes';

interface Props {
  title?: string;
  body: string;
  dateLabel?: string;
  theme: ReadingTheme;
}

/**
 * Renders a single page (title + body) in a given reading theme.
 * Handles a small subset of markdown: blank lines, "- "/"* " bullets,
 * and "#"-prefixed subheadings. Inline bold/italic markers are stripped.
 */
export function PageView({ title, body, dateLabel, theme }: Props) {
  return (
    <View
      style={[
        styles.page,
        { backgroundColor: theme.pageColor },
        theme.dashedBorder && {
          borderWidth: 2,
          borderColor: theme.ruleColor,
          borderStyle: 'dashed',
          borderRadius: 6,
        },
      ]}
    >
      {/* Notebook-style left margin rule for the Journal theme. */}
      {theme.ruled && (
        <View style={[styles.marginRule, { backgroundColor: theme.accent }]} />
      )}

      {!!dateLabel && (
        <Text
          style={[styles.date, { color: theme.mutedInk, fontFamily: theme.bodyFont }]}
        >
          {dateLabel}
        </Text>
      )}

      {!!title && (
        <Text
          style={[
            styles.title,
            {
              color: theme.inkColor,
              fontFamily: theme.titleFont,
              fontSize: theme.titleSize,
              letterSpacing: theme.letterSpacing,
            },
          ]}
        >
          {title}
        </Text>
      )}

      <View style={styles.body}>{renderBody(body, theme)}</View>
    </View>
  );
}

function stripInline(text: string): string {
  return text.replace(/\*\*/g, '').replace(/__/g, '').replace(/`/g, '');
}

function renderBody(body: string, theme: ReadingTheme): React.ReactNode {
  const baseText = {
    color: theme.inkColor,
    fontFamily: theme.bodyFont,
    fontSize: theme.bodySize,
    lineHeight: theme.bodyLineHeight,
    letterSpacing: theme.letterSpacing,
  };

  return body.split('\n').map((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <View key={i} style={{ height: theme.bodySize * 0.6 }} />;
    }

    // Subheading: leading #'s
    if (/^#{1,6}\s+/.test(trimmed)) {
      return (
        <Text
          key={i}
          style={[
            baseText,
            { fontFamily: theme.titleFont, fontSize: theme.bodySize + 4, marginTop: 8, marginBottom: 2 },
          ]}
        >
          {stripInline(trimmed.replace(/^#{1,6}\s+/, ''))}
        </Text>
      );
    }

    // Bullet line
    if (/^[-*]\s+/.test(trimmed)) {
      return (
        <View key={i} style={styles.bulletRow}>
          <Text style={[baseText, styles.bulletDot]}>•</Text>
          <Text style={[baseText, styles.bulletText]}>
            {stripInline(trimmed.replace(/^[-*]\s+/, ''))}
          </Text>
        </View>
      );
    }

    // Paragraph
    return (
      <Text key={i} style={[baseText, styles.paragraph]}>
        {stripInline(trimmed)}
      </Text>
    );
  });
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 36,
    paddingBottom: 40,
  },
  marginRule: {
    position: 'absolute',
    left: 18,
    top: 0,
    bottom: 0,
    width: 1.5,
    opacity: 0.3,
  },
  date: {
    fontSize: 14,
    marginBottom: 10,
  },
  title: {
    marginBottom: 16,
  },
  body: {
    flex: 1,
  },
  paragraph: {
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletDot: {
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    marginBottom: 0,
  },
});
