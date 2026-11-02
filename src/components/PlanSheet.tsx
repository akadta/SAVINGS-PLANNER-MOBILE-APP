import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, getApiError } from "../lib/api";
import {
  AMBER,
  AMBER_SOFT,
  BORDER,
  Deposit,
  FREQ_ADV,
  GREEN,
  GREEN_SOFT,
  INK,
  MUTED,
  Plan,
  RED,
  RED_DARK,
  RED_SOFT,
  fmtDate,
  fmtDateTime,
  money,
} from "../lib/plan";

export default function PlanSheet({
  plan,
  onClose,
  onChanged,
}: {
  plan: Plan | null;
  onClose: () => void;
  onChanged: (p: Plan) => void;
}) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);

  const planId = plan?.id;

  useEffect(() => {
    if (!planId) return;
    setAmount("");
    setError("");
    setMsg("");
    setDeposits([]);
    let active = true;
    (async () => {
      try {
        setLoadingDeposits(true);
        const { data } = await api.get(`/plans/${planId}`);
        if (active) setDeposits(data.data.deposits || []);
      } catch {
        // history is optional
      } finally {
        if (active) setLoadingDeposits(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [planId]);

  if (!plan) return null;

  const done = plan.state === "COMPLETED";
  const ended = plan.state === "ENDED";
  const accent = done ? GREEN : ended ? AMBER : RED;
  const typed = Number(amount) || 0;
  const after = Math.max(
    0,
    Math.round((plan.remainingAmount - typed) * 100) / 100,
  );

  const submit = async () => {
    setError("");
    setMsg("");
    if (!(typed > 0)) return setError("Enter an amount");
    if (typed > plan.remainingAmount + 0.001)
      return setError(`Only ${money(plan.remainingAmount)} is remaining`);

    try {
      setSaving(true);
      const { data } = await api.post(`/plans/${plan.id}/deposits`, {
        amount: typed,
      });
      onChanged(data.data);
      setDeposits((d) => [data.deposit, ...d]);
      setAmount("");
      setMsg(
        data.data.state === "COMPLETED"
          ? "Plan completed. Goal reached!"
          : `Added ${money(typed)}. ${money(data.data.remainingAmount)} to go.`,
      );
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const quick = Math.min(plan.installmentAmount, plan.remainingAmount);

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        />

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "90%",
            paddingBottom: insets.bottom + 12,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 44,
              height: 5,
              borderRadius: 3,
              backgroundColor: BORDER,
              marginTop: 10,
            }}
          />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: INK }}>
                  {plan.productName}
                </Text>
                <Text style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                  {plan.category} · Save {money(plan.installmentAmount)}{" "}
                  {FREQ_ADV[plan.frequency]}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10}>
                <Text style={{ color: RED, fontWeight: "800", fontSize: 14 }}>
                  Close
                </Text>
              </Pressable>
            </View>

            {ended && (
              <View
                style={{
                  backgroundColor: AMBER_SOFT,
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 14,
                }}
              >
                <Text style={{ color: AMBER, fontWeight: "800", fontSize: 13 }}>
                  This plan ended {plan.daysOver} day
                  {plan.daysOver === 1 ? "" : "s"} ago on{" "}
                  {fmtDate(plan.endDate)}. {money(plan.remainingAmount)} is
                  still pending. You can keep adding.
                </Text>
              </View>
            )}
            {done && (
              <View
                style={{
                  backgroundColor: GREEN_SOFT,
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 14,
                }}
              >
                <Text style={{ color: GREEN, fontWeight: "800", fontSize: 13 }}>
                  Plan completed. You saved the full amount.
                </Text>
              </View>
            )}

            {/* numbers */}
            <View
              style={{
                flexDirection: "row",
                marginTop: 16,
                backgroundColor: "#F9FAFB",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: MUTED, fontWeight: "600" }}>
                  Saved
                </Text>
                <Text style={{ fontSize: 16, color: INK, fontWeight: "800" }}>
                  {money(plan.savedAmount)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: MUTED, fontWeight: "600" }}>
                  Target
                </Text>
                <Text style={{ fontSize: 16, color: INK, fontWeight: "800" }}>
                  {money(plan.targetAmount)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: MUTED, fontWeight: "600" }}>
                  Remaining
                </Text>
                <Text
                  style={{ fontSize: 16, color: accent, fontWeight: "800" }}
                >
                  {money(plan.remainingAmount)}
                </Text>
              </View>
            </View>

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
            <Text style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
              {plan.progress}% done ·{" "}
              {done
                ? "completed"
                : ended
                  ? "ended"
                  : `${plan.daysLeft} day${plan.daysLeft === 1 ? "" : "s"} left`}{" "}
              · ends {fmtDate(plan.endDate)}
            </Text>

            {plan.description ? (
              <Text style={{ fontSize: 13, color: MUTED, marginTop: 10 }}>
                {plan.description}
              </Text>
            ) : null}

            {/* add amount */}
            {!done && (
              <View style={{ marginTop: 18 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: INK }}>
                  Add savings
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={(t) => {
                    setAmount(t.replace(/[^0-9.]/g, ""));
                    setError("");
                    setMsg("");
                  }}
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  style={{
                    marginTop: 8,
                    borderWidth: 1.5,
                    borderColor: error ? RED : BORDER,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 18,
                    fontWeight: "700",
                    color: INK,
                  }}
                />

                <View style={{ flexDirection: "row", marginTop: 10 }}>
                  <Pressable
                    onPress={() => setAmount(String(quick))}
                    style={{
                      backgroundColor: RED_SOFT,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      marginRight: 8,
                    }}
                  >
                    <Text
                      style={{ color: RED, fontWeight: "800", fontSize: 12 }}
                    >
                      {money(quick)}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAmount(String(plan.remainingAmount))}
                    style={{
                      backgroundColor: RED_SOFT,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{ color: RED, fontWeight: "800", fontSize: 12 }}
                    >
                      Full remaining
                    </Text>
                  </Pressable>
                </View>

                {typed > 0 && !error ? (
                  <Text
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      color: INK,
                      fontWeight: "700",
                    }}
                  >
                    Remaining after this:{" "}
                    <Text style={{ color: after === 0 ? GREEN : RED }}>
                      {money(after)}
                    </Text>
                  </Text>
                ) : null}
                {error ? (
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: RED_DARK,
                      fontWeight: "700",
                    }}
                  >
                    {error}
                  </Text>
                ) : null}
                {msg ? (
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: GREEN,
                      fontWeight: "700",
                    }}
                  >
                    {msg}
                  </Text>
                ) : null}

                <Pressable
                  onPress={submit}
                  disabled={saving}
                  style={({ pressed }) => ({
                    marginTop: 14,
                    backgroundColor: pressed || saving ? RED_DARK : RED,
                    paddingVertical: 15,
                    borderRadius: 14,
                    alignItems: "center",
                  })}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 15,
                        fontWeight: "800",
                      }}
                    >
                      Add to savings
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* history */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "800",
                color: INK,
                marginTop: 22,
              }}
            >
              History
            </Text>
            {loadingDeposits ? (
              <ActivityIndicator color={RED} style={{ marginTop: 12 }} />
            ) : deposits.length === 0 ? (
              <Text style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
                No savings added yet.
              </Text>
            ) : (
              deposits.map((d, i) => (
                <View
                  key={d.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 10,
                    borderBottomWidth: i === deposits.length - 1 ? 0 : 1,
                    borderBottomColor: BORDER,
                  }}
                >
                  <Text style={{ fontSize: 12, color: MUTED }}>
                    {fmtDateTime(d.createdAt)}
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: GREEN, fontWeight: "800" }}
                  >
                    + {money(d.amount)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
