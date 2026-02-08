import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CardDetailScreen from '@/screens/CardDetailScreen';
import EnrollScreen from '@/screens/EnrollScreen';
import BlockScreen from '@/screens/BlockScreen';
import HistoryScreen from '@/screens/HistoryScreen';

export type CardStackParamList = {
    CardDetail: { cardUid: string };
    Enroll: { cardUid: string };
    Block: { cardUid: string };
    History: { cardUid: string };
};

const Stack = createNativeStackNavigator<CardStackParamList>();

export default function CardStack({ route }: any) {
    const { cardUid } = route.params;

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="CardDetail"
                component={CardDetailScreen}
                initialParams={{ cardUid }}
            />
            <Stack.Screen name="Enroll" component={EnrollScreen} />
            <Stack.Screen name="Block" component={BlockScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
    );
}
