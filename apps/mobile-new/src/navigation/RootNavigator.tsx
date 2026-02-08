import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/contexts/AuthContext';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import CardStack from './CardStack';

export type RootStackParamList = {
    Auth: undefined;
    App: undefined;
    Card: { cardUid: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return null; // Or a loading screen

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                <>
                    <Stack.Screen name="App" component={AppTabs} />
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
