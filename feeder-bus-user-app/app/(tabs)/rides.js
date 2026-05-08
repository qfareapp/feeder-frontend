import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";

import api from "../../api/api";

export default function BookedTicketScreen() {
  const router = useRouter();
  const [activeBooking, setActiveBooking] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ⭐ Add this block here (after state declarations)
const fetchBusDetails = useCallback(async (busId) => {
  if (!busId) return null;

  try {
    const res = await api.get(`/buses/${busId}`);
    return res.data?.bus || null;
  } catch (err) {
    console.log("❌ Bus lookup failed:", err.response?.data || err.message);
    return null;
  }
}, []);

const formatISTDate = (dateVal) => {
  if (!dateVal) return "-";
  const date = new Date(dateVal);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const buildTimeFromSlot = (slot, dateVal) => {
  if (!slot) return null;
  const base = dateVal ? new Date(dateVal) : new Date();
  if (slot.includes(":")) {
    const [h, m] = slot.split(":");
    const hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
      base.setHours(hour);
      base.setMinutes(minute);
      base.setSeconds(0);
      base.setMilliseconds(0);
      return base;
    }
  }
  return null;
};

const formatISTTime = (timeVal, dateVal) => {
  if (!timeVal) return "-";
  let dateObj = null;

  if (timeVal instanceof Date || !Number.isNaN(Date.parse(timeVal))) {
    dateObj = new Date(timeVal);
  } else {
    dateObj = buildTimeFromSlot(String(timeVal), dateVal);
  }

  if (!dateObj) return typeof timeVal === "string" ? timeVal : "-";

  return dateObj.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

const formatDuration = (start, end) => {
  if (!start || !end) return null;
  const startDate = start instanceof Date || !Number.isNaN(Date.parse(start)) ? new Date(start) : null;
  const endDate = end instanceof Date || !Number.isNaN(Date.parse(end)) ? new Date(end) : null;
  if (!startDate || !endDate) return null;
  const diffMs = endDate - startDate;
  if (diffMs <= 0) return null;
  const mins = Math.round(diffMs / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}m`;
};


const loadAll = useCallback(async () => {
  if (!refreshing) setLoading(true);
  try {
    // 1?? Get userId
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      setActiveBooking(null);
      setRides([]);
      return;
    }

    // 2?? Fetch Ride History from BACKEND
    let historyIds = [];
    const historyTrips = {};
    try {
      const historyRes = await api.get(`/rides/user/${userId}`);
      if (historyRes.data.success) {
        historyRes.data.rides.forEach((r) => {
          const bid = (r.bookingId || r._id || "").toString();
          if (!bid) return;
          historyIds.push(bid);
          if (!historyTrips[bid]) historyTrips[bid] = new Set();
          if (r.tripType) historyTrips[bid].add(r.tripType);
        });

        const sorted = historyRes.data.rides.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setRides(sorted);
      }
    } catch (err) {
      console.log("? Failed to fetch ride history:", err.message);
    }

    // 3?? Check backend active booking
    const res = await api.get(`/daily-bookings/active/${userId}`);

    // ? Backend says NO active booking ? clear active booking
    if (!res.data.booking) {
      console.log("?? Backend shows no active booking ? clearing local activeBooking");

      await AsyncStorage.removeItem("activeBooking");
      await AsyncStorage.removeItem("activeBookingId");
      await AsyncStorage.removeItem("scanTripType");

      setActiveBooking(null);
      return;
    }

    // ? Backend HAS an active booking ? update normally
    if (res.data.success && res.data.booking) {
      const booking = res.data.booking;
      const bookingIdStr = (booking._id || booking.bookingId || "").toString();

      const pickupDone =
        booking.pickupCompleted ||
        historyTrips[bookingIdStr]?.has("pickup") ||
        !booking.pickupSlot;
      const dropDone =
        booking.dropCompleted ||
        historyTrips[bookingIdStr]?.has("drop") ||
        !booking.dropSlot;

      // If both legs are done, clear locally
      if (pickupDone && dropDone) {
        await AsyncStorage.removeItem("activeBooking");
        await AsyncStorage.removeItem("activeBookingId");
        await AsyncStorage.removeItem("scanTripType");
        setActiveBooking(null);
        return;
      }

      // Fetch bus details manually
      const pickupBus = await fetchBusDetails(
        booking.pickupBusId?._id || booking.pickupBusId
      );

      const dropBus = await fetchBusDetails(
        booking.dropBusId?._id || booking.dropBusId
      );

      const mergedBooking = {
        ...booking,
        pickupBus,
        dropBus,
        pickupCompleted: pickupDone,
        dropCompleted: dropDone,
      };

      // Save locally
      await AsyncStorage.setItem("activeBooking", JSON.stringify(mergedBooking));

      setActiveBooking(mergedBooking);
      return;
    }

    // 4?? Fallback ? use stored local active booking
    const storedActive = await AsyncStorage.getItem("activeBooking");
    if (storedActive) {
      console.log("?? Using stored local activeBooking");

      const parsed = JSON.parse(storedActive);

      // If backend already moved this booking fully to history, drop local cache
      const parsedId = (parsed._id || parsed.bookingId || "").toString();
      const pickupDone =
        parsed.pickupCompleted ||
        historyTrips[parsedId]?.has("pickup") ||
        !parsed.pickupSlot;
      const dropDone =
        parsed.dropCompleted || historyTrips[parsedId]?.has("drop") || !parsed.dropSlot;

      if (pickupDone && dropDone) {
        await AsyncStorage.removeItem("activeBooking");
        await AsyncStorage.removeItem("activeBookingId");
        await AsyncStorage.removeItem("scanTripType");
        setActiveBooking(null);
        return;
      }

      parsed.pickupCompleted = pickupDone;
      parsed.dropCompleted = dropDone;

      if (!parsed.pickupBus && parsed.pickupBusId) {
        parsed.pickupBus = await fetchBusDetails(
          parsed.pickupBusId?._id || parsed.pickupBusId
        );
      }

      if (!parsed.dropBus && parsed.dropBusId) {
        parsed.dropBus = await fetchBusDetails(
          parsed.dropBusId?._id || parsed.dropBusId
        );
      }

      setActiveBooking(parsed);
    }
  } catch (err) {
    console.log("Error loading active booking:", err.message);
  } finally {
    setLoading(false);
  }
}, [fetchBusDetails, refreshing]);

useEffect(() => {
  loadAll();
}, [loadAll]);

useFocusEffect(
  useCallback(() => {
    loadAll();
  }, [loadAll])
);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }
const SCREEN_WIDTH = Dimensions.get("window").width;

const activeCards = [];

if (activeBooking) {
  // ⭐ PICKUP TRIP CARD (only if not completed)
  if (activeBooking.pickupSlot && !activeBooking.pickupCompleted) {
    activeCards.push({
      type: "pickup",
      tripTitle: "Pickup Trip",

      bus: activeBooking.pickupBus || {},

      // ⭐ Correct seat number
      seat: activeBooking.pickupSeatNo || null,

      time: activeBooking.pickupSlot || "-",

      // ⭐ Correct direction: Home → Office
      locationFrom: activeBooking.pickupLocation || "Pickup Point",
      locationTo: activeBooking.dropLocation || "Destination",

      // ⭐ Safe busId resolution (populated or ObjectId)
      busId:
        activeBooking.pickupBus?._id ||
        activeBooking.pickupBusId?._id ||
        activeBooking.pickupBusId ||
        null,
    });
  }

  // ⭐ DROP TRIP CARD (only if evening trip exists and not completed)
  if (
    activeBooking.dropSlot &&
    !activeBooking.dropCompleted &&
    (activeBooking.dropBusId || activeBooking.dropBus)
  ) {
    activeCards.push({
      type: "drop",
      tripTitle: "Drop Trip",

      bus: activeBooking.dropBus || {},

      // ⭐ Correct seat number
      seat: activeBooking.dropSeatNo || null,

      time: activeBooking.dropSlot || "-",

      // ⭐ Correct direction: Office → Home
      locationFrom: activeBooking.dropLocation || "Drop Point",
      locationTo: activeBooking.pickupLocation || "Home",

      // ⭐ Safe busId resolution
      busId:
        activeBooking.dropBus?._id ||
        activeBooking.dropBusId?._id ||
        activeBooking.dropBusId ||
        null,
    });
  }
}

  const historyList = rides;

  const handleBoardBus = async (busId, tripType) => {
  await AsyncStorage.setItem("activeBookingId", activeBooking._id);

  // Store both bus IDs safely
  await AsyncStorage.setItem(
    "pickupBusId",
    activeBooking.pickupBus?._id ||
      activeBooking.pickupBusId?._id ||
      activeBooking.pickupBusId ||
      ""
  );

  await AsyncStorage.setItem(
    "dropBusId",
    activeBooking.dropBus?._id ||
      activeBooking.dropBusId?._id ||
      activeBooking.dropBusId ||
      ""
  );

  // ⭐ NEW — Store registration numbers (needed for QR → busId auto-match)
  await AsyncStorage.setItem(
    "pickupReg",
    activeBooking.pickupBus?.regNumber || ""
  );

  await AsyncStorage.setItem(
    "dropReg",
    activeBooking.dropBus?.regNumber || ""
  );

  // Store which trip user is boarding
  await AsyncStorage.setItem("scanTripType", tripType);

  router.push("/qr/scanner");
};


  return (
    <ImageBackground
      source={require("../../assets/skyline.png")}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1E3A8A"]} />
        }
      >

        {/* ------------------------------------------------------------------ */}
        {/* ----------------------- ACTIVE BOOKING CARD ----------------------- */}
        {/* ------------------------------------------------------------------ */}
       <Text style={styles.pageTitle}>My Rides</Text>
<Text style={styles.sectionTitle}>Active Booking</Text>

{!activeBooking || activeCards.length === 0 ? (
  <View style={styles.noActiveBox}>
    <Text style={styles.noActiveText}>No Active Booking</Text>
  </View>
) : (
  <View style={{ width: SCREEN_WIDTH * 0.92, height: 420, marginTop: 10, paddingBottom: 12 }}>
    <Carousel
      width={SCREEN_WIDTH * 0.92}
      height={420}
      data={activeCards}
      pagingEnabled
      snapEnabled
      loop={false}
      mode="parallax"
      modeConfig={{
        parallaxScrollingScale: 0.9,
        parallaxScrollingOffset: 50,
      }}
      renderItem={({ item }) => (
        <View style={styles.cardStack}>
          
          {/* Back stacked cards */}
          <View style={[styles.ticketCard, styles.ticketCardBehindLeft]} />
          <View style={[styles.ticketCard, styles.ticketCardBehindRight]} />

          {/* Main gradient card */}
          <LinearGradient
            colors={["#1E3A8A", "#0f172a"]}
            style={styles.ticketCard}
          >
            <View style={styles.ticketTop}>
              <Text style={styles.routeTag}>{item.tripTitle}</Text>

              {/* Route + Seat number */}
              <View style={styles.routeRowTop}>
                <Text style={styles.routeNumber}>
                  Route {activeBooking.routeNo || "-"}
                </Text>

                <Text style={styles.seatTopText}>
                  {item.seat ? `Seat ${item.seat}` : "Seat # Not Assigned"}
                </Text>
              </View>

              {/* Date */}
              <Text style={styles.dateText}>{formatISTDate(activeBooking.date)}</Text>

              {/* Locations */}
              <View style={styles.locationRow}>
                <View style={styles.locationCol}>
                  <Text style={styles.locationLabel}>From</Text>
                  <Text style={styles.locationMain}>{item.locationFrom}</Text>
                  <Text style={styles.locationTime}>{item.time}</Text>
                </View>

                <Ionicons name="arrow-forward" size={22} color="#E5E7EB" />

                <View style={styles.locationCol}>
                  <Text style={styles.locationLabel}>To</Text>
                  <Text style={styles.locationMain}>{item.locationTo}</Text>
                </View>
              </View>

              {/* BUS INFO */}
              <View style={styles.busRow}>
                
                {/* Bus Number */}
                <View>
                  <Text style={styles.busLabel}>Bus No</Text>
                  <Text style={styles.busValue}>
                    {item.bus?.regNumber || "TBA"}
                  </Text>
                </View>

                {/* Driver Info */}
                <View>
  <Text style={styles.busLabel}>Driver</Text>

  <Text style={styles.busValue}>
    {item.bus?.driverName || "Assigned Soon"}
  </Text>

  <TouchableOpacity
    onPress={() =>
      item.bus?.driverContact &&
      Linking.openURL(`tel:${item.bus.driverContact}`)
    }
    disabled={!item.bus?.driverContact}
    style={{ marginTop: 4 }}
  >
    <Ionicons
      name="call"
      size={20}
      color={item.bus?.driverContact ? "#10B981" : "#94a3b8"} // green OR grey
    />
  </TouchableOpacity>
</View>


              </View>
            </View>

            {/* Bottom CTA */}
            <View style={styles.ticketBottom}>
              <View style={styles.perfLine} />

              <TouchableOpacity
                activeOpacity={item.seat ? 1 : 0.85}
                disabled={!!item.seat}
                style={[
                  styles.credButton,
                  item.seat && {
                    backgroundColor: "#94a3b8",
                    shadowOpacity: 0,
                  },
                ]}
                onPress={() => !item.seat && handleBoardBus(item.busId, item.type)}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0)"]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.credButtonGradient}
                />

                <Ionicons name="qr-code-outline" size={20} color="#fff" />
                <Text
                  style={[
                    styles.credButtonText,
                    item.seat && { color: "#e2e8f0" },
                  ]}
                >
                  {item.seat ? "Seat Assigned" : "Board Bus"}
                </Text>
              </TouchableOpacity>
            </View>

          </LinearGradient>
        </View>
      )}
    />
  </View>
)}


        {/* ------------------------------------------------------------------ */}
        {/* ------------------------- RIDE HISTORY ---------------------------- */}
        {/* ------------------------------------------------------------------ */}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Ride History</Text>

        {historyList.length === 0 ? (
          <View style={styles.noActiveBox}>
            <Text style={styles.noActiveText}>No Ride History Yet</Text>
          </View>
        ) : (
          historyList.map((ride, i) => {
            const startTime =
              ride.scheduleId?.startTime || buildTimeFromSlot(ride.time, ride.date);
            const endTime = ride.scheduleId?.endTime || null;
            const duration = formatDuration(startTime, endTime);

            return (
              <View key={i} style={styles.historyItem}>
                <Ionicons name="bus" size={24} color="#0f172a" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle}>
                    {ride.pickupLocation} → {ride.dropLocation}
                  </Text>
                  <Text style={styles.historySub}>
                    {formatISTDate(ride.date)} • {formatISTTime(startTime, ride.date)}
                    {endTime ? ` → ${formatISTTime(endTime, ride.date)}` : ""}
                    {duration ? ` • ${duration}` : ""}
                  </Text>
                  <Text style={styles.historyMeta}>
                    Trip: {ride.tripType === "drop" ? "Drop" : "Pickup"} • Completed
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            );
          })
        )}

      </ScrollView>
    </ImageBackground>
  );
}

/* --------------------------- STYLES --------------------------- */

const BLUE = "#2563eb";
const WHITE = "#fff";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },

  /* ===========================
     EXISTING BOARDING PASS STYLES
     =========================== */
  card: {
    width: "100%",
    backgroundColor: BLUE,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 6,
  },
  header: {
    backgroundColor: BLUE,
    paddingVertical: 14,
    alignItems: "center",
  },
  boardingText: {
    color: "white",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 1.5,
  },

  routeSection: {
    backgroundColor: BLUE,
    paddingVertical: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1E40AF",
  },
  routeMain: {
    color: "white",
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 1,
  },
  routeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
  },
  routeBox: {
    alignItems: "center",
    flex: 1,
  },
  cityLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  timeText: {
    color: "#E0E7FF",
    fontSize: 13,
    marginTop: 2,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: WHITE,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 13,
    color: "#64748b",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },

  ticketBox: {
    backgroundColor: WHITE,
    alignItems: "center",
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  serialText: {
    color: "#1E3A8A",
    fontWeight: "700",
    fontSize: 16,
    marginTop: 6,
  },
  terms: {
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    alignItems: "center",
  },
  termsText: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    marginBottom: 10,
  },
  journeyText: {
    color: BLUE,
    fontWeight: "800",
    fontSize: 16,
  },

  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BLUE,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  callText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },

  tripSection: {
    backgroundColor: WHITE,
    marginTop: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderColor: "#E2E8F0",
    borderWidth: 1,
  },
  tripHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E3A8A",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  tripDate: {
    color: "#E0E7FF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    letterSpacing: 0.5,
  },

  seatValue: {
    color: "#1E3A8A",
    fontWeight: "800",
  },

  seatBadge: {
    backgroundColor: "#DBEAFE",
    color: "#1E3A8A",
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: "center",
  },

  credButton: {
  marginTop: 10,
  paddingVertical: 14,
  paddingHorizontal: 22,
  borderRadius: 40,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",

  // CRED signature glossy gradient 🔥
  backgroundColor: "#141414",
  overflow: "hidden",

  // soft outer shadow like CRED
  shadowColor: "#000",
  shadowOpacity: 0.25,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
},

credButtonGradient: {
  ...StyleSheet.absoluteFillObject,
  borderRadius: 40,
},

credButtonText: {
  color: "#fff",
  fontSize: 16,
  letterSpacing: 0.4,
  fontWeight: "800",
  marginLeft: 8,
},


  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  /* ======================================
     NEW: CRED STYLE GRADIENT CARD ELEMENTS
     ====================================== */

  cardStack: {
    width: "100%",
    marginBottom: 20,
    position: "relative",
    alignItems: "center",
  },

  ticketCard: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    minHeight: 380,
  },

  ticketCardBehindLeft: {
    position: "absolute",
    top: 10,
    left: -12,
    width: "100%",
    height: "100%",
    backgroundColor: "#c7d2fe",
    borderRadius: 20,
    opacity: 0.4,
    transform: [{ scale: 0.95 }],
  },

  ticketCardBehindRight: {
    position: "absolute",
    top: 18,
    right: -20,
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e7ff",
    borderRadius: 20,
    opacity: 0.3,
    transform: [{ scale: 0.9 }],
  },

  ticketTop: {
    padding: 20,
  },

  routeTag: {
    color: "#bfdbfe",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },

  dateText: {
    color: "#E5E7EB",
    marginTop: 4,
    marginBottom: 12,
    fontSize: 14,
  },

  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  locationCol: {
    maxWidth: "48%",
  },

  locationLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    textTransform: "uppercase",
  },

  locationMain: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
  },

  locationTime: {
    color: "#E5E7EB",
    fontSize: 13,
    marginTop: 2,
  },

  busRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  busLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    textTransform: "uppercase",
  },

  busValue: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "700",
  },

  ticketBottom: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },

  perfLine: {
    width: "100%",
    borderStyle: "dashed",
    borderWidth: 0.6,
    borderColor: "#CBD5E1",
    marginBottom: 14,
  },
  routeNumber: {
  color: "#F9FAFB",
  fontSize: 18,
  fontWeight: "800",
  marginTop: 6,
  marginBottom: 8,
  letterSpacing: 0.8,
},
noActiveBox: {
  width: "90%",
  backgroundColor: "#fff",
  paddingVertical: 20,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
  marginTop: 10,
  elevation: 3,
},

noActiveText: {
  fontSize: 16,
  fontWeight: "700",
  color: "#64748B",
},

cardUpcoming: {
  width: "92%",
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 14,
  marginVertical: 6,
  elevation: 3,
},
routeRowTop: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 6,
  marginBottom: 8,
},

seatTopText: {
  color: "#FACC15",       // yellow-gold
  fontSize: 18,
  fontWeight: "900",
  letterSpacing: 1,
},
pageTitle: {
  fontSize: 22,
  fontWeight: "800",
  color: "#1E3A8A",
  marginBottom: 10,
},
  busPhone: {
    color: "#CBD5E1",
    fontSize: 13,
    marginTop: 2,
  },

  /* Ride history list */
  historyItem: {
    width: "92%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  historySub: {
    fontSize: 13,
    color: "#334155",
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },


});
