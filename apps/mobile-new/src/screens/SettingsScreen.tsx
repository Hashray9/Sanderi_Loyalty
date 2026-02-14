import { useState, useEffect, useMemo } from 'react';
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
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';

// ─── Themed Styles ──────────────────────────────────────────────────────────

type Theme = ReturnType<typeof useTheme>;

const createStyles = (
  colors: Theme['colors'],
  typo: Theme['typography'],
  sp: Theme['spacing'],
  radius: Theme['borderRadius'],
  btn: Theme['buttons'],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      backgroundColor: colors.surface2,
      borderRadius: radius.full,
      opacity: 0.3,
    },
    bgGradientBottom: {
      position: 'absolute',
      bottom: '20%',
      left: '-10%',
      width: '50%',
      height: '30%',
      backgroundColor: colors.surface1,
      borderRadius: radius.full,
      opacity: 0.3,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sp['3xl'],
      paddingTop: sp.lg,
      marginBottom: sp['5xl'],
    },
    backButton: {
      width: sp['5xl'],
      height: sp['5xl'],
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -sp.sm,
    },
    headerTitleContainer: {
      alignItems: 'center',
    },
    headerSubtitle: {
      fontSize: typo.fontSize.xs,
      fontWeight: typo.fontWeight.bold,
      color: colors.textSecondary,
      letterSpacing: typo.letterSpacing.subtitle,
      textTransform: 'uppercase',
      marginBottom: sp.xs,
    },
    headerTitle: {
      fontSize: typo.fontSize['2xl'],
      fontWeight: typo.fontWeight.semibold,
      color: colors.textLight,
      fontFamily: typo.fontFamily.serif,
    },
    headerSpacer: {
      width: sp['5xl'],
    },
    mainContent: {
      flex: 1,
      paddingHorizontal: sp['3xl'],
    },
    profileCard: {
      borderRadius: radius['4xl'],
      overflow: 'hidden',
      marginBottom: sp['5xl'],
    },
    profileCardGradient: {
      borderWidth: btn.ghostBorderWidth,
      borderColor: colors.border,
      borderRadius: radius['4xl'],
      padding: sp['2xl'],
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.xl,
    },
    avatarContainer: {
      width: 64,
      height: 64,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
      borderWidth: btn.ghostBorderWidth,
      borderColor: colors.borderMedium,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: typo.fontSize['3xl'],
      fontWeight: typo.fontWeight.semibold,
      color: colors.textWarm,
      fontFamily: typo.fontFamily.serif,
      letterSpacing: -1,
    },
    profileInfo: {
      flex: 1,
    },
    staffName: {
      fontSize: typo.fontSize['3xl'],
      fontWeight: typo.fontWeight.medium,
      color: colors.text,
      fontFamily: typo.fontFamily.serif,
      marginBottom: 2,
    },
    staffRole: {
      fontSize: typo.fontSize.label,
      fontWeight: typo.fontWeight.medium,
      color: colors.textSubtle,
      letterSpacing: typo.letterSpacing.button,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    staffPhone: {
      fontSize: typo.fontSize.body,
      fontWeight: typo.fontWeight.medium,
      color: colors.textSecondary,
    },
    preferencesSection: {
      gap: sp.xs,
    },
    sectionTitle: {
      fontSize: typo.fontSize.sm,
      fontWeight: typo.fontWeight.bold,
      color: colors.textSecondary,
      letterSpacing: typo.letterSpacing.heading,
      textTransform: 'uppercase',
      paddingHorizontal: sp.xs,
      marginBottom: sp.lg,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: sp['2xl'],
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.lg,
    },
    settingLabel: {
      fontSize: typo.fontSize.lg,
      fontWeight: typo.fontWeight.medium,
      color: colors.textLight,
    },
    settingRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.md,
    },
    languageIndicatorActive: {
      fontSize: typo.fontSize.sm,
      fontWeight: typo.fontWeight.bold,
      color: colors.text,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    languageIndicatorInactive: {
      fontSize: typo.fontSize.sm,
      fontWeight: typo.fontWeight.bold,
      color: colors.textTertiary,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    toggleSwitch: {
      width: 80,
      height: sp['4xl'],
      backgroundColor: colors.inputBackground,
      borderWidth: btn.ghostBorderWidth,
      borderColor: colors.borderMedium,
      borderRadius: radius.xl,
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
      backgroundColor: colors.text,
      borderRadius: 18,
      position: 'absolute',
      left: 2,
    },
    toggleThumbActive: {
      left: 38,
    },
    footer: {
      paddingHorizontal: sp['3xl'],
      paddingBottom: sp['5xl'],
      gap: sp['4xl'],
    },
    logoutButton: {
      backgroundColor: 'transparent',
      borderWidth: btn.ghostBorderWidth,
      borderColor: 'rgba(239,68,68,0.2)',
      height: 60,
      borderRadius: radius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sp.md,
    },
    logoutButtonText: {
      fontSize: typo.fontSize.body,
      fontWeight: typo.fontWeight.bold,
      color: colors.error,
      letterSpacing: typo.letterSpacing.heading,
      textTransform: 'uppercase',
    },
    versionContainer: {
      alignItems: 'center',
      gap: sp.sm,
    },
    versionText: {
      fontSize: typo.fontSize.xs,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: typo.letterSpacing.button,
      fontWeight: typo.fontWeight.medium,
    },
    inviteCodeSection: {
      marginTop: sp['4xl'],
      gap: sp.xs,
    },
    inviteCodeHint: {
      fontSize: typo.fontSize.sm,
      color: colors.textSecondary,
      letterSpacing: 1,
      marginTop: 2,
    },
    inviteCodeDisplayCol: {
      gap: sp.lg,
      paddingVertical: sp.md,
    },
    inviteCodeValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.md,
    },
    inviteCodeValue: {
      fontSize: typo.fontSize.xl,
      fontFamily: typo.fontFamily.mono,
      color: colors.text,
      letterSpacing: 3,
    },
    inviteCodeChangeButton: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface4,
      borderWidth: btn.ghostBorderWidth,
      borderColor: colors.borderMedium,
      paddingVertical: sp.sm,
      paddingHorizontal: sp.lg,
      borderRadius: radius.sm,
    },
    inviteCodeChangeText: {
      fontSize: typo.fontSize.sm,
      fontWeight: typo.fontWeight.bold,
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    inviteCodeEditRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.md,
      paddingVertical: sp.md,
    },
    inviteCodeInput: {
      flex: 1,
      borderBottomWidth: btn.ghostBorderWidth,
      borderBottomColor: colors.borderProminent,
      color: colors.text,
      fontSize: typo.fontSize.xl,
      fontFamily: typo.fontFamily.mono,
      letterSpacing: 2,
      paddingVertical: sp.sm,
      paddingHorizontal: 0,
    },
    inviteCodeSaveButton: {
      width: sp['5xl'],
      height: sp['5xl'],
      backgroundColor: colors.buttonPrimary,
      borderRadius: radius.xl,
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

function useStyles() {
  const { colors, typography, spacing, borderRadius, buttons } = useTheme();
  return useMemo(
    () => createStyles(colors, typography, spacing, borderRadius, buttons),
    [colors, typography, spacing, borderRadius, buttons],
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const { staff, logout } = useAuth();
  const { colors, spacing: sp } = useTheme();
  const styles = useStyles();

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
            <ArrowLeft size={24} color={colors.text} strokeWidth={1.5} />
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
              colors={[colors.surface4, 'rgba(255,255,255,0.01)']}
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
                  color={colors.textSubtle}
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
                    color={colors.textSubtle}
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
                  color={colors.borderActive}
                  style={{ paddingVertical: sp.lg }}
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
                      <ActivityIndicator color={colors.buttonPrimaryText} size="small" />
                    ) : (
                      <Check size={18} color={colors.buttonPrimaryText} strokeWidth={2.5} />
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
                      <EyeOff size={16} color={colors.textSecondary} strokeWidth={1.5} />
                    ) : (
                      <Eye size={16} color={colors.textSecondary} strokeWidth={1.5} />
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
            <LogOut size={20} color={colors.error} strokeWidth={2} />
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
