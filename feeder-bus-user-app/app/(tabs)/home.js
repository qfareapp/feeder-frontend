import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import api from "../../api/api";

export default function HomeScreen() {
  const router = useRouter();

  const [from, setFrom] = useState("");     // fixed from pass
  const [to, setTo] = useState("");         // dropdown from stops
  const [stops, setStops] = useState([]);   // stops fetched from backend
  const [tripType, setTripType] = useState("round");
  const [day, setDay] = useState("today");
  const [fromSlot, setFromSlot] = useState(null);
  const [toSlot, setToSlot] = useState(null);

  const [pickupSlots, setPickupSlots] = useState([]);
  const [dropSlots, setDropSlots] = useState([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [selectedRouteNo, setSelectedRouteNo] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [routeReady, setRouteReady] = useState(false);
  const [oneWayDirection, setOneWayDirection] = useState("pickup"); 
  const [hasPass, setHasPass] = useState(null);
  const [loadingPass, setLoadingPass] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoadingPass(true);
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        setHasPass(false);
        return;
      }

      // 1️⃣ Fetch active pass
      const passRes = await api.get(`/passes/user/${userId}`);
      if (!passRes.data.success || !passRes.data.pass) {
        setHasPass(false);
        setRouteReady(false);
        setPickupSlots([]);
        setDropSlots([]);
        return;
      }

      setHasPass(true);

      const pass = passRes.data.pass;
      const pickup = pass.pickupLocation || "";
      const drop = pass.dropLocation || "";

      setFrom(pickup);
      setTo(drop);

      // 2️⃣ Get default route (from pass)
      const routeRes = await api.get(`/routes/${pass.routeNo}`);
      const route = routeRes.data?.route || {};
      let routeNoToUse = pass.routeNo;

      // 3️⃣ Try to find dynamic route based on from–to
      try {
        const allRoutesRes = await api.get("/routes");
        const routes = allRoutesRes.data || [];

        const matchedRoute = routes.find((r) => {
          const allStops = [r.startPoint, ...(r.stops || []), r.endPoint].map(
            (s) => s?.toLowerCase().trim()
          );
          return (
            allStops.includes(pickup.toLowerCase().trim()) &&
            allStops.includes(drop.toLowerCase().trim())
          );
        });

        if (matchedRoute) {
          routeNoToUse = matchedRoute.routeNo;
          setSelectedRouteNo(routeNoToUse);
          setSelectedRouteId(matchedRoute._id); // ✅ store routeId for booking
          console.log("✅ Matched dynamic route:", routeNoToUse, "🆔", matchedRoute._id);

          setRouteReady(true); // ✅ mark ready only after both are set
          console.log("✅ Final route state set:", routeNoToUse, matchedRoute._id);
        } else {
          console.warn("⚠️ No matching route found, using default:", routeNoToUse);
          setSelectedRouteNo(routeNoToUse);
          setSelectedRouteId(route._id || null); // fallback to pass route ID

          setRouteReady(true); // ✅ mark ready here too
          console.log("✅ Final route state set (fallback):", routeNoToUse, route._id || null);
        }
      } catch (e) {
        console.warn("⚠️ Could not determine dynamic route:", e.message);
        setSelectedRouteNo(routeNoToUse);
        setSelectedRouteId(route._id || null);
        setRouteReady(true); // ✅ also handle errors gracefully
        console.log("⚠️ Route detection failed, fallback used:", routeNoToUse, route._id || null);
      }

      // 4️⃣ Build stop chain and validate segment
      const stopsChain = [
        route.startPoint,
        ...(route.stops || []),
        route.endPoint,
      ].map((s) => (s || "").toLowerCase().trim());

      const pickStr = pickup.toLowerCase().trim();
      const dropStr = drop.toLowerCase().trim();
      const pickupIndex = stopsChain.indexOf(pickStr);
      const dropIndex = stopsChain.indexOf(dropStr);
      const segmentIsValid =
        pickupIndex !== -1 && dropIndex !== -1 && pickupIndex < dropIndex;

      // 5️⃣ Load daily schedules dynamically
      const dateParam =
        day === "today"
          ? new Date().toISOString().split("T")[0]
          : new Date(Date.now() + 86400000).toISOString().split("T")[0];

      const schedRes = await api.get(
        `/daily-bookings/availability?routeNo=${encodeURIComponent(
          routeNoToUse
        )}&date=${encodeURIComponent(dateParam)}&onlyActive=true`
      );

      const normalized = (Array.isArray(schedRes.data)
        ? schedRes.data
        : schedRes.data.data || []
      )
        .filter((s) => s.status?.toLowerCase() === "active")
        .map((s) => ({
          ...s,
          available: Math.max(
            0,
            (Number(s.totalSeats) || 0) - (Number(s.booked) || 0)
          ),
        }))
        .filter((s) => s.available > 0);

      console.log("🚌 Active schedules from backend:", normalized);

      // 6️⃣ Filter slots
      const pickupSlots = normalized.filter((s) => s.tripType === "pickup");
      const dropSlots = normalized.filter((s) => s.tripType === "drop");

      if (!segmentIsValid) {
        console.warn("⚠️ Invalid pickup-drop segment:", { pickStr, dropStr, stopsChain });
      }

      // 7️⃣ Update UI states
      setPickupSlots(pickupSlots);
      setDropSlots(dropSlots);
      setRouteReady(true);
      console.log("✅ Route setup complete:", selectedRouteNo, selectedRouteId);
      setFromSlot(null);
      setToSlot(null);
    } catch (err) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.error;

      // If no active pass (404/400), show empty state without noisy alert
      if (status === 404 || serverMessage?.toLowerCase()?.includes("no active pass")) {
        setHasPass(false);
        setRouteReady(false);
        setPickupSlots([]);
        setDropSlots([]);
      } else if (status === 400 && serverMessage?.toLowerCase()?.includes("invalid route")) {
        Alert.alert("Route Error", serverMessage || "Invalid route from your pass.");
      } else {
        console.error("❌ Error loading schedules:", err);
        Alert.alert("Error", serverMessage || "Could not load daily schedules.");
      }
    } finally {
      setLoadingPass(false);
      setRefreshing(false);
    }
  }, [day]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };


