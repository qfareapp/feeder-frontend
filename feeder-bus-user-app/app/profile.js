import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [pickupCategory, setPickupCategory] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropCategory, setDropCategory] = useState("");
  const [dropLocation, setDropLocation] = useState("");

  const [pickupSlot, setPickupSlot] = useState("");
  const [dropSlot, setDropSlot] = useState("");

  // Sample registered locations (can fetch from API later)
  const registeredLocations = {
    techpark: ["DLF Tech Park", "EcoSpace", "ITC Infotech"],
    metro: ["Salt Lake Metro", "Sector V Metro", "Central Metro"],
    housing: ["Greenfield Society", "Silver Oaks", "Uttorayon Complex"],
  };

  // ✅ Updated handleSubmit
  const handleSubmit = async () => {
    if (!name || (!phone && !email) || !pickupLocation || !dropLocation) {
      Alert.alert("Missing fields", "Please fill all required details");
      return;
    }

    const profile = {
      name,
      phone,
      email,
      pickupCategory,
      pickupLocation,
      dropCategory,
      dropLocation,
      pickupSlot,
      dropSlot,
    };

    // Save profileCompleted flag + profileData
    await AsyncStorage.setItem("profileCompleted", "true");
    await AsyncStorage.setItem("profileData", JSON.stringify(profile));

    Alert.alert("Profile Saved", "Your preferences have been updated.", [
      { text: "OK", onPress: () => router.replace("/home") },
    ]);
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Your Profile</Text>

          {/* Name */}
          <TextInput
            placeholder="Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          {/* Phone */}
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
          />

          {/* Email */}
          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />

          {/* Pickup Category */}
          <Text style={styles.label}>Pickup Category</Text>
          <Picker
            selectedValue={pickupCategory}
            onValueChange={(val) => {
              setPickupCategory(val);
              setPickupLocation(""); // reset location
            }}
            style={styles.picker}
          >
            <Picker.Item label="Select Pickup Category" value="" />
            <Picker.Item label="Techpark" value="techpark" />
            <Picker.Item label="Metro Station" value="metro" />
            <Picker.Item label="Housing Society" value="housing" />
          </Picker>

          {/* Pickup Location */}
          {pickupCategory ? (
            <>
              <Text style={styles.label}>Pickup Location</Text>
              <Picker
                selectedValue={pickupLocation}
                onValueChange={(val) => setPickupLocation(val)}
                style={styles.picker}
              >
                <Picker.Item label="Select Pickup Location" value="" />
                {registeredLocations[pickupCategory].map((loc, i) => (
                  <Picker.Item key={i} label={loc} value={loc} />
                ))}
              </Picker>
            </>
          ) : null}

          {/* Drop Category */}
          <Text style={styles.label}>Drop Category</Text>
          <Picker
            selectedValue={dropCategory}
            onValueChange={(val) => {
              setDropCategory(val);
              setDropLocation(""); // reset location
            }}
            style={styles.picker}
          >
            <Picker.Item label="Select Drop Category" value="" />
            <Picker.Item label="Techpark" value="techpark" />
            <Picker.Item label="Metro Station" value="metro" />
            <Picker.Item label="Housing Society" value="housing" />
          </Picker>

          {/* Drop Location */}
          {dropCategory ? (
            <>
              <Text style={styles.label}>Drop Location</Text>
              <Picker
                selectedValue={dropLocation}
                onValueChange={(val) => setDropLocation(val)}
                style={styles.picker}
              >
                <Picker.Item label="Select Drop Location" value="" />
                {registeredLocations[dropCategory].map((loc, i) => (
                  <Picker.Item key={i} label={loc} value={loc} />
                ))}
              </Picker>
            </>
          ) : null}

          {/* Time Slots */}
          <Text style={styles.label}>Preferred Pickup Time</Text>
          <Picker
            selectedValue={pickupSlot}
            onValueChange={(val) => setPickupSlot(val)}
            style={styles.picker}
          >
            <Picker.Item label="Select Pickup Slot" value="" />
            <Picker.Item label="7:00 AM" value="7am" />
            <Picker.Item label="8:00 AM" value="8am" />
            <Picker.Item label="9:00 AM" value="9am" />
          </Picker>

          <Text style={styles.label}>Preferred Drop Time</Text>
          <Picker
            selectedValue={dropSlot}
            onValueChange={(val) => setDropSlot(val)}
            style={styles.picker}
          >
            <Picker.Item label="Select Drop Slot" value="" />
            <Picker.Item label="5:00 PM" value="5pm" />
            <Picker.Item label="6:00 PM" value="6pm" />
            <Picker.Item label="7:00 PM" value="7pm" />
          </Picker>

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
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
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E3A8A",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "#ffffff", // solid opaque white
    padding: 15,
    borderRadius: 25,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    color: "#1E3A8A", // dark text
  },
  label: {
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 5,
  },
  picker: {
    backgroundColor: "#ffffff", // solid opaque white
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    marginBottom: 15,
    color: "#1E3A8A", // dark text
  },
  button: {
    width: "100%",
    backgroundColor: "#1E3A8A",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});



