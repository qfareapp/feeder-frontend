import { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import api from "../api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ChangePassword() {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    if (!oldPwd || !newPwd || !confirm) {
      Alert.alert("Missing fields", "Please fill all fields");
      return;
    }
    if (newPwd !== confirm) {
      Alert.alert("Mismatch", "New password and confirm do not match");
      return;
    }
    setSaving(true);
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) throw new Error("User not found");
      await api.post("/user/change-password", { userId, oldPassword: oldPwd, newPassword: newPwd });
      Alert.alert("Success", "Password updated");
      setOldPwd("");
      setNewPwd("");
      setConfirm("");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || err.message || "Could not change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Password</Text>
      <TextInput
        placeholder="Current password"
        value={oldPwd}
        onChangeText={setOldPwd}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        placeholder="New password"
        value={newPwd}
        onChangeText={setNewPwd}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        placeholder="Confirm new password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        style={styles.input}
      />
      <TouchableOpacity style={[styles.button, saving && { opacity: 0.6 }]} onPress={handleChange} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Update Password"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
