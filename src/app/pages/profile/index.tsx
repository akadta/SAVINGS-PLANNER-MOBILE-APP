import axios from "axios";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, clearToken, getApiError } from "../../../lib/api";

const RED = "#C8102E";
const RED_DARK = "#9B0C23";
const RED_SOFT = "#FDECEF";
const INK = "#1A1A1F";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

type Customer = {
  id: number;
  fullName: string;
  email: string | null;
  phone: string;
  location: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={{
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: BORDER,
      }}
    >
      <Text style={{ fontSize: 11, color: MUTED, fontWeight: "600" }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, color: INK, marginTop: 3 }}>{value}</Text>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/me");
      setCustomer(data.data);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : null;
      if (status === 401 || status === 403 || status === 404) {
        await clearToken();
        router.replace("/auth/login");
        return;
      }
      setError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const logout = async () => {
    await clearToken();
    router.replace("/auth/login");
  };

  const memberSince = customer?.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    // paddingTop keeps everything below the status bar (battery, clock, notch)
    <View
      style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={{ height: 5, backgroundColor: RED }} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24, // the footer tabs already clear the bottom bar
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Image
            source={require("../../../../assets/Logo/hgb.png")}
            style={{ width: 90, height: 44 }}
            resizeMode="contain"
          />
          <Pressable
            onPress={logout}
            hitSlop={8}
            style={({ pressed }) => ({
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: RED,
              backgroundColor: pressed ? RED_SOFT : "#FFFFFF",
            })}
          >
            <Text style={{ color: RED, fontSize: 13, fontWeight: "800" }}>
              Logout
            </Text>
          </Pressable>
        </View>

        {/* Loading */}
        {loading && (
          <View style={{ alignItems: "center", marginTop: 80 }}>
            <ActivityIndicator color={RED} />
          </View>
        )}

        {/* Error */}
        {!loading && error ? (
          <View
            style={{
              marginTop: 40,
              backgroundColor: RED_SOFT,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: RED_DARK,
                fontSize: 13,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {error}
            </Text>
            <Pressable
              onPress={load}
              style={({ pressed }) => ({
                marginTop: 12,
                backgroundColor: pressed ? RED_DARK : RED,
                paddingVertical: 10,
                paddingHorizontal: 22,
                borderRadius: 10,
              })}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Details */}
        {!loading && customer && (
          <>
            {/* Avatar + name */}
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: RED_SOFT,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: RED,
                }}
              >
                <Text style={{ fontSize: 28, fontWeight: "800", color: RED }}>
                  {customer.fullName.trim().charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: INK,
                  marginTop: 10,
                }}
              >
                {customer.fullName}
              </Text>
              {memberSince ? (
                <Text style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                  Member since {memberSince}
                </Text>
              ) : null}
            </View>

            <View
              style={{
                marginTop: 20,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: BORDER,
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 5,
              }}
            >
              <InfoRow label="Full Name" value={customer.fullName} />
              <InfoRow label="Phone Number" value={customer.phone} />
              <InfoRow label="Email" value={customer.email || "—"} />
              <InfoRow label="Location" value={customer.location} />
              <InfoRow label="Address" value={customer.address} />
              <InfoRow
                label="GPS"
                value={
                  customer.latitude != null && customer.longitude != null
                    ? `${customer.latitude.toFixed(5)}, ${customer.longitude.toFixed(5)}`
                    : "Not captured"
                }
                last
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
