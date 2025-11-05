import { Stack } from "expo-router";
import React from "react";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
export default function stackprofile() {
    const navigation = useNavigation();

    const openDrawer = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.dispatch(DrawerActions.openDrawer());
    };

  return (
    <Stack>
       <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />
        <Stack.Screen name="cubicleChat" options={{headerShown: false }} />
    </Stack>
  );
}