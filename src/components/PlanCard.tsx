import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import {
  AMBER,
  AMBER_SOFT,
  BORDER,
  FREQ_ADV,
  GREEN,
  GREEN_SOFT,
  INK,
  MUTED,
  Plan,
  RED,
  RED_SOFT,
  fmtDate,
  money,
} from "../lib/plan";

function PlanCardBase({
  plan,
  onPress,
  compact,
}: {
  plan: Plan;
  onPress?: (p: Plan) => void;
  compact?: boolean;
}) {
  const done = plan.state === "COMPLETED";
  const ended = plan.state === "ENDED";
  const accent = done ? GREEN : ended ? AMBER : RED;
  const soft = done ? GREEN_SOFT : ended ? AMBER_SOFT : RED_SOFT;

  const badge = done
    ? "Completed"
    : ended
      ? "Time's up"
      : plan.daysLeft === 0
        ? "Ends today"
        : `${plan.daysLeft} day${plan.daysLeft === 1 ? "" : "s"} left`;

  return (
    <Pressable
      onPress={() => onPress?.(plan)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? "#FAFAFA" : "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 14,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 16, fontWeight: "800", color: INK }}
          >
            {plan.productName}
          </Text>
          <Text style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
            {plan.category}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: soft,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: accent, fontSize: 11, fontWeight: "800" }}>
            {badge}
          </Text>
        </View>
      </View>

      {/* progress */}
      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: "#F3F4F6",
          marginTop: 14,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 8,
            width: `${plan.progress}%`,
            backgroundColor: accent,
            borderRadius: 4,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <Text style={{ fontSize: 13, color: INK, fontWeight: "700" }}>
          {money(plan.savedAmount)}{" "}
          <Text style={{ color: MUTED, fontWeight: "600" }}>
            of {money(plan.targetAmount)}
          </Text>
        </Text>
        <Text style={{ fontSize: 13, color: accent, fontWeight: "800" }}>
          {plan.progress}%
        </Text>
      </View>

      {!compact && (
        <View style={{ marginTop: 10 }}>
          {ended ? (
            <Text style={{ fontSize: 12, color: AMBER, fontWeight: "700" }}>
              Ended {plan.daysOver} day{plan.daysOver === 1 ? "" : "s"} ago ·{" "}
              {money(plan.remainingAmount)} still to save
            </Text>
          ) : done ? (
            <Text style={{ fontSize: 12, color: GREEN, fontWeight: "700" }}>
              Goal reached
            </Text>
          ) : (
            <Text style={{ fontSize: 12, color: MUTED }}>
              Save {money(plan.installmentAmount)} {FREQ_ADV[plan.frequency]} ·
              Ends {fmtDate(plan.endDate)} · {money(plan.remainingAmount)} left
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default memo(PlanCardBase);
