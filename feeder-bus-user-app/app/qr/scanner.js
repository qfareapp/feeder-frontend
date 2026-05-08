import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity, Vibration, View
} from "react-native";
import api from "../../api/api"; // ✅ ensure you have this axios instance set up

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState("off"); // flashlight toggle
  const router = useRouter();

  // Animation
  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  // reset state every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setLoading(false);

      // start scan line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(moveAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(moveAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, [])
  );

const handleBarCodeScanned = async ({ data }) => {
  if (scanned) return;
  setScanned(true);
  setLoading(true);

  try {
    // ----------- 1️⃣ Parse QR -------------------
    let qrToken = "";
    let busId = "";

    try {
      const parsed = JSON.parse(data);
      qrToken = parsed.qrToken || parsed.token || "";
      busId =
        parsed.bus_id ||
        parsed.busId ||
        parsed.busID ||
        parsed.bus?._id ||
        parsed.bus?.id ||
        "";
    } catch {
      qrToken = data;
    }

    if (!qrToken) throw new Error("Invalid QR Code");
    // ⭐ AUTO-DETECT busId FROM QR TOKEN IF NOT FOUND IN QR JSON
if (!busId) {
  const regMatch = qrToken.match(/BUSQR-([a-zA-Z0-9]+)-/);
  const regNumber = regMatch ? regMatch[1] : null;

  if (regNumber) {
    try {
      const busRes = await api.get(`/buses/reg/${regNumber}`);
      busId = busRes.data?.bus?._id || "";
    } catch (err) {
      console.log("❌ Failed to map regNumber → busId");
    }
  }
}
    // ----------- 2️⃣ Fetch local session ---------
    const userId = await AsyncStorage.getItem("userId");
    const bookingId = await AsyncStorage.getItem("activeBookingId");
    const tripType = await AsyncStorage.getItem("scanTripType");

let expectedBusId = "";
if (tripType === "pickup") {
  expectedBusId = await AsyncStorage.getItem("pickupBusId");
} else {
  expectedBusId = await AsyncStorage.getItem("dropBusId");
}


    if (!userId || !bookingId) {
      Alert.alert(
        "⚠️ Missing Info",
        "Please re-open your ticket and try again."
      );
      throw new Error("Missing session data");
    }

    console.log("🧾 Scanner:", {
      userId,
      bookingId,
      qrToken,
      expectedBusId,
      scannedBusId: busId,
    });

    // ----------- 3️⃣ Wrong Bus Check -------------
const expected = String(expectedBusId || "").trim().toLowerCase();
const scannedBus = String(busId || "").trim().toLowerCase();

if (expected && scannedBus && expected !== scannedBus) {
  Vibration.vibrate(300);
  setLoading(false);
  Alert.alert("🚌 Wrong Bus", "Please board your assigned bus only.");
  setTimeout(() => setScanned(false), 2000);
  return;
}


    // ----------- 4️⃣ Correct API endpoint --------
    const activeBooking = JSON.parse(await AsyncStorage.getItem("activeBooking"));
 const date = activeBooking.date;
 const pickupSlot = activeBooking.pickupSlot;
 const dropSlot = activeBooking.dropSlot;
 const slotToUse = tripType === "pickup" ? pickupSlot : dropSlot;

 const res = await api.post("/daily-bookings/board", {
   userId,
   date,
   pickupSlot: slotToUse,
   busId
 });

    setLoading(false);

    // ----------- 5️⃣ Success Case ----------------
    if (res.data.success) {
      const seatNo = res.data.seatNo;
      const tripType = res.data.tripType; // "pickup" | "drop"

      Alert.alert("🎉 Boarding Confirmed", `Seat No: ${seatNo}`);

      // ----------- 6️⃣ Update activeBooking locally -----
      let stored = await AsyncStorage.getItem("activeBooking");
      if (stored) {
        stored = JSON.parse(stored);

        if (tripType === "pickup") {
          stored.pickupSeatNo = seatNo;
          stored.pickupBoarded = true;
        } else {
          stored.dropSeatNo = seatNo;
          stored.dropBoarded = true;
        }

        await AsyncStorage.setItem("activeBooking", JSON.stringify(stored));
      }

      // ----------- 7️⃣ Navigate -------------------
      router.push({
        pathname: "/qr/BoardingSuccess",
        params: {
          seat_no: seatNo,
          bus_id: busId || expectedBusId,
          booking_id: bookingId,
          trip_type: tripType,
        },
      });

      return;
    }

    // ----------- 8️⃣ Backend returned failure --------
    const message = res.data.message || "Unable to confirm boarding.";
    Alert.alert("❌ Boarding Failed", message);
    setTimeout(() => setScanned(false), 2500);

  } catch (err) {
    setLoading(false);
    setScanned(false);

    const msg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Server error. Please try again.";

    console.error("Scan Error:", msg);

    if (msg.toLowerCase().includes("wrong bus")) {
      Vibration.vibrate(300);
      Alert.alert("🚌 Wrong Bus", "This ticket is for another bus.");
    } else if (msg.toLowerCase().includes("invalid qr")) {
      Alert.alert("⚠️ Invalid QR", "This QR code is invalid.");
    } else {
      Alert.alert("❌ Error", msg);
    }
  }
};



  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "black" }}>Camera permission not granted</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Interpolate animation for scan line
  const translateY = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200], // move inside scanning box
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Camera preview */}
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        enableTorch={flash === "on"}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlayContainer}>
        <Text style={styles.scanText}>Align QR code inside the frame</Text>

        {/* Scanning box */}
        <View style={styles.scannerBox}>
          {/* Animated scan line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY }],
              },
            ]}
          />
        </View>
      </View>

      {/* Loader */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff" }}>Assigning your seat...</Text>
        </View>
      )}

      {/* Flash & Close buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity onPress={() => setFlash(flash === "off" ? "on" : "off")}>
          <Ionicons
            name={flash === "off" ? "flashlight-outline" : "flashlight"}
            size={32}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-circle" size={40} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanText: {
    position: "absolute",
    top: 80,
    color: "white",
    fontSize: 18,
    fontWeight: "500",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scannerBox: {
    width: 250,
    height: 250,
    borderColor: "white",
    borderWidth: 2,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  scanLine: {
    width: "100%",
    height: 2,
    backgroundColor: "lime",
  },
  loaderOverlay: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 15,
    borderRadius: 8,
  },
  bottomButtons: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
  },
  permissionBtn: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  permissionBtnText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