const slotIsDisabled = (s) => s.status?.toLowerCase() !== "active" || s.available <= 0;

  const canConfirm = useMemo(() => {
  if (!from || !to) return false;

  // ROUND TRIP → need both pickup and drop slots
  if (tripType === "round") {
    return !!fromSlot && !!toSlot;
  }

  // ONE WAY → pickup-only or drop-only depending on toggle
  if (tripType === "oneway") {
    return oneWayDirection === "pickup"
      ? !!fromSlot
      : !!toSlot;
  }

  return false;
}, [from, to, fromSlot, toSlot, tripType, oneWayDirection]);



  const handleConfirm = async () => {
  if (!canConfirm) return;

  if (!routeReady || !selectedRouteNo || !selectedRouteId) {
    Alert.alert(
      "Route Not Ready",
      "Please wait a moment while routes are loading."
    );
    return;
  }

  try {
    const userId = await AsyncStorage.getItem("userId");

    // ⭐ FIXED: define date properly
    const date =
      day === "today"
        ? new Date()
        : new Date(Date.now() + 86400000);

    // ⭐ FIXED: match buses for pickup and drop
    const pickupMatch = pickupSlots.find(s => s.slot === fromSlot);
    const dropMatch = dropSlots.find(s => s.slot === toSlot);

    // ⭐ FIXED: full correct payload
    const payload = {
      userId,
      date,
      routeNo: selectedRouteNo,
      routeId: selectedRouteId,
      pickupLocation: from,
      dropLocation: to,

      pickupSlot: fromSlot,
      pickupBusId: pickupMatch?.busId || null,
    };

    // ⭐ FIXED: include busId for drop trip
    if (
      (tripType === "round" && toSlot) ||
      (tripType === "oneway" && oneWayDirection === "drop" && toSlot)
    ) {
      payload.dropSlot = toSlot;
      payload.dropBusId = dropMatch?.busId || null;
    }

    console.log("📦 Final booking payload:", payload);

    const res = await api.post("/daily-bookings", payload);

    if (!res.data.success) {
      Alert.alert("⚠️ Booking Failed", res.data.error || "Please try again later.");
      return;
    }

    const bookingId = res.data.booking._id;
    await AsyncStorage.setItem("activeBookingId", bookingId);

    console.log("💾 Saved activeBookingId:", bookingId);

    Alert.alert("✅ Reserved", "Your trip has been successfully reserved!", [
      {
        text: "View Ticket",
        onPress: () => router.push("/(tabs)/rides"),
      },
    ]);

  } catch (err) {
    console.log("❌ Booking error:", err.response?.data || err.message);

    const msg =
      err.response?.data?.error ||
      (err.message.includes("Network")
        ? "Network error. Please try again."
        : "Something went wrong.");

    if (
      msg.toLowerCase().includes("already booked") ||
      msg.toLowerCase().includes("duplicate")
    ) {
      Alert.alert(
        "⚠️ Duplicate Booking",
        "You've already booked for this date/slot."
      );
    } else {
      Alert.alert("Booking Error", msg);
    }
  }
};


  if (!loadingPass && hasPass === false) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: "#CFE9FF" }]}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[NAVY]} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Banner leading to pass booking */}
          <View style={styles.bannerWrapper}>
            <TouchableOpacity onPress={() => router.push("/book-pass")} activeOpacity={0.9}>
              <Image source={require("../../assets/book.png")} style={styles.bannerImage} />
            </TouchableOpacity>
          </View>

          <View style={styles.noPassContainer}>
            <Text style={styles.noPassTitle}>How it works</Text>

            <View style={styles.bulletCard}>
              <View style={styles.bulletIcon}>
                <Ionicons name="bus" size={22} color="white" />
              </View>
              <Text style={styles.bulletText}>
                Grab a weekly/monthly pass and reserve your seat.
              </Text>
            </View>

            <View style={styles.bulletCard}>
              <View style={styles.bulletIcon}>
                <Ionicons name="shield-checkmark" size={22} color="white" />
              </View>
              <Text style={styles.bulletText}>
                Pre-book your daily boarding pass for the time slot that fits your day.
              </Text>
            </View>

            <View style={styles.bulletCard}>
              <View style={styles.bulletIcon}>
                <Ionicons name="qr-code-outline" size={22} color="white" />
              </View>
              <Text style={styles.bulletText}>
                Hop on the bus and scan the QR to confirm your seat.
              </Text>
            </View>

            <View style={styles.bulletCard}>
              <View style={styles.bulletIcon}>
                <Ionicons name="checkmark-done" size={22} color="white" />
              </View>
              <Text style={styles.bulletText}>
                Enjoy a smooth and comfortable last-mile ride.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.getStartedBtn}
              onPress={() => router.push("/book-pass")}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[NAVY]} />
        }
      >
        {/* Banner */}
        <View style={styles.bannerWrapper}>
          <TouchableOpacity onPress={() => router.push("/book-pass")} activeOpacity={0.9}>
            <Image source={require("../../assets/book.png")} style={styles.bannerImage} />
          </TouchableOpacity>
        </View>

        <Text style={styles.bookingHeader}>Reserve your office ride today!</Text>

        {/* Trip type */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setTripType("round")}
            style={[styles.tab, tripType === "round" && styles.tabActive]}
          >
            <Text style={[styles.tabText, tripType === "round" && styles.tabTextActive]}>
              🔄 Round Trip
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTripType("oneway")}
            style={[styles.tab, tripType === "oneway" && styles.tabActive]}
          >
            <Text style={[styles.tabText, tripType === "oneway" && styles.tabTextActive]}>
              ➡️ One Way
            </Text>
          </TouchableOpacity>
        </View>
        {/* Date choice */}
