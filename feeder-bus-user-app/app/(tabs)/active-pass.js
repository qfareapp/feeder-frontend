import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../api/api";

export default function ActivePass() {
  const router = useRouter();
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validTill, setValidTill] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadPass = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId"); // 👈 saved at login
        if (!userId) return;

        const res = await api.get(`/passes/user/${userId}`);
        if (res.data.success && res.data.pass) {
          const pass = res.data.pass;

          if (pass.validTill) {
  setValidTill(new Date(pass.validTill).toDateString());
}

          setPassData(pass);
        } else {
          setPassData(null);
        }
      } catch (err) {
        const status = err.response?.status;
        const serverMsg = err.response?.data?.error || err.message;
        if (status === 404 || serverMsg.toLowerCase().includes("no active pass")) {
          setPassData(null);
        } else {
          console.error("Error fetching pass:", err?.response?.data || err.message);
          setPassData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPass();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/skyline.png")}
      style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>My Active Pass</Text>

        {passData ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pass Details</Text>
            <View style={styles.row}>
  <Ionicons name="pricetag" size={20} color="#1E3A8A" />
  <Text style={styles.value}>Ticket ID: {passData.ticketId}</Text>
</View>

<View style={styles.row}>
  <Ionicons name="bus" size={20} color="#1E3A8A" />
  <Text style={styles.value}>Route: {passData.routeNo}</Text>
</View>
            <View style={styles.row}>
              <Ionicons name="person" size={20} color="#1E3A8A" />
              <Text style={styles.value}>{passData.name}</Text>
            </View>

            <View style={styles.row}>
  <Ionicons name="location" size={20} color="#1E3A8A" />
  <Text style={styles.value}>
    {passData.pickupLocation}{" "}
    <Ionicons name="swap-horizontal" size={18} color="#1E3A8A" />{" "}
    {passData.dropLocation}
  </Text>
</View>

            <View style={styles.row}>
  <Ionicons name="time" size={20} color="#1E3A8A" />
  <Text style={styles.value}>
    {passData.pickupSlot}{" "}
    <Ionicons name="swap-horizontal" size={18} color="#1E3A8A" />{" "}
    {passData.dropSlot}
  </Text>
</View>

            <View style={styles.row}>
              <Ionicons name="calendar" size={20} color="#1E3A8A" />
              <Text style={styles.value}>
                Valid Till: {validTill || "N/A"}
              </Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="card" size={20} color="#1E3A8A" />
              <Text style={styles.price}>₹{passData.price}</Text>
            </View>

 {/* ✅ Terms & Conditions with expand/collapse */}
            <View style={styles.termsBox}>
  <TouchableOpacity
    style={styles.termsHeader}
    onPress={() => setExpanded(!expanded)}
    activeOpacity={0.7}
  >
    <Text style={styles.termsTitle}>Terms & Conditions</Text>
    <Ionicons
      name={expanded ? "chevron-up" : "chevron-down"}
      size={20}
      color="#1E3A8A"
    />
  </TouchableOpacity>

  {expanded && (
    <View style={{ maxHeight: 200 }}>
      <ScrollView nestedScrollEnabled={true}>
        <Text style={styles.termsText}>
          1. A 30 Days Pass is valid for 30 consecutive days from activation.{"\n\n"}
          2. A 15 Days Pass is valid for 15 consecutive days.{"\n\n"}
          3. Passes are non-transferable and non-refundable.{"\n\n"}
          4. Schedule is subject to operational changes.{"\n\n"}
          5. Seat booking is required per slot.{"\n\n"}
          6. Operator not liable for delays, traffic, or personal loss.{"\n\n"}
          7. By proceeding, you agree to follow rules and conduct policies.{"\n\n"}
        </Text>
      </ScrollView>
    </View>
  )}
</View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/book-pass")}
            >
              <Text style={styles.buttonText}>Renew / Buy New Pass</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.noPass}>No active pass found.</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/book-pass")}
            >
              <Text style={styles.buttonText}>Book a Pass</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.85)", // ✅ overlay for readability
    borderRadius: 12,
    margin: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#1E3A8A",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  value: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  price: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E3A8A",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#1E3A8A",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  noPass: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  termsBox: {
  marginTop: 25,
  padding: 15,
  backgroundColor: "#F1F5F9",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#E2E8F0",
},
termsHeader: {
  flexDirection: "row",
  justifyContent: "space-between", // 👈 keeps arrow on right
  alignItems: "center",
},
termsTitle: {
  fontSize: 16,
  fontWeight: "700",
  color: "#1E3A8A",
},
termsText: {
  fontSize: 14,
  color: "#334155",
  lineHeight: 20,
  marginTop: 10,
},

});
