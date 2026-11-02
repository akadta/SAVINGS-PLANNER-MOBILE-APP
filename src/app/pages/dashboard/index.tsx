import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PlanCard from "../../../components/PlanCard";
import { api, clearToken, getApiError } from "../../../lib/api";
import {
  AMBER,
  AMBER_SOFT,
  BORDER,
  INK,
  MUTED,
  RED,
  RED_DARK,
  RED_SOFT,
  Summary,
  money,
} from "../../../lib/plan";

type Customer = {
  id: number;
  fullName: string;
  createdAt: string;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Diagonal line texture drawn with plain Views
function Texture() {
  const lines = Array.from({ length: 22 }, (_, i) => i);
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View
        style={{
          position: "absolute",
          top: -60,
          right: -50,
          width: 190,
          height: 190,
          borderRadius: 95,
          backgroundColor: "rgba(255,255,255,0.10)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -70,
          left: -40,
          width: 170,
          height: 170,
          borderRadius: 85,
          backgroundColor: "rgba(0,0,0,0.10)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 30,
          right: 60,
          width: 70,
          height: 70,
          borderRadius: 35,
          borderWidth: 1.5,
          borderColor: "rgba(255,255,255,0.18)",
        }}
      />
      {lines.map((i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: -80,
            left: i * 22 - 40,
            width: 1.5,
            height: 360,
            backgroundColor: "rgba(255,255,255,0.07)",
            transform: [{ rotate: "35deg" }],
          }}
        />
      ))}
    </View>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        width: "48.5%",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <Text style={{ fontSize: 11, color: MUTED, fontWeight: "600" }}>
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{ fontSize: 20, color: INK, fontWeight: "800", marginTop: 4 }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const loadedOnce = useRef(false);

  const load = useCallback(
    async (silent: boolean) => {
      if (!silent) setLoading(true);
      setError("");

      const [meRes, sumRes] = await Promise.allSettled([
        api.get("/me"),
        api.get("/plans/summary"),
      ]);

      if (meRes.status === "rejected") {
        const status = axios.isAxiosError(meRes.reason)
          ? meRes.reason.response?.status
          : null;
        if (status === 401 || status === 403 || status === 404) {
          await clearToken();
          router.replace("/auth/login");
          return;
        }
      } else {
        setCustomer(meRes.value.data.data);
      }

      if (sumRes.status === "fulfilled") setSummary(sumRes.value.data.data);
      else setError(getApiError(sumRes.reason).message);

      loadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    },
    [router],
  );

  // refresh every time the Home tab is opened
  useFocusEffect(
    useCallback(() => {
      load(loadedOnce.current);
    }, [load]),
  );

  const goPurchases = () => router.navigate("/pages/my-purchase" as any);

  const firstName = customer?.fullName?.trim().split(" ")[0] ?? "";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={{ height: 5, backgroundColor: RED }} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(true);
            }}
            colors={[RED]}
            tintColor={RED}
          />
        }
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
          <Text style={{ fontSize: 12, color: MUTED, fontWeight: "600" }}>
            {today}
          </Text>
        </View>

        {/* Welcome card */}
        <View
          style={{
            marginTop: 18,
            backgroundColor: RED,
            borderRadius: 20,
            overflow: "hidden",
            paddingHorizontal: 22,
            paddingVertical: 26,
            minHeight: 150,
            justifyContent: "center",
            shadowColor: RED_DARK,
            shadowOpacity: 0.3,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Texture />

          {loading && !customer ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 13,
                  fontWeight: "700",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                {getGreeting()}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  color: "#FFFFFF",
                  fontSize: 28,
                  fontWeight: "800",
                  marginTop: 6,
                }}
              >
                {firstName ? `Welcome, ${firstName}` : "Welcome"}
              </Text>
              <View
                style={{
                  height: 3,
                  width: 40,
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.7)",
                  marginTop: 12,
                }}
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 12,
                  marginTop: 10,
                }}
              >
                Glad to have you with HGB.
              </Text>
            </>
          )}
        </View>

        {error ? (
          <View
            style={{
              marginTop: 16,
              backgroundColor: RED_SOFT,
              borderRadius: 12,
              padding: 14,
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
              onPress={() => load(false)}
              style={{
                marginTop: 10,
                backgroundColor: RED,
                paddingVertical: 8,
                paddingHorizontal: 20,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {summary && (
          <>
            {/* ended alert */}
            {summary.endedPlans > 0 && (
              <Pressable
                onPress={goPurchases}
                style={{
                  marginTop: 16,
                  backgroundColor: AMBER_SOFT,
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <Text style={{ color: AMBER, fontWeight: "800", fontSize: 13 }}>
                  {summary.endedPlans} plan{summary.endedPlans === 1 ? "" : "s"}{" "}
                  passed the end date. Tap to finish saving.
                </Text>
              </Pressable>
            )}

            {/* stats */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                marginTop: 18,
              }}
            >
              <Tile label="Active plans" value={String(summary.activePlans)} />
              <Tile label="Completed" value={String(summary.completedPlans)} />
              <Tile label="Total saved" value={money(summary.totalSaved)} />
              <Tile
                label="Saved this month"
                value={money(summary.savedThisMonth)}
              />
            </View>

            {/* overall progress */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: BORDER,
                padding: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 13, color: INK, fontWeight: "800" }}>
                  Overall progress
                </Text>
                <Text style={{ fontSize: 13, color: RED, fontWeight: "800" }}>
                  {summary.overallProgress}%
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#F3F4F6",
                  marginTop: 10,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 8,
                    width: `${summary.overallProgress}%`,
                    backgroundColor: RED,
                    borderRadius: 4,
                  }}
                />
              </View>
              <Text style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
                {money(summary.totalSaved)} saved of{" "}
                {money(summary.totalTarget)}
              </Text>
            </View>

            {/* current plans */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 22,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: INK }}>
                Current plans
              </Text>
              {summary.totalPlans > 0 && (
                <Pressable onPress={goPurchases} hitSlop={8}>
                  <Text style={{ color: RED, fontSize: 13, fontWeight: "800" }}>
                    See all
                  </Text>
                </Pressable>
              )}
            </View>

            {summary.current.length === 0 ? (
              <Text style={{ color: MUTED, fontSize: 13 }}>
                No active plans. Open the Create Plan tab to start saving.
              </Text>
            ) : (
              summary.current.map((p) => (
                <PlanCard key={p.id} plan={p} onPress={goPurchases} compact />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
