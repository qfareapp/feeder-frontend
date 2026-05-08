import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../api/api";
import { bookPass } from "../api/bookingApi";

export default function BookPassScreen() {
  const router = useRouter();

  // form states
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState("");
  const [selectedPickupTrip, setSelectedPickupTrip] = useState(null);
  const [selectedDropTrip, setSelectedDropTrip] = useState(null);
  const [selectedPass, setSelectedPass] = useState(null);
  const [agreed, setAgreed] = useState(false);
const [showTerms, setShowTerms] = useState(false);

  // backend data
  const [registeredLocations, setRegisteredLocations] = useState([]);
  const [dropOptions, setDropOptions] = useState([]);
  const [pickupTrips, setPickupTrips] = useState([]);
  const [dropTrips, setDropTrips] = useState([]);
  const [passOptions, setPassOptions] = useState([]);
  const [routeNo, setRouteNo] = useState(null);
  const [routeId, setRouteId] = useState(null); 

  // fetch active pickup locations
  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const res = await api.get("/societies");
        setRegisteredLocations(res.data || []);
      } catch (err) {
        console.error("Error fetching societies:", err.message);
      }
    };
    fetchSocieties();
  }, []);

  // fetch drop options when pickup chosen
  useEffect(() => {
    if (!pickupLocation) return;
    const fetchDropOptions = async () => {
      try {
        const res = await api.get(`/routes?from=${pickupLocation.name}`);
        setDropOptions(res.data || []);
      } catch (err) {
        console.error("Error fetching drop options:", err.message);
      }
    };
    fetchDropOptions();
  }, [pickupLocation]);

  // fetch schedules + pass options when pickup + drop chosen
  useEffect(() => {
    if (!pickupLocation || !dropLocation) return;

    const fetchSchedulesAndPass = async () => {
      try {
        const res = await api.get(
         `/routes/search?from=${pickupLocation.name}&to=${dropLocation}`
         );
        const allRoutes = res.data || [];

        const filteredRoutes = allRoutes.filter((r) => {
          const pick = pickupLocation.name?.toLowerCase().trim();
          const drop = dropLocation?.toLowerCase().trim();
          const stops = [r.startPoint, ...(r.stops || []), r.endPoint].map((s) =>
            s.toLowerCase().trim()
          );
          const pickupIndex = stops.indexOf(pick);
          const dropIndex = stops.indexOf(drop);
          return pickupIndex !== -1 && dropIndex !== -1 && pickupIndex < dropIndex;
        });

        if (filteredRoutes.length > 0) {
          const route = filteredRoutes[0];
          setRouteNo(route.routeNo); 
          setRouteId(route._id);
          setPickupTrips(route.tripSchedules.filter((s) => s.tripType === "pickup"));
          setDropTrips(route.tripSchedules.filter((s) => s.tripType === "drop"));
          setPassOptions([
            { type: "15 Days", amount: route.passAmount15 },
            { type: "30 Days", amount: route.passAmount30 },
          ]);
        } else {
          setPickupTrips([]);
          setDropTrips([]);
          setPassOptions([]);
        }
      } catch (err) {
        console.error("Error fetching routes or pass options:", err.message);
      }
    };

    fetchSchedulesAndPass();
  }, [pickupLocation, dropLocation]);

  // calculate availability
  const pickupAvailable =
    (selectedPickupTrip?.seats ?? 0) - (selectedPickupTrip?.booked ?? 0);
  const dropAvailable =
    (selectedDropTrip?.seats ?? 0) - (selectedDropTrip?.booked ?? 0);

  const finalPickupAvailable = pickupAvailable > 0 ? pickupAvailable : 0;
  const finalDropAvailable =
    finalPickupAvailable > 0 ? (dropAvailable > 0 ? dropAvailable : 0) : 0;

  // booking handler
  const handleBookNow = async () => {
  if (!agreed) {
    Alert.alert("Policy Agreement", "Please accept the Terms & Conditions to continue.");
    return;
  }
  if (!pickupLocation || !dropLocation || !selectedPickupTrip || !selectedDropTrip || !selectedPass) {
    Alert.alert("Missing fields", "Please select pickup, drop, both trip times, and a pass.");
    return;
  }

  if (finalPickupAvailable <= 0 || finalDropAvailable <= 0) {
    Alert.alert("No Seats Available", "One of the trips is already full!");
    return;
  }

  try {
    const userId = await AsyncStorage.getItem("userId"); // ✅ stored during login
    if (!userId) {
      Alert.alert("Login Required", "Please log in again to book a pass.");
      return;
    }

    // 🔧 Normalize routeId to always be a plain string
const cleanRouteId =
  typeof routeId === "object"
    ? routeId._id || routeId.$oid || String(routeId)
    : String(routeId || "");

const passData = {
  userId,
  pickupLocation: pickupLocation.name,
  dropLocation,
  pickupSlot: selectedPickupTrip.slot,
  dropSlot: selectedDropTrip.slot,
  durationDays: selectedPass.type === "15 Days" ? 15 : 30,
  price: selectedPass.amount,
  routeNo,
  routeId: cleanRouteId, // ✅ always string
};
console.log("📦 Sending booking payload:", JSON.stringify(passData, null, 2));
    const res = await bookPass(passData);

    if (res.data.success) {
      await AsyncStorage.setItem("activePass", JSON.stringify(res.data.pass)); // use activePass
      Alert.alert("✅ Pass Generated", "Your monthly pass is active!");
      router.push("/active-pass");
    } else {
      Alert.alert("Error", res.data.error || "Booking failed");
    }
  } catch (err) {
    console.error("Booking error:", err.response?.data || err.message);
    Alert.alert("Error", "Could not generate pass. Please try again.");
  }
};

  return (
    <ImageBackground
      source={require("../assets/skyline.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.overlay}>
            <View style={styles.card}>
              <Text style={styles.title}>Book Your Pass</Text>

              {/* 🚏 Pickup Location */}
              <Text style={styles.label}>Pickup Location</Text>
              {!pickupLocation ? (
                <View style={styles.pickupGrid}>
                  {registeredLocations.map((loc) => (
                    <TouchableOpacity
                      key={loc._id}
                      style={styles.pickupCard}
                      onPress={() => {
                        setPickupLocation(loc);
                        setDropLocation("");
                        setSelectedPickupTrip(null);
                        setSelectedDropTrip(null);
                      }}
                    >
                      <Image
                        source={
                          loc.logo ? { uri: loc.logo } : require("../assets/default-avatar.png")
                        }
                        style={styles.logo}
                        resizeMode="contain"
                      />
                      <Text style={styles.pickupText}>{loc.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.selectedBox}>
                  <Image
                    source={
                      pickupLocation.logo
                        ? { uri: pickupLocation.logo }
                        : require("../assets/default-avatar.png")
                    }
                    style={styles.logo}
                  />
                  <Text style={styles.pickupText}>{pickupLocation.name}</Text>
                  <TouchableOpacity onPress={() => setPickupLocation(null)}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 🚏 Drop Location */}
              {pickupLocation && !dropLocation && (
                <>
                  <Text style={styles.label}>Drop Location</Text>
                  <View style={styles.dropdownBox}>
                    {dropOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt._id}
                        style={styles.tripButton}
                        onPress={() => setDropLocation(opt.endPoint.toString())}
                      >
                        <Text style={{ fontWeight: "600" }}>
                          {opt.endPoint.toString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              {pickupLocation && dropLocation && (
                <View style={styles.selectedBox}>
                  <Text style={styles.pickupText}>{dropLocation}</Text>
                  <TouchableOpacity onPress={() => setDropLocation("")}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ⏰ Pickup Trips */}
              {pickupLocation &&
                dropLocation &&
                !selectedPickupTrip &&
                pickupTrips.length > 0 && (
                  <>
                    <Text style={styles.label}>Select Pickup Time</Text>
                    {pickupTrips.map((trip) => {
                      const available = (trip.seats || 0) - (trip.booked || 0);
                      return (
                        <TouchableOpacity
                          key={trip._id}
                          style={styles.tripButton}
                          onPress={() => setSelectedPickupTrip(trip)}
                        >
                          <Text
                            style={{
                              fontWeight: "600",
                              color: available > 0 ? "#1E3A8A" : "#DC2626",
                            }}
                          >
                            {trip.slot} –{" "}
                            {available > 0 ? `${available} seats left` : "Full"}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}

              {/* ⏰ Drop Trips — only if pickup has seats */}
              {pickupLocation &&
                dropLocation &&
                selectedPickupTrip &&
                finalPickupAvailable > 0 &&
                !selectedDropTrip &&
                dropTrips.length > 0 && (
                  <>
                    <Text style={styles.label}>Select Drop Time</Text>
                    {dropTrips.map((trip) => {
                      const available = (trip.seats || 0) - (trip.booked || 0);
                      return (
                        <TouchableOpacity
                          key={trip._id}
                          style={styles.tripButton}
                          onPress={() => setSelectedDropTrip(trip)}
                        >
                          <Text
                            style={{
                              fontWeight: "600",
                              color: available > 0 ? "#1E3A8A" : "#DC2626",
                            }}
                          >
                            {trip.slot} –{" "}
                            {available > 0 ? `${available} seats left` : "Full"}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}

              {/* 🎫 Pass Selection — only if both trips available */}
              {selectedPickupTrip &&
                selectedDropTrip &&
                finalPickupAvailable > 0 &&
                finalDropAvailable > 0 && (
                  <>
                    <Text style={styles.label}>Select Pass</Text>
                    <View style={{ marginBottom: 15 }}>
                      {passOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt.type}
                          style={[
                            styles.tripButton,
                            selectedPass?.type === opt.type &&
                              styles.tripButtonActive,
                          ]}
                          onPress={() => setSelectedPass(opt)}
                        >
                          <Text style={{ fontWeight: "600" }}>
                            {opt.type} – ₹{opt.amount}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

              {/* ✅ Final Summary */}
              {selectedPickupTrip && (
                <View style={styles.selectedBox}>
                  <Text style={styles.pickupText}>
                    Pickup: {selectedPickupTrip.slot} – {finalPickupAvailable} seats left
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedPickupTrip(null)}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>
              )}
              {selectedDropTrip && (
                <View style={styles.selectedBox}>
                  <Text style={styles.pickupText}>
                    Drop: {selectedDropTrip.slot} – {finalDropAvailable} seats left
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedDropTrip(null)}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>
              )}
              {/* ✅ Terms & Conditions */}
<View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
  <TouchableOpacity onPress={() => setAgreed(!agreed)}>
    <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
  </TouchableOpacity>
  <Text style={{ marginLeft: 8 }}>
    I agree to the{" "}
    <Text
      style={{ color: "#06B6D4", fontWeight: "700" }}
      onPress={() => setShowTerms(true)}
    >
      Terms & Conditions
    </Text>
  </Text>
</View>

{/* 📑 Terms Modal */}
{showTerms && (
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Terms & Conditions</Text>
      <ScrollView style={{ marginVertical: 10 }}>
        <Text style={styles.modalText}>
          1. A 30 Days Pass is valid for 30 consecutive days from activation.{"\n\n"}
          2. A 15 Days Pass is valid for 15 consecutive days.{"\n\n"}
          3. Passes are non-transferable and non-refundable.{"\n\n"}
          4. Schedule is subject to operational changes.{"\n\n"}
          5. Seat booking is required per slot.{"\n\n"}
          6. Operator not liable for delays, traffic, or personal loss.{"\n\n"}
          7. By proceeding, you agree to follow rules and conduct policies.{"\n\n"}
        </Text>
      </ScrollView>
      <TouchableOpacity
        style={styles.modalBtn}
        onPress={() => setShowTerms(false)}
      >
        <Text style={styles.modalBtnText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

              {/* 🚦 Action Button */}
              {selectedPickupTrip && (
                <>
                  {finalPickupAvailable <= 0 || finalDropAvailable <= 0 ? (
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() =>
                        Alert.alert("Thanks!", "We’ve noted your interest.")
                      }
                    >
                      <Text style={styles.buttonText}>Show Interest</Text>
                    </TouchableOpacity>
                  ) : (
                    selectedDropTrip && (
                      <TouchableOpacity
                        style={styles.button}
                        onPress={handleBookNow}
                      >
                        <Text style={styles.buttonText}>Book Now</Text>
                      </TouchableOpacity>
                    )
                  )}
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
    width: "100%",
    alignItems: "center",
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E3A8A",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 5,
  },
  pickupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  pickupCard: {
    width: "48%",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#06B6D4",
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#E0F7FA",
  },
  changeText: {
    color: "#DC2626",
    fontWeight: "600",
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  pickupText: {
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  dropdownBox: {
    marginBottom: 15,
  },
  tripButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
  },
  tripButtonActive: {
    backgroundColor: "#06B6D4",
    borderColor: "#06B6D4",
  },
  checkbox: {
  width: 20,
  height: 20,
  borderWidth: 2,
  borderColor: "#1E3A8A",
  borderRadius: 4,
},
checkboxChecked: {
  backgroundColor: "#06B6D4",
  borderColor: "#06B6D4",
},
modalOverlay: {
  position: "absolute",
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
},
modalContent: {
  width: "90%",
  maxHeight: "80%",
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 20,
},
modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
modalText: { fontSize: 14, lineHeight: 20, color: "#334155" },
modalBtn: {
  backgroundColor: "#06B6D4",
  padding: 12,
  borderRadius: 8,
  marginTop: 10,
  alignItems: "center",
},
modalBtnText: { color: "white", fontWeight: "700" },

  button: {
    width: "100%",
    backgroundColor: "#06B6D4",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
