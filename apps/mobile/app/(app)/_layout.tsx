import { Tabs } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={styles.tabIcon}>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? colors.primary : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="scan"
        options={{
          title: t('tabs.scan'),
          headerShown: false,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="lookup"
        options={{
          title: t('tabs.lookup'),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t('tabs.lookup')} focused={focused} />
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t('tabs.settings')} focused={focused} />
          ),
          tabBarLabel: () => null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
