// app/index.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      const profileCompleted = await AsyncStorage.getItem("profileCompleted");

      if (!token) {
        router.replace("/login"); // not logged in
      } else if (!profileCompleted) {
        router.replace("/profile"); // logged in but no profile yet
      } else {
        router.replace("/home"); // everything set
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return null;
}
