import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import AuthStack from './AuthStack';
import CardStack from './CardStack';
import ScanScreen from '@/screens/ScanScreen';
import LookupScreen from '@/screens/LookupScreen';
import SettingsScreen from '@/screens/SettingsScreen';

export type RootStackParamList = {
    Auth: undefined;
    Scan: undefined;
    Lookup: undefined;
    Settings: undefined;
    Card: { cardUid: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return null;

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                <>
                    <Stack.Screen name="Scan" component={ScanScreen} />
                    <Stack.Screen
                        name="Lookup"
                        component={LookupScreen}
                        options={{ animation: 'slide_from_right' }}
                    />
                    <Stack.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{ animation: 'slide_from_right' }}
                    />
                    <Stack.Screen
                        name="Card"
                        component={CardStack}
                        options={{ presentation: 'fullScreenModal' }}
                    />
                </>
            ) : (
                <Stack.Screen name="Auth" component={AuthStack} />
            )}
        </Stack.Navigator>
    );
}