<View style={styles.card}>

  <View style={styles.dateRow}>
    {/* Date display */}
    <View>
      <Text style={styles.bigDate}>
        {day === "today"
          ? new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
            })
          : new Date(Date.now() + 86400000).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
            })}
      </Text>
      <Text style={styles.smallDay}>
        {day === "today"
          ? new Date().toLocaleDateString("en-GB", { weekday: "short" })
          : new Date(Date.now() + 86400000).toLocaleDateString("en-GB", {
              weekday: "short",
            })}
      </Text>
    </View>

    {/* Toggle buttons */}
    <View style={styles.toggleRow}>
      <TouchableOpacity
        onPress={() => setDay("today")}
        style={[styles.dayBtnSmall, day === "today" && styles.dayBtnSmallActive]}
      >
        <Text
          style={[
            styles.dayBtnTextSmall,
            day === "today" && styles.dayBtnTextSmallActive,
          ]}
        >
          Today
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setDay("tomorrow")}
        style={[
          styles.dayBtnSmall,
          day === "tomorrow" && styles.dayBtnSmallActive,
        ]}
      >
        <Text
          style={[
            styles.dayBtnTextSmall,
            day === "tomorrow" && styles.dayBtnTextSmallActive,
          ]}
        >
          Tomorrow
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</View>

        {/* From (pickup slot + location) */}
        <View style={styles.card}>
          <Text style={styles.label}>From (Pickup Trip)</Text>
          <View style={styles.row}>
  {/* Hide slot button when in one-way drop mode */}
  {!(tripType === "oneway" && oneWayDirection === "drop") && (
    <TouchableOpacity
      style={styles.clockBtn}
      onPress={() => setShowFromDropdown((prev) => !prev)}
    >
      <Ionicons name="time-outline" size={28} color="#1E3A8A" />
      <Text style={styles.slotChosen}>
        {fromSlot
          ? pickupSlots.find((s) => s.slot === fromSlot)?.slot
          : "Select"}
      </Text>
    </TouchableOpacity>
  )}

  <View style={styles.textBox}>
    <Text style={styles.inputText}>{from}</Text>
  </View>
