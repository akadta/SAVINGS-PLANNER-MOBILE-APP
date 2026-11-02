import { View } from "react-native";

// Piggy bank drawn with plain Views (no icon library)
export default function Piggy({
  size = 100,
  color = "#FFFFFF",
  detail = "#C8102E",
}: {
  size?: number;
  color?: string;
  detail?: string;
}) {
  const s = size / 100;
  const abs = { position: "absolute" as const };

  return (
    <View style={{ width: 100 * s, height: 80 * s }}>
      {/* tail */}
      <View
        style={{
          ...abs,
          left: 2 * s,
          top: 30 * s,
          width: 12 * s,
          height: 12 * s,
          borderRadius: 6 * s,
          borderWidth: 3 * s,
          borderColor: color,
        }}
      />
      {/* legs */}
      <View
        style={{
          ...abs,
          left: 24 * s,
          top: 58 * s,
          width: 12 * s,
          height: 20 * s,
          borderRadius: 4 * s,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          ...abs,
          left: 58 * s,
          top: 58 * s,
          width: 12 * s,
          height: 20 * s,
          borderRadius: 4 * s,
          backgroundColor: color,
        }}
      />
      {/* body */}
      <View
        style={{
          ...abs,
          left: 8 * s,
          top: 16 * s,
          width: 76 * s,
          height: 54 * s,
          borderRadius: 27 * s,
          backgroundColor: color,
        }}
      />
      {/* ear */}
      <View
        style={{
          ...abs,
          left: 58 * s,
          top: 8 * s,
          width: 16 * s,
          height: 16 * s,
          borderRadius: 4 * s,
          backgroundColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
      {/* snout */}
      <View
        style={{
          ...abs,
          left: 78 * s,
          top: 34 * s,
          width: 20 * s,
          height: 18 * s,
          borderRadius: 8 * s,
          backgroundColor: color,
        }}
      />
      {/* nostrils */}
      <View
        style={{
          ...abs,
          left: 84 * s,
          top: 40 * s,
          width: 3 * s,
          height: 5 * s,
          borderRadius: 2 * s,
          backgroundColor: detail,
        }}
      />
      <View
        style={{
          ...abs,
          left: 91 * s,
          top: 40 * s,
          width: 3 * s,
          height: 5 * s,
          borderRadius: 2 * s,
          backgroundColor: detail,
        }}
      />
      {/* eye */}
      <View
        style={{
          ...abs,
          left: 66 * s,
          top: 32 * s,
          width: 6 * s,
          height: 6 * s,
          borderRadius: 3 * s,
          backgroundColor: detail,
        }}
      />
      {/* coin slot */}
      <View
        style={{
          ...abs,
          left: 30 * s,
          top: 26 * s,
          width: 26 * s,
          height: 5 * s,
          borderRadius: 2.5 * s,
          backgroundColor: detail,
        }}
      />
    </View>
  );
}
