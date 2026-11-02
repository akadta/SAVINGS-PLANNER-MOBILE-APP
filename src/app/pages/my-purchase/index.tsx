import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PlanCard from "../../../components/PlanCard";
import PlanSheet from "../../../components/PlanSheet";
import { api, getApiError } from "../../../lib/api";
import {
  BORDER,
  INK,
  MUTED,
  Plan,
  RED,
  RED_DARK,
  RED_SOFT,
} from "../../../lib/plan";

const PAGE = 20;
const FILTERS: [string, string][] = [
  ["ALL", "All"],
  ["ACTIVE", "Active"],
  ["COMPLETED", "Completed"],
  ["ENDED", "Ended"],
];

type Mode = "reset" | "more" | "refresh" | "silent";

export default function MyPurchase() {
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<Plan[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<Plan | null>(null);

  const reqId = useRef(0);
  const first = useRef(true);

  // wait 350ms after typing before searching
  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 350);
    return () => clearTimeout(t);
  }, [input]);

  const fetchPage = useCallback(
    async (p: number, mode: Mode) => {
      const id = ++reqId.current;
      try {
        if (mode === "more") setLoadingMore(true);
        else if (mode === "refresh") setRefreshing(true);
        else if (mode === "reset") setLoading(true);
        setError("");

        const { data } = await api.get("/plans", {
          params: { page: p, limit: PAGE, search, status },
        });
        if (id !== reqId.current) return;

        setItems((prev) => {
          if (mode !== "more") return data.data;
          const seen = new Set(prev.map((x) => x.id));
          return [...prev, ...data.data.filter((x: Plan) => !seen.has(x.id))];
        });
        setPage(p);
        setHasMore(data.hasMore);
        setTotal(data.total);
      } catch (err) {
        if (id !== reqId.current) return;
        setError(getApiError(err).message);
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [search, status],
  );

  // runs on focus and whenever search / filter changes
  useFocusEffect(
    useCallback(() => {
      fetchPage(1, first.current ? "reset" : "silent");
      first.current = false;
    }, [fetchPage]),
  );

  const onChanged = useCallback((p: Plan) => {
    setSelected(p);
    setItems((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  }, []);

  const onEnd = () => {
    if (hasMore && !loading && !loadingMore && !refreshing)
      fetchPage(page + 1, "more");
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={{ height: 5, backgroundColor: RED }} />

      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "800", color: INK }}>
            My Purchase
          </Text>
          <Text style={{ fontSize: 12, color: MUTED, fontWeight: "600" }}>
            {total} plan{total === 1 ? "" : "s"}
          </Text>
        </View>

        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Search by product or category"
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          style={{
            marginTop: 12,
            borderWidth: 1.5,
            borderColor: BORDER,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 11,
            fontSize: 14,
            color: INK,
            backgroundColor: "#F9FAFB",
          }}
        />

        <View style={{ flexDirection: "row", marginTop: 12, marginBottom: 12 }}>
          {FILTERS.map(([key, label]) => {
            const active = status === key;
            return (
              <Pressable
                key={key}
                onPress={() => setStatus(key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 8,
                  backgroundColor: active ? RED : RED_SOFT,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: active ? "#FFFFFF" : RED,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <ActivityIndicator color={RED} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => (
            <PlanCard plan={item} onPress={setSelected} />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          onEndReached={onEnd}
          onEndReachedThreshold={0.4}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPage(1, "refresh")}
              colors={[RED]}
              tintColor={RED}
            />
          }
          ListEmptyComponent={
            error ? (
              <View
                style={{
                  backgroundColor: RED_SOFT,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  marginTop: 20,
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
                  onPress={() => fetchPage(1, "reset")}
                  style={{
                    marginTop: 12,
                    backgroundColor: RED,
                    paddingVertical: 10,
                    paddingHorizontal: 22,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ alignItems: "center", marginTop: 60 }}>
                <Text
                  style={{
                    color: MUTED,
                    fontSize: 14,
                    textAlign: "center",
                    paddingHorizontal: 30,
                  }}
                >
                  {search || status !== "ALL"
                    ? "No plans match your search."
                    : "No plans yet. Open the Create Plan tab to start saving."}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={RED} style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      )}

      <PlanSheet
        plan={selected}
        onClose={() => setSelected(null)}
        onChanged={onChanged}
      />
    </View>
  );
}
