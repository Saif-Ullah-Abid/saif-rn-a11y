import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#ffffff",
    flex: 1,
  },
  lowContrastLabel: {
    color: "#cccccc",
    fontSize: 14,
  },
  goodLabel: {
    color: "#111111",
    fontSize: 14,
  },
  tinyButton: {
    width: 20,
    height: 20,
  },
  goodButton: {
    width: 50,
    height: 50,
  },
});

export function ExampleScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.lowContrastLabel}>Hard to read text</Text>
      <Text style={styles.goodLabel}>Easy to read text</Text>

      <TouchableOpacity style={styles.tinyButton}>
        <Text>Tiny</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.goodButton}>
        <Text>Big</Text>
      </TouchableOpacity>

      <Pressable>
        <Icon name="close" />
      </Pressable>

      <Pressable accessibilityLabel="Close dialog">
        <Icon name="close" />
      </Pressable>
    </View>
  );
}
