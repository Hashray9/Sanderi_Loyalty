import { Stack } from 'expo-router';

export default function CardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="[cardUid]/index" />
      <Stack.Screen name="[cardUid]/enroll" />
      <Stack.Screen name="[cardUid]/block" />
      <Stack.Screen name="[cardUid]/history" />
    </Stack>
  );
}
