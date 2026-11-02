import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RED = "#C8102E";
const MUTED = "#9CA3AF";
const BORDER = "#E5E7EB";

// ---------- Footer icons (drawn with plain Views, no icon library) ----------
function HomeIcon({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      {/* roof */}
      <View
        style={{
          position: "absolute",
          top: 2,
          width: 0,
          height: 0,
          borderLeftWidth: 12,
          borderRightWidth: 12,
          borderBottomWidth: 10,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
        }}
      />
      {/* walls + door */}
      <View
        style={{
          width: 16,
          height: 12,
          backgroundColor: color,
          borderRadius: 2,
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            width: 5,
            height: 7,
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

function PurchaseIcon({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      {/* bag handle */}
      <View
        style={{
          position: "absolute",
          top: 1,
          width: 10,
          height: 9,
          borderWidth: 2.5,
          borderBottomWidth: 0,
          borderColor: color,
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
        }}
      />
      {/* bag body */}
      <View
        style={{
          width: 20,
          height: 15,
          backgroundColor: color,
          borderRadius: 3,
        }}
      />
    </View>
  );
}

function PlanIcon({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* clipboard */}
      <View
        style={{
          width: 18,
          height: 22,
          borderWidth: 2.5,
          borderColor: color,
          borderRadius: 3,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 10,
            height: 2.5,
            backgroundColor: color,
            borderRadius: 1,
            marginBottom: 3,
          }}
        />
        <View
          style={{
            width: 10,
            height: 2.5,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      </View>
    </View>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: "center" }}>
      {/* head */}
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          marginTop: 1,
        }}
      />
      {/* shoulders */}
      <View
        style={{
          width: 20,
          height: 10,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          backgroundColor: color,
          marginTop: 2,
        }}
      />
    </View>
  );
}

// ---------- Footer with 4 tabs ----------
export default function MainLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    registerForPush().catch(() => {});
    // tapping a reminder opens My Purchase
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.navigate("/pages/my-purchase" as any);
    });
    return () => sub.remove();
  }, [router]);

  // Space under the tab icons so they sit ABOVE the phone's own
  // back / home / recents buttons (or the gesture bar).
  const bottomPad =
    Platform.OS === "android"
      ? insets.bottom > 0
        ? insets.bottom + 8
        : 40 // phone didn't report its navigation bar height
      : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: RED,
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: BORDER,
          height: 58 + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-purchase/index"
        options={{
          title: "My Purchase",
          tabBarIcon: ({ color }) => <PurchaseIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="create-plan/index"
        options={{
          title: "Create Plan",
          tabBarIcon: ({ color }) => <PlanIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
