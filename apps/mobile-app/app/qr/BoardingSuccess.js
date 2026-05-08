import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View
} from "react-native";
import api from "../../api/api";

export default function BoardingSuccess() {
  const { seat_no, bus_id, booking_id, trip_type } = useLocalSearchParams();
  const router = useRouter();

  const seatAnim = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(0)).current;

  const [confirmed, setConfirmed] = useState(false);

  const SLIDE_WIDTH = 260;
  const KNOB_SIZE = 48;

  /* -------------------------------
      SEAT REVEAL ANIMATION
  --------------------------------*/
  useEffect(() => {
    Animated.spring(seatAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  /* -------------------------------
      SLIDER HANDLER
  --------------------------------*/
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx >= 0 && gesture.dx <= SLIDE_WIDTH - KNOB_SIZE) {
          slideX.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SLIDE_WIDTH - KNOB_SIZE - 20) {
          confirmBoarding();
        } else {
          Animated.spring(slideX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  /* -------------------------------
      FINAL BOARDING CONFIRM
  --------------------------------*/
  const confirmBoarding = async () => {
    setConfirmed(true);

    try {
      const newSeat = seat_no;
      const trip = trip_type; // "pickup" or "drop"

      // Update local activeBooking (seat already assigned during /board)
      const stored = await AsyncStorage.getItem("activeBooking");

      if (stored) {
        const parsed = JSON.parse(stored);

        if (trip === "pickup") {
          parsed.pickupSeatNo = newSeat;
          parsed.pickupBoarded = true;
        } else {
          parsed.dropSeatNo = newSeat;
          parsed.dropBoarded = true;
        }

        await AsyncStorage.setItem("activeBooking", JSON.stringify(parsed));
      }

      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 800);
    } catch (err) {
      console.log("❌ Boarding confirm failed (local update):", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Scan Successful</Text>
      <Text style={styles.text}>Bus ID: {bus_id}</Text>

      {/* SEAT REVEAL */}
      <Animated.View
        style={{
          opacity: seatAnim,
          transform: [
            {
              scale: seatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
          ],
        }}
      >
        <Text style={styles.seat}>Seat No: {seat_no}</Text>
      </Animated.View>

      {/* SLIDER CONFIRM */}
      {!confirmed ? (
        <View style={styles.sliderWrapper}>
          <Text style={styles.slideText}>Slide to Confirm Boarding</Text>

          <View style={styles.sliderTrack}>
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.sliderKnob,
                { transform: [{ translateX: slideX }] },
              ]}
            >
              <Text style={styles.knobArrow}>➜</Text>
            </Animated.View>
          </View>
        </View>
      ) : (
        <Text style={styles.confirmedText}>✔ Boarding Confirmed</Text>
      )}
    </View>
  );
}

/* -------------------------------------
    STYLES (unchanged)
------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
    color: "#0f172a",
  },
  text: {
    fontSize: 16,
    marginBottom: 5,
    color: "#475569",
  },
  seat: {
    fontSize: 34,
    fontWeight: "900",
    marginVertical: 20,
    color: "#007AFF",
    letterSpacing: 1,
  },
  sliderWrapper: {
    marginTop: 35,
    alignItems: "center",
  },
  slideText: {
    fontSize: 15,
    color: "#334155",
    marginBottom: 12,
  },
  sliderTrack: {
    width: 260,
    height: 52,
    backgroundColor: "#e2e8f0",
    borderRadius: 30,
    justifyContent: "center",
    padding: 2,
  },
  sliderKnob: {
    width: 48,
    height: 48,
    backgroundColor: "#007AFF",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  knobArrow: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  confirmedText: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "700",
    color: "green",
  },
});
