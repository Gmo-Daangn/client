import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/src/constants/colors';

type Props = {
  temperature: number;
};

function getColor(temperature: number) {
  if (temperature >= 65) return '#08D9D6';
  if (temperature >= 45) return '#3DB7CC';
  if (temperature >= 36.5) return '#3DB75B';
  if (temperature >= 30) return '#F5A623';
  return '#FF4D4D';
}

export function MannerTemperature({ temperature }: Props) {
  const color = getColor(temperature);
  const percent = Math.min(100, Math.max(0, (temperature / 99) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.temperature, { color }]}>{temperature.toFixed(1)}°C</Text>
        <Text style={styles.label}>매너온도</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  temperature: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  bar: {
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
