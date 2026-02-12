import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowLeft,
  Globe,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const { staff, logout } = useAuth();

  const isGujarati = i18n.language === 'gu';
  const isAdmin = staff?.role === 'ADMIN';

  const [inviteCode, setInviteCode] = useState('');
  const [editingInviteCode, setEditingInviteCode] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchInviteCode();
    }
  }, [isAdmin]);

  const fetchInviteCode = async () => {
    try {
      setInviteCodeLoading(true);
      const response = await api.get('/auth/invite-code');
      setInviteCode(response.data.inviteCode);
    } catch {
      Alert.alert(t('common.error'), t('settings.inviteCodeLoadFailed'));
    } finally {
      setInviteCodeLoading(false);
    }
  };

  const handleSaveInviteCode = async () => {
    if (!newInviteCode.trim()) return;
    try {
      setInviteCodeLoading(true);
      const response = await api.put('/auth/invite-code', {
        inviteCode: newInviteCode.trim(),
      });
      setInviteCode(response.data.inviteCode);
      setEditingInviteCode(false);
      setNewInviteCode('');
      Alert.alert(t('common.ok'), t('settings.inviteCodeUpdated'));
    } catch {
      Alert.alert(t('common.error'), t('settings.inviteCodeFailed'));
    } finally {
      setInviteCodeLoading(false);
    }
  };

  const handleLanguageToggle = () => {
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
          },
        },
      ],
    );
  };

  // Get staff initials for avatar
  const getInitials = (name: string) => {
    const parts = name?.split(' ') || [];
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name?.substring(0, 2).toUpperCase() || '??';
  };

  return (
    <View style={styles.container}>
      {/* Background gradients */}
      <View style={styles.bgGradientTop} />
      <View style={styles.bgGradientBottom} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#fff" strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>ACCOUNT</Text>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Staff profile card */}
          <View style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCardGradient}
            >
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['rgba(31,41,55,1)', 'rgba(17,24,39,1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {getInitials(staff?.name || '')}
                  </Text>
                </LinearGradient>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.staffName}>
                  {staff?.name || 'Staff Member'}
                </Text>
                <Text style={styles.staffRole}>{staff?.role || 'STAFF'}</Text>
                <Text style={styles.staffPhone}>
                  {staff?.mobileNumber || '+91 00000 00000'}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* General Preferences section */}
          <View style={styles.preferencesSection}>
            <Text style={styles.sectionTitle}>GENERAL PREFERENCES</Text>

            {/* Language toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Globe
                  size={20}
                  color="rgba(156,163,175,1)"
                  strokeWidth={1.5}
                />
                <Text style={styles.settingLabel}>App Language</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.languageIndicatorActive}>EN</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    isGujarati && styles.toggleSwitchActive,
                  ]}
                  onPress={handleLanguageToggle}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      isGujarati && styles.toggleThumbActive,
                    ]}
                  />
                </TouchableOpacity>
                <Text style={styles.languageIndicatorInactive}>GJ</Text>
              </View>
            </View>
          </View>

          {/* Invite Code section — Admin only */}
          {isAdmin && (
            <View style={styles.inviteCodeSection}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <KeyRound
                    size={20}
                    color="rgba(156,163,175,1)"
                    strokeWidth={1.5}
                  />
                  <View>
                    <Text style={styles.settingLabel}>
                      {t('settings.inviteCode')}
                    </Text>
                    <Text style={styles.inviteCodeHint}>
                      {t('settings.inviteCodeHint')}
                    </Text>
                  </View>
                </View>
              </View>

              {inviteCodeLoading && !inviteCode ? (
                <ActivityIndicator
                  color="rgba(255,255,255,0.5)"
                  style={{ paddingVertical: 16 }}
                />
              ) : editingInviteCode ? (
                <View style={styles.inviteCodeEditRow}>
                  <TextInput
                    style={styles.inviteCodeInput}
                    value={newInviteCode}
                    onChangeText={setNewInviteCode}
                    placeholder={t('settings.enterNewInviteCode')}
                    placeholderTextColor="rgba(255,255,255,0.15)"
                    autoCapitalize="none"
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.inviteCodeSaveButton}
                    onPress={handleSaveInviteCode}
                    disabled={inviteCodeLoading || !newInviteCode.trim()}
                    activeOpacity={0.8}
                  >
                    {inviteCodeLoading ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (
                      <Check size={18} color="#000" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.inviteCodeDisplayCol}>
                  <TouchableOpacity
                    style={styles.inviteCodeValueContainer}
                    onPress={() => setShowInviteCode(!showInviteCode)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.inviteCodeValue}>
                      {showInviteCode ? inviteCode : '••••••••'}
                    </Text>
                    {showInviteCode ? (
                      <EyeOff size={16} color="#6b7280" strokeWidth={1.5} />
                    ) : (
                      <Eye size={16} color="#6b7280" strokeWidth={1.5} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.inviteCodeChangeButton}
                    onPress={() => {
                      setNewInviteCode(inviteCode);
                      setEditingInviteCode(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.inviteCodeChangeText}>
                      {t('settings.changeInviteCode')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Logout button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.9}
          >
            <LogOut size={20} color="#ef4444" strokeWidth={2} />
            <Text style={styles.logoutButtonText}>LOGOUT</Text>
          </TouchableOpacity>

          {/* App version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>APP VERSION 2.0.0</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom gradient fade */}
      <View style={styles.bottomGradientFade} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  bgGradientTop: {
    position: 'absolute',
    top: '-5%',
    right: '-10%',
    width: '60%',
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 999,
    opacity: 0.3,
  },
  bgGradientBottom: {
    position: 'absolute',
    bottom: '20%',
    left: '-10%',
    width: '50%',
    height: '30%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 999,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 16,
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 6.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e5e5',
    fontFamily: 'serif',
  },
  headerSpacer: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 28,
  },
  profileCard: {
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 40,
  },
  profileCardGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 32,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d1d5db',
    fontFamily: 'serif',
    letterSpacing: -1,
  },
  profileInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
    fontFamily: 'serif',
    marginBottom: 2,
  },
  staffRole: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  staffPhone: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  preferencesSection: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 4.8,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e5e5e5',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageIndicatorActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  languageIndicatorInactive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4b5563',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  toggleSwitch: {
    width: 80,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    // No change to container
  },
  toggleThumb: {
    width: 38,
    height: 26,
    backgroundColor: '#fff',
    borderRadius: 18,
    position: 'absolute',
    left: 2,
  },
  toggleThumbActive: {
    left: 38,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    gap: 32,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
    letterSpacing: 4.8,
    textTransform: 'uppercase',
  },
  versionContainer: {
    alignItems: 'center',
    gap: 8,
  },
  versionText: {
    fontSize: 9,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 3.2,
    fontWeight: '500',
  },
  inviteCodeSection: {
    marginTop: 32,
    gap: 4,
  },
  inviteCodeHint: {
    fontSize: 10,
    color: '#6b7280',
    letterSpacing: 1,
    marginTop: 2,
  },
  inviteCodeDisplayCol: {
    gap: 16,
    paddingVertical: 12,
  },
  inviteCodeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteCodeValue: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#fff',
    letterSpacing: 3,
  },
  inviteCodeChangeButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  inviteCodeChangeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  inviteCodeEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  inviteCodeInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    fontSize: 16,
    fontFamily: 'monospace',
    letterSpacing: 2,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  inviteCodeSaveButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomGradientFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 128,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },
});
