import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import HeaderBrand from "@/components/HeaderBrand";

export default function RootLayout() {
  useEffect(() => {
    document.title = "RunMax";
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          title: "RunMax",
          headerTitle: () => <HeaderBrand />,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#FAFAF8" },
        }}
      />
    </>
  );
}
