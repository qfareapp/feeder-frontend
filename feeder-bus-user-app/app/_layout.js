import { Ionicons } from "@expo/vector-icons";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, TouchableOpacity } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#06B6D4" },
          headerTintColor: "#fff",
          headerTitleAlign: "center",
          headerLeft: () => (
            <Image
              source={require("../assets/logo.png")}
              style={{ width: 40, height: 40, marginLeft: 10 }}
              resizeMode="contain"
            />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => alert("Notifications clicked!")}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="notifications-outline" size={26} color="white" />
            </TouchableOpacity>
          ),
        }}
      >
        {/* Tabs (with bottom navigation) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: true, title: "" }} />

        {/* QR stack (scanner + success) */}
        <Stack.Screen
          name="qr"
          options={{
            headerShown: false,
            presentation: "modal", // slide-up modal
          }}
        />

        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
