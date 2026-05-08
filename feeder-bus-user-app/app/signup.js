import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { signup as signupApi } from "../api/userApi";

export default function Signup() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "+91", // prefilled with Indian code
    society: "",
    timing: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.society ||
      !formData.timing ||
      !formData.password
    ) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      await signupApi(formData); 
      await AsyncStorage.setItem("onboarded", "true");

      Alert.alert("Success", "Signup complete!", [
        { text: "OK", onPress: () => router.replace("/(tabs)/home") },
      ]);
    } catch (err) {
      console.log("Signup error:", err.response?.data || err.message);
      Alert.alert("Error", "Could not complete signup");
    }
  };

  return (
    <LinearGradient colors={["#4facfe", "#00f2fe"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>📝 Sign Up</Text>

        {/* Name */}
        <TextInput
          placeholder="Full Name"
          value={formData.name}
          onChangeText={(v) => setFormData({ ...formData, name: v })}
          style={styles.input}
          placeholderTextColor="#666"
        />

        {/* Email */}
        <TextInput
          placeholder="Email Address"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(v) => setFormData({ ...formData, email: v })}
          style={styles.input}
          placeholderTextColor="#666"
        />

        {/* Phone */}
        <TextInput
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(v) => setFormData({ ...formData, phone: v })}
          style={styles.input}
          placeholderTextColor="#666"
        />

        {/* Society */}
        <TextInput
          placeholder="Housing Society"
          value={formData.society}
          onChangeText={(v) => setFormData({ ...formData, society: v })}
          style={styles.input}
          placeholderTextColor="#666"
        />

        {/* Timing */}
        <TextInput
          placeholder="Preferred Timing (Morning/Evening/Both)"
          value={formData.timing}
          onChangeText={(v) => setFormData({ ...formData, timing: v })}
          style={styles.input}
          placeholderTextColor="#666"
        />

        {/* Password */}
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={formData.password}
          onChangeText={(v) => setFormData({ ...formData, password: v })}
          style={styles.input}
          placeholderTextColor="#666"
        />

        {/* Confirm Password */}
        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          value={formData.confirmPassword}
          onChangeText={(v) =>
            setFormData({ ...formData, confirmPassword: v })
          }
          style={styles.input}
          placeholderTextColor="#666"
        />

        {/* Signup Button */}
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Back to Login */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={styles.loginLink}> Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, justifyContent: "center", flexGrow: 1 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 25,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#1E3A8A",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: { color: "#fff" },
  loginLink: { color: "#FFD700", fontWeight: "600" },
});
