import { useEffect, useRef } from "react";
import { Animated, Easing, StatusBar, View } from "react-native";

const RED = "#C8102E";
const RING_SOFT = "#FDECEF";

// Full screen loader: pulsing HGB logo inside a spinning ring
export default function Loader() {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View
        style={{
          width: 170,
          height: 170,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            width: 170,
            height: 170,
            borderRadius: 85,
            borderWidth: 4,
            borderColor: RING_SOFT,
            borderTopColor: RED,
            transform: [{ rotate }],
          }}
        />
        <Animated.Image
          source={require("../../assets/Logo/hgb.png")}
          style={{ width: 110, height: 54, transform: [{ scale }] }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}
