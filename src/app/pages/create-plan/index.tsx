import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Piggy from "../../../components/Piggy";
import { api, getApiError } from "../../../lib/api";
import {
  BORDER,
  CATEGORIES,
  FREQ_ADV,
  FREQ_LABEL,
  FREQ_UNIT,
  Frequency,
  INK,
  MUTED,
  Plan,
  RED,
  RED_DARK,
  RED_SOFT,
  computePlan,
  fmtDate,
  money,
  pickedToUTC,
  toISO,
} from "../../../lib/plan";

const FREQS: Frequency[] = ["DAILY", "WEEKLY", "MONTHLY"];

const pad2 = (n: number) => String(n).padStart(2, "0");
const hhmm = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const label12 = (d: Date) => {
  const h = d.getHours();
  return `${h % 12 || 12}:${pad2(d.getMinutes())} ${h >= 12 ? "pm" : "am"}`;
};

const inputStyle = (hasError?: boolean) => ({
  borderWidth: 1.5,
  borderColor: hasError ? RED : BORDER,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
  color: INK,
});

function Label({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "800",
        color: INK,
        marginTop: 18,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

function FieldError({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <Text
      style={{ color: RED_DARK, fontSize: 12, fontWeight: "600", marginTop: 6 }}
    >
      {text}
    </Text>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: active ? RED : BORDER,
        backgroundColor: active ? RED_SOFT : "#FFFFFF",
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: active ? RED : MUTED,
          fontWeight: "800",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------- success animation ----------
function SuccessOverlay({
  plan,
  onView,
  onNew,
}: {
  plan: Plan;
  onView: () => void;
  onNew: () => void;
}) {
  const pop = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const coins = useRef(
    [0, 1, 2, 3, 4].map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(pop, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.stagger(
          200,
          coins.map((c) =>
            Animated.timing(c, {
              toValue: 1,
              duration: 500,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ),
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounce, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(bounce, {
              toValue: 0,
              duration: 220,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 5 },
        ),
      ]),
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pop, bounce, fade, coins]);

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Animated.View
          style={{
            width: "100%",
            maxWidth: 340,
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            overflow: "hidden",
            opacity: pop,
            transform: [
              {
                scale: pop.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ],
          }}
        >
          {/* animation area */}
          <View
            style={{
              backgroundColor: RED,
              height: 180,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{ width: 110, height: 140 }}>
              {coins.map((c, i) => (
                <Animated.View
                  key={i}
                  style={{
                    position: "absolute",
                    left: 38,
                    top: 0,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: "#F5B301",
                    borderWidth: 2,
                    borderColor: "#B98100",
                    opacity: c.interpolate({
                      inputRange: [0, 0.15, 0.85, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                    transform: [
                      {
                        translateY: c.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 72],
                        }),
                      },
                    ],
                  }}
                />
              ))}
              <Animated.View
                style={{
                  position: "absolute",
                  top: 55,
                  transform: [
                    {
                      translateY: bounce.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -6],
                      }),
                    },
                  ],
                }}
              >
                <Piggy size={110} color="#FFFFFF" detail={RED} />
              </Animated.View>
            </View>
          </View>

          <Animated.View
            style={{ padding: 22, alignItems: "center", opacity: fade }}
          >
            <Text style={{ fontSize: 20, fontWeight: "800", color: INK }}>
              Plan created!
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontSize: 14, color: MUTED, marginTop: 4 }}
            >
              {plan.productName}
            </Text>

            <View
              style={{
                width: "100%",
                backgroundColor: RED_SOFT,
                borderRadius: 14,
                padding: 14,
                marginTop: 16,
              }}
            >
              <Text
                style={{ color: RED_DARK, fontWeight: "800", fontSize: 14 }}
              >
                Save {money(plan.installmentAmount)} {FREQ_ADV[plan.frequency]}
              </Text>
              <Text
                style={{
                  color: RED_DARK,
                  fontSize: 13,
                  marginTop: 4,
                  fontWeight: "600",
                }}
              >
                {plan.totalInstallments} {FREQ_UNIT[plan.frequency]}
                {plan.totalInstallments > 1 ? "s" : ""} · ends{" "}
                {fmtDate(plan.endDate)}
              </Text>
            </View>

            <Pressable
              onPress={onView}
              style={({ pressed }) => ({
                width: "100%",
                marginTop: 16,
                backgroundColor: pressed ? RED_DARK : RED,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
              })}
            >
              <Text
                style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 15 }}
              >
                View My Plans
              </Text>
            </Pressable>
            <Pressable onPress={onNew} style={{ marginTop: 12, padding: 6 }}>
              <Text style={{ color: RED, fontWeight: "800", fontSize: 13 }}>
                Create another plan
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------- screen ----------
export default function CreatePlan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [target, setTarget] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY");
  const [dateKnown, setDateKnown] = useState(true);
  const [date, setDate] = useState<Date | null>(null);
  const [installment, setInstallment] = useState("");
  const [description, setDescription] = useState("");
  const [remindAt, setRemindAt] = useState(new Date(2000, 0, 1, 9, 0));
  const [showTime, setShowTime] = useState(false);

  const [catOpen, setCatOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fe, setFe] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Plan | null>(null);

  const targetNum = Number(target) || 0;
  const instNum = Number(installment) || 0;

  const calc = useMemo(() => {
    if (!(targetNum > 0)) return null;
    if (dateKnown && !date) return null;
    if (!dateKnown && !(instNum > 0)) return null;
    return computePlan({
      target: targetNum,
      frequency,
      dateKnown,
      targetDate: date,
      installment: instNum,
    });
  }, [targetNum, frequency, dateKnown, date, instNum]);

  const reset = () => {
    setProductName("");
    setCategory("");
    setTarget("");
    setFrequency("MONTHLY");
    setDateKnown(true);
    setDate(null);
    setInstallment("");
    setDescription("");
    setError("");
    setFe({});
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (productName.trim().length < 2)
      errs.productName = "Enter the product name";
    if (!category) errs.category = "Select a category";
    if (!(targetNum > 0)) errs.targetAmount = "Enter the amount";
    if (dateKnown && !date) errs.targetDate = "Pick the purchase date";
    if (!dateKnown && !(instNum > 0))
      errs.installmentAmount = "Enter how much you will save each time";
    if (calc && !calc.ok) {
      errs[dateKnown ? "targetDate" : "installmentAmount"] = calc.error;
    }
    setFe(errs);
    setError("");
    if (Object.keys(errs).length > 0) return;

    try {
      setSaving(true);
      const { data } = await api.post("/plans", {
        productName: productName.trim(),
        category,
        targetAmount: targetNum,
        frequency,
        dateKnown,
        targetDate: dateKnown && date ? toISO(pickedToUTC(date)) : null,
        installmentAmount: dateKnown ? undefined : instNum,
        description: description.trim() || undefined,
        reminderTime: hhmm(remindAt),
      });
      setCreated(data.data);
      reset();
    } catch (err) {
      const e = getApiError(err);
      setError(e.message);
      setFe(e.fieldErrors);
    } finally {
      setSaving(false);
    }
  };

  const tomorrow = new Date(Date.now() + 86400000);

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={{ height: 5, backgroundColor: RED }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 40,
          }}
        >
          {/* top card with piggy bank */}
          <View
            style={{
              backgroundColor: RED,
              borderRadius: 20,
              overflow: "hidden",
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: RED_DARK,
              shadowOpacity: 0.3,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: -50,
                right: -40,
                width: 150,
                height: 150,
                borderRadius: 75,
                backgroundColor: "rgba(255,255,255,0.10)",
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                bottom: -60,
                left: -30,
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: "rgba(0,0,0,0.10)",
              }}
            />
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "800" }}
              >
                Create your plan
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                Pick a goal, choose how you save, and we track the rest.
              </Text>
            </View>
            <Piggy size={86} color="#FFFFFF" detail={RED} />
          </View>

          {/* product name */}
          <Label>Product name</Label>
          <TextInput
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g. iPhone, Wedding gold, Bike"
            placeholderTextColor="#9CA3AF"
            maxLength={80}
            style={inputStyle(!!fe.productName)}
          />
          <FieldError text={fe.productName} />

          {/* category */}
          <Label>Category</Label>
          <Pressable
            onPress={() => setCatOpen(true)}
            style={{
              ...inputStyle(!!fe.category),
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, color: category ? INK : "#9CA3AF" }}>
              {category || "Select category"}
            </Text>
            <Text style={{ color: MUTED, fontSize: 12 }}>▼</Text>
          </Pressable>
          <FieldError text={fe.category} />

          {/* amount */}
          <Label>Target amount</Label>
          <TextInput
            value={target}
            onChangeText={(t) => setTarget(t.replace(/[^0-9.]/g, ""))}
            placeholder="₹ 0"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
            style={inputStyle(!!fe.targetAmount)}
          />
          <FieldError text={fe.targetAmount} />

          {/* frequency */}
          <Label>How do you want to save?</Label>
          <View style={{ flexDirection: "row" }}>
            {FREQS.map((f) => (
              <Chip
                key={f}
                label={FREQ_LABEL[f]}
                active={frequency === f}
                onPress={() => setFrequency(f)}
              />
            ))}
          </View>
          <FieldError text={fe.frequency} />

          {/* purchase date known / unknown */}
          <Label>Purchase date</Label>
          <View style={{ flexDirection: "row" }}>
            <Chip
              label="Known"
              active={dateKnown}
              onPress={() => setDateKnown(true)}
            />
            <Chip
              label="Not known"
              active={!dateKnown}
              onPress={() => setDateKnown(false)}
            />
          </View>

          {dateKnown ? (
            <>
              <Pressable
                onPress={() => setShowPicker(true)}
                style={{ ...inputStyle(!!fe.targetDate), marginTop: 12 }}
              >
                <Text style={{ fontSize: 15, color: date ? INK : "#9CA3AF" }}>
                  {date ? fmtDate(toISO(pickedToUTC(date))) : "Pick a date"}
                </Text>
              </Pressable>
              <FieldError text={fe.targetDate} />
              {showPicker && (
                <View>
                  <DateTimePicker
                    value={date || tomorrow}
                    mode="date"
                    minimumDate={tomorrow}
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(e, d) => {
                      if (Platform.OS === "android") setShowPicker(false);
                      if (e.type === "set" && d) setDate(d);
                    }}
                  />
                  {Platform.OS === "ios" && (
                    <Pressable
                      onPress={() => setShowPicker(false)}
                      style={{ alignSelf: "flex-end", padding: 8 }}
                    >
                      <Text style={{ color: RED, fontWeight: "800" }}>
                        Done
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </>
          ) : (
            <>
              <Label>{`How much will you save ${FREQ_ADV[frequency]}?`}</Label>
              <TextInput
                value={installment}
                onChangeText={(t) => setInstallment(t.replace(/[^0-9.]/g, ""))}
                placeholder="₹ 0"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                style={inputStyle(!!fe.installmentAmount)}
              />
              <FieldError text={fe.installmentAmount} />
            </>
          )}

          {/* live preview */}
          {calc && (
            <View
              style={{
                marginTop: 16,
                backgroundColor: calc.ok ? RED_SOFT : "#FEF3E2",
                borderRadius: 14,
                padding: 14,
              }}
            >
              {calc.ok ? (
                <>
                  <Text
                    style={{ color: RED_DARK, fontWeight: "800", fontSize: 14 }}
                  >
                    Save {money(calc.installmentAmount)} {FREQ_ADV[frequency]}
                  </Text>
                  <Text
                    style={{
                      color: RED_DARK,
                      fontSize: 13,
                      marginTop: 4,
                      fontWeight: "600",
                    }}
                  >
                    {calc.periods} {FREQ_UNIT[frequency]}
                    {calc.periods > 1 ? "s" : ""} · ends on{" "}
                    {fmtDate(calc.endDate)}
                  </Text>
                </>
              ) : (
                <Text
                  style={{ color: "#B45309", fontWeight: "700", fontSize: 13 }}
                >
                  {calc.error}
                </Text>
              )}
            </View>
          )}

          {/* reminder time */}
          <Label>Reminder time</Label>
          <Pressable onPress={() => setShowTime(true)} style={inputStyle()}>
            <Text style={{ fontSize: 15, color: INK }}>
              {label12(remindAt)}
            </Text>
          </Pressable>
          {showTime && (
            <View>
              <DateTimePicker
                value={remindAt}
                mode="time"
                is24Hour={false}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(e, d) => {
                  if (Platform.OS === "android") setShowTime(false);
                  if (e.type === "set" && d) setRemindAt(d);
                }}
              />
              {Platform.OS === "ios" && (
                <Pressable
                  onPress={() => setShowTime(false)}
                  style={{ alignSelf: "flex-end", padding: 8 }}
                >
                  <Text style={{ color: RED, fontWeight: "800" }}>Done</Text>
                </Pressable>
              )}
            </View>
          )}
          <Text style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>
            We remind you at this time if that saving is not added.
          </Text>

          {/* description */}
          <Label>Description (optional)</Label>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note about this plan"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={300}
            style={{ ...inputStyle(), minHeight: 80, textAlignVertical: "top" }}
          />

          {error ? (
            <Text
              style={{
                color: RED_DARK,
                fontSize: 13,
                fontWeight: "700",
                marginTop: 14,
              }}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={saving}
            style={({ pressed }) => ({
              marginTop: 20,
              backgroundColor: pressed || saving ? RED_DARK : RED,
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
            })}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}
              >
                Create Plan
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* category dropdown */}
      <Modal
        visible={catOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCatOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          onPress={() => setCatOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              maxHeight: "70%",
              paddingVertical: 8,
            }}
          >
            <ScrollView>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => {
                    setCategory(c);
                    setCatOpen(false);
                  }}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    backgroundColor: category === c ? RED_SOFT : "#FFFFFF",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: category === c ? "800" : "600",
                      color: category === c ? RED : INK,
                    }}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {created && (
        <SuccessOverlay
          plan={created}
          onView={() => {
            setCreated(null);
            router.navigate("/pages/my-purchase" as any);
          }}
          onNew={() => setCreated(null)}
        />
      )}
    </View>
  );
}
