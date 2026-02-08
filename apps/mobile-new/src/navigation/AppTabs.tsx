import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Nfc, Search, Settings } from 'lucide-react-native';
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
    const { colors, colorScheme } = useTheme();
    const { t } = useTranslation();
    const isDark = colorScheme === 'dark';

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: isDark ? '#111111' : '#ffffff',
                    borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    borderTopWidth: 1,
                    paddingTop: 4,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
            }}
        >
            <Tab.Screen
                name="Scan"
                component={ScanScreen}
                options={{
                    tabBarLabel: t('tabs.scan'),
                    tabBarIcon: ({ color, size }) => (
                        <Nfc size={size} color={color} strokeWidth={1.8} />
                    ),
                }}
            />
            <Tab.Screen
                name="Lookup"
                component={LookupScreen}
                options={{
                    tabBarLabel: t('tabs.lookup'),
                    tabBarIcon: ({ color, size }) => (
                        <Search size={size} color={color} strokeWidth={1.8} />
                    ),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: t('tabs.settings'),
                    tabBarIcon: ({ color, size }) => (
                        <Settings size={size} color={color} strokeWidth={1.8} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
