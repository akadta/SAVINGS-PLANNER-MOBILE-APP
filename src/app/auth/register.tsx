import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, getApiError } from "../../lib/api";

const RED = "#C8102E";
const RED_DARK = "#9B0C23";
const RED_SOFT = "#FDECEF";
const GREEN = "#16A34A";
const INK = "#1A1A1F";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

type Place = { id: number; name: string };
type FieldName =
  | "fullName"
  | "email"
  | "phone"
  | "location"
  | "address"
  | "password"
  | "confirm";
type Errors = Partial<Record<FieldName, string>>;
type GpsStatus = "loading" | "ok" | "denied" | "error";

const FIELD_ORDER: FieldName[] = [
  "fullName",
  "email",
  "phone",
  "location",
  "address",
  "password",
  "confirm",
];

// Eye icon drawn with plain Views (no icon library needed).
function EyeIcon({ crossed, color }: { crossed: boolean; color: string }) {
  return (
    <View
      style={{
        width: 26,
        height: 26,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 24,
          height: 14,
          borderRadius: 7,
          borderWidth: 2,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
      </View>
      {crossed && (
        <View
          style={{
            position: "absolute",
            width: 2.5,
            height: 28,
            backgroundColor: color,
            borderRadius: 2,
            transform: [{ rotate: "45deg" }],
          }}
        />
      )}
    </View>
  );
}

// Lets each Field report its position so the screen can scroll to it on focus.
// (Defined outside Register so inputs keep focus while typing.)
const FieldPosContext = createContext<(name: FieldName, y: number) => void>(
  () => {},
);

function Field({
  name,
  label,
  optional,
  error,
  children,
}: {
  name: FieldName;
  label: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  const reportPos = useContext(FieldPosContext);
  return (
    <View
      style={{ marginTop: 8 }}
      onLayout={(e) => reportPos(name, e.nativeEvent.layout.y)}
    >
      <Text
        style={{ fontSize: 11, fontWeight: "700", color: INK, marginBottom: 4 }}
      >
        {label}
        {optional && (
          <Text style={{ color: MUTED, fontWeight: "500" }}> (Optional)</Text>
        )}
      </Text>
      {children}
      {error ? (
        <Text style={{ fontSize: 11, color: RED, marginTop: 3 }}>{error}</Text>
      ) : null}
    </View>
  );
}

// ---------- Place search (OpenStreetMap data, no API key) ----------
// 1st choice: Nominatim. If it refuses the request, fall back to Photon,
// which searches the same OpenStreetMap data.
async function searchNominatim(
  q: string,
  signal: AbortSignal,
): Promise<Place[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q,
    )}&format=json&limit=6`,
    {
      signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        // Nominatim blocks requests that don't identify the app
        "User-Agent": "HGBSavingsPlanner/1.0",
      },
    },
  );
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Nominatim bad response");
  return data.map((p: any) => ({ id: p.place_id, name: p.display_name }));
}

async function searchPhoton(q: string, signal: AbortSignal): Promise<Place[]> {
  const res = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`,
    { signal, headers: { Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`Photon HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data?.features)) throw new Error("Photon bad response");

  return data.features.map((f: any, i: number) => {
    const p = f.properties || {};
    const parts = [
      p.name,
      p.street,
      p.district,
      p.city,
      p.state,
      p.country,
    ].filter((v, idx, arr) => v && arr.indexOf(v) === idx);
    return { id: Number(`${p.osm_id ?? 0}${i}`), name: parts.join(", ") };
  });
}

async function searchPlaces(q: string, signal: AbortSignal): Promise<Place[]> {
  try {
    return await searchNominatim(q, signal);
  } catch (err) {
    if ((err as any)?.name === "AbortError") throw err;
    return await searchPhoton(q, signal);
  }
}

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Form values
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Validation + submit state
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // Location search (OpenStreetMap / Nominatim)
  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchError, setSearchError] = useState(false);

  // GPS (device latitude / longitude)
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("loading");

  // Focus + keyboard handling
  const [focused, setFocused] = useState<FieldName | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const cardY = useRef(0);
  const fieldY = useRef<Partial<Record<FieldName, number>>>({});

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Capture GPS when the screen opens (and on retry)
  const captureGps = async () => {
    try {
      setGpsStatus("loading");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsStatus("denied");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      setGpsStatus("ok");
    } catch {
      setGpsStatus("error");
    }
  };

  useEffect(() => {
    captureGps();
  }, []);

  // Debounced place search
  useEffect(() => {
    const q = query.trim();
    if (selectedPlace || q.length < 3) {
      setResults([]);
      setSearched(false);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const list = await searchPlaces(q, controller.signal);
        setResults(list);
        setSearched(true);
        setSearchError(false);
        setDropdownOpen(true);
        // bring the suggestions above the keyboard
        if (list.length > 0) scrollToField("location");
      } catch (err) {
        if ((err as any)?.name === "AbortError") return;
        console.warn("Location search failed:", err);
        // keep the box visible and tell the user, instead of hiding it
        setResults([]);
        setSearched(true);
        setSearchError(true);
        setDropdownOpen(true);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedPlace]);

  const scrollToField = (name: FieldName) => {
    const y = fieldY.current[name];
    if (y === undefined) return;
    setTimeout(
      () =>
        scrollRef.current?.scrollTo({
          y: Math.max(cardY.current + y - 12, 0),
          animated: true,
        }),
      120,
    );
  };

  const onFocusField = (name: FieldName) => {
    setFocused(name);
    scrollToField(name);
  };

  const clearError = (name: FieldName) =>
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));

  const inputStyle = (name: FieldName) => {
    const hasError = !!errors[name];
    return {
      height: 40,
      borderWidth: 1.5,
      borderColor: hasError || focused === name ? RED : BORDER,
      backgroundColor: hasError
        ? RED_SOFT
        : focused === name
          ? "#FFFFFF"
          : "#F9FAFB",
      borderRadius: 10,
      paddingHorizontal: 12,
      fontSize: 14,
      color: INK,
    };
  };

  const textProps = (name: FieldName): Partial<TextInputProps> => ({
    placeholderTextColor: "#9CA3AF",
    onFocus: () => onFocusField(name),
    onBlur: () => setFocused(null),
    style: inputStyle(name),
  });

  // ---------- Validation (mirrors the server rules) ----------
  const validate = (): Errors => {
    const e: Errors = {};
    if (fullName.trim().length < 2) e.fullName = "Enter your full name";

    const em = email.trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))
      e.email = "Enter a valid email address";

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15)
      e.phone = "Enter a valid phone number";

    if (!selectedPlace) e.location = "Search and select your location";
    if (address.trim().length < 5) e.address = "Enter your full address";

    if (password.length < 8) e.password = "Use at least 8 characters";
    if (confirm !== password) e.confirm = "Passwords do not match";
    return e;
  };

  // ---------- Submit ----------
  const onSubmit = async () => {
    if (loading) return;
    Keyboard.dismiss();
    setFormError("");

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const first = FIELD_ORDER.find((k) => e[k]);
      if (first) scrollToField(first);
      return;
    }

    try {
      setLoading(true);
      await api.post("/register", {
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        location: selectedPlace!.name,
        address: address.trim(),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        password,
        confirm_password: confirm,
      });

      Alert.alert("Account created", "You can now sign in.", [
        { text: "Sign In", onPress: () => router.replace("/auth/login") },
      ]);
    } catch (err) {
      const { message, fieldErrors } = getApiError(err);

      // Map server field names to our field names
      const mapped: Errors = {};
      Object.entries(fieldErrors).forEach(([key, value]) => {
        const name = (
          key === "confirm_password" ? "confirm" : key
        ) as FieldName;
        if (FIELD_ORDER.includes(name)) mapped[name] = value;
      });
      setErrors(mapped);
      setFormError(message);

      const first = FIELD_ORDER.find((k) => mapped[k]);
      if (first) scrollToField(first);
    } finally {
      setLoading(false);
    }
  };

  // GPS status line
  const gpsDot =
    gpsStatus === "ok" ? GREEN : gpsStatus === "loading" ? "#9CA3AF" : RED;
  const gpsText =
    gpsStatus === "loading"
      ? "Capturing GPS location…"
      : gpsStatus === "ok" && coords
        ? `GPS captured · ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
        : gpsStatus === "denied"
          ? "GPS permission denied · Tap to retry"
          : "Could not get GPS · Tap to retry";

  return (
    <FieldPosContext.Provider
      value={(name, y) => {
        fieldY.current[name] = y;
      }}
    >
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Top red accent bar */}
        <View style={{ height: 5, backgroundColor: RED }} />

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 10,
            // keep clear of the phone's bottom navigation bar
            paddingBottom:
              keyboardHeight > 0 ? 12 + keyboardHeight : insets.bottom + 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <Image
              source={require("../../../assets/Logo/hgb.png")}
              style={{ width: 100, height: 48 }}
              resizeMode="contain"
            />
            <Text
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: MUTED,
                fontWeight: "600",
              }}
            >
              HGB SAVINGS PLANNER
            </Text>
          </View>

          {/* Card */}
          <View
            onLayout={(e) => {
              cardY.current = e.nativeEvent.layout.y;
            }}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: BORDER,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 5,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "800", color: INK }}>
              Create account
            </Text>

            {/* Full name */}
            <Field name="fullName" label="Full Name" error={errors.fullName}>
              <TextInput
                {...textProps("fullName")}
                value={fullName}
                onChangeText={(t) => {
                  setFullName(t);
                  clearError("fullName");
                }}
                placeholder="Your full name"
                autoCapitalize="words"
              />
            </Field>

            {/* Email (optional) */}
            <Field
              name="email"
              label="Email Address"
              optional
              error={errors.email}
            >
              <TextInput
                {...textProps("email")}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  clearError("email");
                }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>

            {/* Phone */}
            <Field name="phone" label="Phone Number" error={errors.phone}>
              <TextInput
                {...textProps("phone")}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  clearError("phone");
                }}
                placeholder="Mobile number"
                keyboardType="phone-pad"
                maxLength={15}
              />
            </Field>

            {/* Current location (OpenStreetMap search dropdown) */}
            <Field
              name="location"
              label="Current Location"
              error={errors.location}
            >
              <View style={{ justifyContent: "center" }}>
                <TextInput
                  {...textProps("location")}
                  style={[inputStyle("location"), { paddingRight: 44 }]}
                  value={query}
                  onChangeText={(t) => {
                    setQuery(t);
                    setSelectedPlace(null);
                    setDropdownOpen(true);
                    clearError("location");
                  }}
                  placeholder="Search city, area or place"
                  autoCorrect={false}
                />
                <View style={{ position: "absolute", right: 14 }}>
                  {searching ? (
                    <ActivityIndicator size="small" color={RED} />
                  ) : query.length > 0 ? (
                    <Pressable
                      hitSlop={10}
                      onPress={() => {
                        setQuery("");
                        setSelectedPlace(null);
                        setResults([]);
                        setSearched(false);
                      }}
                    >
                      <Text style={{ fontSize: 16, color: MUTED }}>✕</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {dropdownOpen && !selectedPlace && query.trim().length >= 3 && (
                <View
                  style={{
                    marginTop: 6,
                    borderWidth: 1,
                    borderColor: BORDER,
                    borderRadius: 10,
                    backgroundColor: "#FFFFFF",
                    overflow: "hidden",
                  }}
                >
                  {results.map((place, i) => (
                    <Pressable
                      key={place.id}
                      onPress={() => {
                        setSelectedPlace(place);
                        setQuery(place.name);
                        setResults([]);
                        setDropdownOpen(false);
                        clearError("location");
                        Keyboard.dismiss();
                      }}
                      style={({ pressed }) => ({
                        paddingVertical: 11,
                        paddingHorizontal: 14,
                        backgroundColor: pressed ? RED_SOFT : "#FFFFFF",
                        borderTopWidth: i === 0 ? 0 : 1,
                        borderTopColor: BORDER,
                      })}
                    >
                      <Text
                        numberOfLines={2}
                        style={{ fontSize: 13, color: INK }}
                      >
                        {place.name}
                      </Text>
                    </Pressable>
                  ))}
                  {!searching &&
                    searched &&
                    results.length === 0 &&
                    !searchError && (
                      <Text style={{ padding: 12, fontSize: 13, color: MUTED }}>
                        No places found
                      </Text>
                    )}
                  {!searching && searchError && (
                    <Text style={{ padding: 12, fontSize: 13, color: RED }}>
                      Search failed. Check your internet and keep typing to try
                      again.
                    </Text>
                  )}
                  {searching && results.length === 0 && (
                    <Text style={{ padding: 12, fontSize: 13, color: MUTED }}>
                      Searching…
                    </Text>
                  )}
                </View>
              )}

              {/* GPS status */}
              <Pressable
                onPress={
                  gpsStatus === "denied" || gpsStatus === "error"
                    ? captureGps
                    : undefined
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 6,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: gpsDot,
                    marginRight: 6,
                  }}
                />
                <Text style={{ fontSize: 11, color: MUTED }}>{gpsText}</Text>
              </Pressable>
            </Field>

            {/* Address */}
            <Field name="address" label="Address" error={errors.address}>
              <TextInput
                {...textProps("address")}
                style={[
                  inputStyle("address"),
                  { height: 52, paddingTop: 8, textAlignVertical: "top" },
                ]}
                value={address}
                onChangeText={(t) => {
                  setAddress(t);
                  clearError("address");
                }}
                placeholder="House no., street, landmark"
                multiline
              />
            </Field>

            {/* Password */}
            <Field name="password" label="Password" error={errors.password}>
              <View style={{ justifyContent: "center" }}>
                <TextInput
                  {...textProps("password")}
                  style={[inputStyle("password"), { paddingRight: 46 }]}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    clearError("password");
                  }}
                  placeholder="At least 8 characters"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={10}
                  style={{ position: "absolute", right: 14 }}
                >
                  <EyeIcon
                    crossed={!showPassword}
                    color={showPassword ? RED : MUTED}
                  />
                </Pressable>
              </View>
            </Field>

            {/* Confirm password */}
            <Field
              name="confirm"
              label="Confirm Password"
              error={errors.confirm}
            >
              <View style={{ justifyContent: "center" }}>
                <TextInput
                  {...textProps("confirm")}
                  style={[inputStyle("confirm"), { paddingRight: 46 }]}
                  value={confirm}
                  onChangeText={(t) => {
                    setConfirm(t);
                    clearError("confirm");
                  }}
                  placeholder="Re-enter your password"
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={10}
                  style={{ position: "absolute", right: 14 }}
                >
                  <EyeIcon
                    crossed={!showConfirm}
                    color={showConfirm ? RED : MUTED}
                  />
                </Pressable>
              </View>
            </Field>

            {/* Server / general error */}
            {formError ? (
              <View
                style={{
                  backgroundColor: RED_SOFT,
                  borderRadius: 10,
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  marginTop: 12,
                }}
              >
                <Text
                  style={{ fontSize: 12, color: RED_DARK, fontWeight: "600" }}
                >
                  {formError}
                </Text>
              </View>
            ) : null}

            {/* Create account */}
            <Pressable
              onPress={onSubmit}
              disabled={loading}
              style={({ pressed }) => ({
                backgroundColor: pressed || loading ? RED_DARK : RED,
                height: 46,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 16,
                shadowColor: RED,
                shadowOpacity: 0.3,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 3,
              })}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "800",
                    letterSpacing: 0.5,
                  }}
                >
                  Create Account
                </Text>
              )}
            </Pressable>

            {/* Go to login */}
            <Pressable
              onPress={() => router.push("/auth/login")}
              hitSlop={8}
              style={{ alignItems: "center", marginTop: 14 }}
            >
              <Text style={{ fontSize: 13, color: MUTED }}>
                Already have an account?{" "}
                <Text style={{ color: RED, fontWeight: "800" }}>Sign In</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </FieldPosContext.Provider>
  );
}