</View>

          {showFromDropdown && (
  <FlatList
  data={pickupSlots}
  keyExtractor={(item, i) => i.toString()}
  scrollEnabled={false}
  renderItem={({ item }) => (
    <TouchableOpacity
        disabled={slotIsDisabled(item)}   
        style={[styles.dropdownItem, slotIsDisabled(item) && { opacity: 0.5 }]} 
        onPress={() => {
          if (!slotIsDisabled(item)) {   
            setFromSlot(item.slot);
            setShowFromDropdown(false);
          }
        }}
      >
      <Text style={styles.dropdownText}>
          {item.slot}{" "}
          {item.status?.toLowerCase() !== "active"
            ? "❌ Not available"  
            : `(${item.available} seats left)`}
        </Text>
    </TouchableOpacity>
  )}
/>
)}

        </View>
        {/* ↕️ Toggle direction for one-way trip */}
{tripType === "oneway" && (
  <View style={styles.swapWrapper}>
    <TouchableOpacity
      onPress={() => {
        if (tripType === "oneway") {
          setOneWayDirection((prev) =>
            prev === "pickup" ? "drop" : "pickup"
          );
          // clear slots when switching
          setFromSlot(null);
          setToSlot(null);
        }
      }}
      style={[
        styles.swapButton,
        oneWayDirection === "pickup"
          ? styles.swapPickupActive
          : styles.swapDropActive,
      ]}
      activeOpacity={0.7}
    >
      <Ionicons
        name="swap-vertical"
        size={24}
        color={oneWayDirection === "pickup" ? "#2563EB" : "#0D9488"}
      />
    </TouchableOpacity>
  </View>
)}

        {/* To (drop slot + location) */}
        <View style={styles.card}>
          <Text style={styles.label}>To (Drop Trip)</Text>
          <View style={styles.row}>
            <View style={styles.textBox}>
              <Text style={styles.inputText}>{to}</Text>
            </View>

            {(tripType === "round" ||
  (tripType === "oneway" && oneWayDirection === "drop")) ? (
  <TouchableOpacity
    style={[
      styles.clockBtn,
      tripType === "oneway" && oneWayDirection === "pickup" && { opacity: 0.4 },
    ]}
    disabled={tripType === "oneway" && oneWayDirection === "pickup"}
    onPress={() => setShowToDropdown((prev) => !prev)}
  >
    <Ionicons name="time-outline" size={28} color="#1E3A8A" />
    <Text style={styles.slotChosen}>
      {toSlot ? dropSlots.find((s) => s.slot === toSlot)?.slot : "Select"}
    </Text>
  </TouchableOpacity>
) : (
  <View style={styles.clockBtn}>
    <Text style={styles.slotChosen}>–</Text>
  </View>
)}

          </View>

          {showToDropdown &&
  (tripType === "round" ||
    (tripType === "oneway" && oneWayDirection === "drop")) && (
    <View style={styles.dropdownContainer}>
      {dropSlots.map((item, i) => {
        const isDisabled = slotIsDisabled(item);
        return (
          <TouchableOpacity
            key={i}
            disabled={isDisabled}
            style={[styles.dropdownItem, isDisabled && { opacity: 0.5 }]}
            onPress={() => {
              if (!isDisabled) {
                setToSlot(item.slot);
                setShowToDropdown(false);
              }
            }}
          >
            <Text style={styles.dropdownText}>
              {item.slot}{" "}
              {item.status?.toLowerCase() !== "active"
                ? "❌ Not available"
                : `(${item.available} seats left)`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  )}

        </View>

        {/* Confirm button */}
        <TouchableOpacity
          disabled={!canConfirm || !routeReady}
          onPress={handleConfirm}
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
        >
          <Text style={styles.confirmText}>Confirm Your Seat</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_BG = "#F9FAFB";
const TEAL = "#06B6D4";
const NAVY = "#1E3A8A";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F9FF" },
  bannerImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  heroCard: {
    margin: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#CFE9FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  heroSub: { fontSize: 14, color: "#1f2937" },
  heroImage: { width: 120, height: 120 },
  tabs: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 6,
    marginTop: 10,
    flexDirection: "row",
    elevation: 2,
  },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  tabActive: { backgroundColor: "white", elevation: 2 },
  tabText: { color: "#334155", fontWeight: "600", fontSize: 16 },
  tabTextActive: { color: NAVY },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    elevation: 3,
  },
  label: { color: NAVY, fontWeight: "700", fontSize: 16, marginBottom: 8 },
  row: { flexDirection: "row", gap: 12 },
  textBox: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  inputText: { fontSize: 16, color: "#0f172a", paddingVertical: 12 },
  clockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: CARD_BG,
    padding: 10,
    borderRadius: 14,
  },
  slotChosen: { fontSize: 15, color: "#334155", fontWeight: "600" },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  dropdownText: { fontSize: 15, color: "#1E293B" },
  dayRow: { flexDirection: "row", gap: 12 },
  dayBtn: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
  },
  dayBtnActive: { backgroundColor: TEAL },
  dayText: { fontWeight: "700", color: "#334155", fontSize: 16 },
  dayTextActive: { color: "white" },
  confirmBtn: {
    backgroundColor: NAVY,
    borderRadius: 24,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 24,
    marginHorizontal: 80,
    elevation: 5,
  },
  bookingHeader: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E3A8A",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  dateRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

bigDate: {
  fontSize: 22,
  fontWeight: "800",
  color: "#0f172a",
},

smallDay: {
  fontSize: 16,
  color: "#64748b",
},

toggleRow: {
  flexDirection: "row",
  gap: 6,
},

dayBtnSmall: {
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#CBD5E1",
  marginLeft: 6,
},

dayBtnSmallActive: {
  backgroundColor: "#2563eb",
  borderColor: "#2563eb",
},

dayBtnTextSmall: {
  fontSize: 14,
  fontWeight: "600",
  color: "#475569",
},

dayBtnTextSmallActive: {
  color: "white",
},
swapWrapper: {
  alignItems: "center",
  marginVertical: -10,
  zIndex: 10,
},

swapButton: {
  backgroundColor: "white",
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#BFDBFE",
  padding: 8,
  elevation: 3,
},

swapPickupActive: {
  backgroundColor: "#DBEAFE", // light blue (pickup active)
},

swapDropActive: {
  backgroundColor: "#CCFBF1", // light teal (drop active)
},

  confirmBtnDisabled: { backgroundColor: "#94a3b8" },
  confirmText: { color: "white", fontSize: 18, fontWeight: "800" },
  noPassContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F9FF",
    gap: 14,
  },
  noPassTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: NAVY,
    alignSelf: "center",
  },
  noPassText: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    marginHorizontal: 12,
  },
  getStartedBtn: {
    marginTop: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: NAVY,
    borderRadius: 10,
    alignSelf: "stretch",
    alignItems: "center",
  },
  getStartedText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  bulletCard: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  bulletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "600",
  },
});
