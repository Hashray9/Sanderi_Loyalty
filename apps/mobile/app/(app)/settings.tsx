import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors, colorScheme, toggleTheme } = useTheme();
  const { staff, store, logout } = useAuth();

  const handleLanguageChange = () => {
    const newLang = i18n.language === 'en' ? 'gu' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logoutConfirmTitle'),
      t('settings.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* User Info */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.card,
            shadowColor: '#000',
          },
        ]}
      >
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {staff?.name?.charAt(0) || '?'}
            </Text>
          </View>
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>
              {staff?.name || t('common.unknown')}
            </Text>
            <Text style={[styles.userRole, { color: colors.textSecondary }]}>
              {staff?.role} - {store?.name}
            </Text>
          </View>
        </View>
      </View>

      {/* Appearance */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.card,
            shadowColor: '#000',
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.appearance')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {t('settings.darkMode')}
          </Text>
          <Switch
            value={colorScheme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <TouchableOpacity style={styles.settingRow} onPress={handleLanguageChange}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {t('settings.language')}
          </Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            {i18n.language === 'en' ? 'English' : 'ગુજરાતી'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.card,
            shadowColor: '#000',
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.about')}
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {t('settings.version')}
          </Text>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            1.0.0
          </Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.error }]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>{t('settings.logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  userRole: {
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
  },
  logoutButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
