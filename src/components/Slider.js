import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { colors } from '../theme';

// A smooth, continuous slider built on PanResponder (no native module).
// Reports a float value in [min, max]; onChange fires while dragging,
// onComplete fires once on release (good for persisting).
export default function Slider({ value, min = 1, max = 5, onChange, onComplete }) {
  const widthRef = useRef(1);
  const onChangeRef = useRef(onChange);
  const onCompleteRef = useRef(onComplete);
  onChangeRef.current = onChange;
  onCompleteRef.current = onComplete;

  const valueFromX = (x) => {
    const w = widthRef.current || 1;
    const clamped = Math.max(0, Math.min(w, x));
    return min + (clamped / w) * (max - min);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        onChangeRef.current && onChangeRef.current(valueFromX(e.nativeEvent.locationX));
      },
      onPanResponderMove: (e) => {
        onChangeRef.current && onChangeRef.current(valueFromX(e.nativeEvent.locationX));
      },
      onPanResponderRelease: (e) => {
        const v = valueFromX(e.nativeEvent.locationX);
        onChangeRef.current && onChangeRef.current(v);
        onCompleteRef.current && onCompleteRef.current(v);
      },
      onPanResponderTerminate: (e) => {
        onCompleteRef.current && onCompleteRef.current(valueFromX(e.nativeEvent.locationX));
      },
    })
  ).current;

  const frac = Math.max(0, Math.min(1, (value - min) / (max - min)));

  return (
    <View
      style={styles.hit}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
      }}
      {...pan.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${frac * 100}%` }]} />
      </View>
      <View style={[styles.thumb, { left: `${frac * 100}%` }]} />
    </View>
  );
}

const THUMB = 22;

const styles = StyleSheet.create({
  hit: { height: 40, justifyContent: 'center' },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.surfaceHi, overflow: 'hidden' },
  fill: { height: 5, backgroundColor: colors.white },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.white,
    marginLeft: -THUMB / 2,
    top: (40 - THUMB) / 2,
    borderWidth: 3,
    borderColor: colors.bg,
  },
});
