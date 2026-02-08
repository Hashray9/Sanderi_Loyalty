import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import ScanScreen from '@/screens/ScanScreen';
import LookupScreen from '@/screens/LookupScreen';
import SettingsScreen from '@/screens/SettingsScreen';

export type AppTabsParamList = {
    Scan: undefined;
    Lookup: undefined;
    Settings: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export default function AppTabs() {
    const { colors } = useTheme();
    const { t } = useTranslation();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                },
            }}
        >
            <Tab.Screen
                name="Scan"
                component={ScanScreen}
                options={{
                    tabBarLabel: t('tabs.scan'),
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📱</Text>,
                }}
            />
            <Tab.Screen
                name="Lookup"
                component={LookupScreen}
                options={{
                    tabBarLabel: t('tabs.lookup'),
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔍</Text>,
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: t('tabs.settings'),
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
                }}
            />
        </Tab.Navigator>
    );
}
