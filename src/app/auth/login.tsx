import { useRouter } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { api, getApiError, saveToken } from "../../lib/api";

const RED = "#C8102E";
const RED_DARK = "#9B0C23";
const RED_SOFT = "#FDECEF";
const INK = "#1A1A1F";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

type FieldName = "identifier" | "password";

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

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<FieldName | null>(null);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  // Lift the form above the keyboard (works on iOS and Android)
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const inputStyle = (name: FieldName) => {
    const hasError = !!errors[name];
    return {
      height: 46,
      borderWidth: 1.5,
      borderColor: hasError || focused === name ? RED : BORDER,
      backgroundColor: hasError
        ? RED_SOFT
        : focused === name
          ? "#FFFFFF"
          : "#F9FAFB",
      borderRadius: 10,
      paddingHorizontal: 14,
      fontSize: 15,
      color: INK,
    };
  };

  const onSubmit = async () => {
    if (loading) return;
    Keyboard.dismiss();
    setFormError("");

    const e: Partial<Record<FieldName, string>> = {};
    if (!identifier.trim()) e.identifier = "Enter your email or phone number";
    if (!password) e.password = "Enter your password";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      setLoading(true);
      const { data } = await api.post("/login", {
        identifier: identifier.trim(),
        password,
      });
      await saveToken(data.token);
      router.replace("/pages/dashboard");
    } catch (err) {
      setFormError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top red accent bar */}
      <View style={{ height: 5, backgroundColor: RED }} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16 + keyboardHeight,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Image
            source={require("../../../assets/Logo/hgb.png")}
            style={{ width: 140, height: 70 }}
            resizeMode="contain"
          />
          <Text
            style={{
              marginTop: 6,
              fontSize: 11,
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
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: BORDER,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "800", color: INK }}>
            Welcome back
          </Text>
          <Text style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
            Sign in to access your account
          </Text>

          {/* Email or phone */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: INK,
              marginTop: 16,
              marginBottom: 6,
            }}
          >
            Email or Phone Number
          </Text>
          <TextInput
            value={identifier}
            onChangeText={(t) => {
              setIdentifier(t);
              if (errors.identifier)
                setErrors((p) => ({ ...p, identifier: undefined }));
            }}
            placeholder="you@example.com or phone"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setFocused("identifier")}
            onBlur={() => setFocused(null)}
            style={inputStyle("identifier")}
          />
          {errors.identifier ? (
            <Text style={{ fontSize: 11, color: RED, marginTop: 4 }}>
              {errors.identifier}
            </Text>
          ) : null}

          {/* Password */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: INK,
              marginTop: 12,
              marginBottom: 6,
            }}
          >
            Password
          </Text>
          <View style={{ justifyContent: "center" }}>
            <TextInput
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              style={[inputStyle("password"), { paddingRight: 46 }]}
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
          {errors.password ? (
            <Text style={{ fontSize: 11, color: RED, marginTop: 4 }}>
              {errors.password}
            </Text>
          ) : null}

          {/* Server error */}
          {formError ? (
            <View
              style={{
                backgroundColor: RED_SOFT,
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginTop: 14,
              }}
            >
              <Text
                style={{ fontSize: 12, color: RED_DARK, fontWeight: "600" }}
              >
                {formError}
              </Text>
            </View>
          ) : null}

          {/* Sign in */}
          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: pressed || loading ? RED_DARK : RED,
              height: 48,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 18,
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
                Sign In
              </Text>
            )}
          </Pressable>

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 14,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
            <Text style={{ marginHorizontal: 10, color: MUTED, fontSize: 11 }}>
              NEW HERE?
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
          </View>

          {/* Register */}
          <Pressable
            onPress={() => router.push("/auth/register")}
            style={({ pressed }) => ({
              height: 48,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: RED,
              backgroundColor: pressed ? RED_SOFT : "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Text style={{ color: RED, fontSize: 15, fontWeight: "800" }}>
              Register
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
