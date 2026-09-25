import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius } from '../theme';

// Catches JS render errors so a bad state can't hard-crash the whole app —
// it shows a recoverable screen instead.
export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch() {}

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.msg}>The app hit an unexpected error. Tap reload to keep going.</Text>
          <Pressable style={styles.btn} onPress={this.reset}>
            <Text style={styles.btnText}>Reload</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  msg: { color: colors.textDim, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 10 },
  btn: { marginTop: 24, backgroundColor: colors.white, paddingHorizontal: 26, paddingVertical: 14, borderRadius: radius.pill },
  btnText: { color: colors.black, fontWeight: '800', fontSize: 15 },
});
