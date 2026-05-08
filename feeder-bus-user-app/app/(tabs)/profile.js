import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../api/api";

export default function ProfileTab() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [passInfo, setPassInfo] = useState(null);

  useFocusEffect(
  useCallback(() => {
    const loadProfile = async () => {
      setLoading(true); // 👈 reset loading on focus
      try {
        const stored = await AsyncStorage.getItem("profileData");
        const storedImage = await AsyncStorage.getItem("profileImage");
        if (stored) setProfile(JSON.parse(stored));
        if (storedImage) setImageUri(storedImage);

        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          try {
            const res = await api.get(`/passes/user/${userId}`);
            if (res.data.success && res.data.pass) {
              setPassInfo(res.data.pass);
            } else {
              setPassInfo(null);
            }
          } catch (err) {
            setPassInfo(null);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [])
);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await AsyncStorage.setItem("profileImage", uri);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/login"); // 👈 update if your login route differs
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/skyline.png")} // ✅ same skyline background
      style={styles.background}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} style={{ alignItems: "center" }}>
            <Image
              source={
                imageUri
                  ? { uri: imageUri }
                  : { uri: "https://i.ibb.co/2kR7YdD/default-avatar.png" }
              }
              style={styles.avatar}
            />
            <Text style={styles.editPhoto}>Edit photo</Text>
          </TouchableOpacity>
          <Text style={styles.name}>{profile?.name || "Your Name"}</Text>
          <Text style={styles.email}>{profile?.email || "email@example.com"}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Pickup</Text>
            <Text style={styles.statValue}>{passInfo?.pickupLocation || "--"}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Drop</Text>
            <Text style={styles.statValue}>{passInfo?.dropLocation || "--"}</Text>
          </View>
        </View>

        

        {/* Quick Actions */}
        <View style={styles.quickActions}>
  <TouchableOpacity style={styles.actionButton}>
    <Ionicons name="help-circle" size={22} color="#1E3A8A" />
    <Text style={styles.actionText}>Help</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/active-pass")}>
    <Ionicons name="card" size={22} color="#1E3A8A" />
    <Text style={styles.actionText}>Pass</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/(tabs)/rides")}>
    <Ionicons name="time" size={22} color="#1E3A8A" />
    <Text style={styles.actionText}>History</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/settings")}>
    <Ionicons name="settings" size={22} color="#1E3A8A" />
    <Text style={styles.actionText}>Settings</Text>
  </TouchableOpacity>
</View>


        {/* General Settings */}
        <View style={styles.generalSection}>
  <TouchableOpacity
    style={styles.generalRow}
    onPress={() => router.push("/edit-profile")} // ✅ link to edit-profile.js
  >
    <Text style={styles.generalText}>Profile Settings</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>

  <TouchableOpacity style={styles.generalRow} onPress={() => router.push("/change-password")}>
    <Text style={styles.generalText}>Change Password</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>

  <TouchableOpacity style={styles.generalRow} onPress={() => router.push("/settings")}>
    <Text style={styles.generalText}>App Settings</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>

  <TouchableOpacity style={styles.generalRow} onPress={() => router.push("/active-pass")}>
    <Text style={styles.generalText}>Transaction History</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>

  {/* Logout Option */}
  <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
    <Text style={styles.logoutText}>Logout</Text>
    <Ionicons name="log-out-outline" size={20} color="#E53935" />
  </TouchableOpacity>
</View>
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
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "rgba(255,255,255,0.85)", // ✅ overlay for readability
    borderRadius: 12,
    margin: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#1E3A8A",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    color: "#1E3A8A",
  },
  email: {
    fontSize: 14,
    color: "#555",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  statBox: {
    flex: 1,
    marginHorizontal: 10,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E3A8A",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    alignItems: "center",
  },
  actionText: {
    marginTop: 5,
    fontSize: 12,
    color: "#1E3A8A",
    fontWeight: "600",
  },
  generalSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  generalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  generalText: {
    fontSize: 15,
    color: "#333",
  },
  logoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 15,
    color: "#E53935",
    fontWeight: "600",
  },
});
