import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as Keychain from 'react-native-keychain';
import ReactNativeBiometrics from 'react-native-biometrics';
import { api, setAuthToken } from '@/lib/api';

interface Staff {
    id: string;
    name: string;
    mobileNumber: string;
    role: string;
}

interface Store {
    id: string;
    name: string;
    hardwareConversionRate: number;
    plywoodConversionRate: number;
}

interface Franchisee {
    id: string;
    name: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    staff: Staff | null;
    store: Store | null;
    franchisee: Franchisee | null;
    hasBiometrics: boolean;
    login: (mobileNumber: string, password: string) => Promise<void>;
    signup: (name: string, mobileNumber: string, password: string, inviteCode: string) => Promise<void>;
    loginWithBiometrics: () => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const CREDENTIALS_KEY = 'auth_credentials';
const USER_DATA_KEY = 'user_data';

const rnBiometrics = new ReactNativeBiometrics();

// Helper functions for Keychain storage
async function getKeychainItem(key: string): Promise<string | null> {
    try {
        const result = await Keychain.getGenericPassword({ service: key });
        if (result && result.password) {
            return result.password;
        }
        return null;
    } catch {
        return null;
    }
}

async function setKeychainItem(key: string, value: string): Promise<void> {
    await Keychain.setGenericPassword(key, value, { service: key });
}

async function deleteKeychainItem(key: string): Promise<void> {
    await Keychain.resetGenericPassword({ service: key });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [staff, setStaff] = useState<Staff | null>(null);
    const [store, setStore] = useState<Store | null>(null);
    const [franchisee, setFranchisee] = useState<Franchisee | null>(null);
    const [hasBiometrics, setHasBiometrics] = useState(false);

    const checkBiometrics = async () => {
        try {
            const { available } = await rnBiometrics.isSensorAvailable();
            const hasCredentials = await getKeychainItem(CREDENTIALS_KEY);
            setHasBiometrics(available && !!hasCredentials);
        } catch {
            setHasBiometrics(false);
        }
    };

    const checkAuth = useCallback(async () => {
        console.log('🔐 checkAuth: Starting');
        setIsLoading(true);
        try {
            console.log('🔐 checkAuth: Reading token from Keychain');
            const token = await getKeychainItem(TOKEN_KEY);
            console.log('🔐 checkAuth: Token exists?', !!token);

            if (token) {
                console.log('🔐 checkAuth: Setting auth token');
                setAuthToken(token);
                setIsAuthenticated(true);
                console.log('🔐 checkAuth: Set isAuthenticated = true');

                // Load cached user data
                console.log('🔐 checkAuth: Reading cached user data');
                const cachedData = await getKeychainItem(USER_DATA_KEY);
                if (cachedData) {
                    console.log('🔐 checkAuth: Parsing cached user data');
                    const { staff: s, store: st, franchisee: f } = JSON.parse(cachedData);
                    setStaff(s);
                    setStore(st);
                    setFranchisee(f);
                    console.log('🔐 checkAuth: User data loaded');
                } else {
                    console.log('🔐 checkAuth: No cached user data');
                }
            } else {
                console.log('🔐 checkAuth: No token found, user not authenticated');
            }
        } catch (error) {
            console.error('🔐 checkAuth: Failed:', error);
        } finally {
            console.log('🔐 checkAuth: Setting isLoading = false');
            setIsLoading(false);
            console.log('🔐 checkAuth: Done');
        }
    }, []);

    const login = useCallback(async (mobileNumber: string, password: string) => {
        const response = await api.post('/auth/login', { mobileNumber, password });
        const { token, staff: s, store: st, franchisee: f } = response.data;

        await setKeychainItem(TOKEN_KEY, token);
        await setKeychainItem(
            USER_DATA_KEY,
            JSON.stringify({ staff: s, store: st, franchisee: f })
        );
        await setKeychainItem(
            CREDENTIALS_KEY,
            JSON.stringify({ mobileNumber, password })
        );

        setAuthToken(token);
        setStaff(s);
        setStore(st);
        setFranchisee(f);
        setIsAuthenticated(true);
        setHasBiometrics(true);
    }, []);

    const signup = useCallback(async (name: string, mobileNumber: string, password: string, inviteCode: string) => {
        const response = await api.post('/auth/signup', { name, mobileNumber, password, inviteCode });
        const { token, staff: s, store: st, franchisee: f } = response.data;

        await setKeychainItem(TOKEN_KEY, token);
        await setKeychainItem(
            USER_DATA_KEY,
            JSON.stringify({ staff: s, store: st, franchisee: f })
        );
        await setKeychainItem(
            CREDENTIALS_KEY,
            JSON.stringify({ mobileNumber, password })
        );

        setAuthToken(token);
        setStaff(s);
        setStore(st);
        setFranchisee(f);
        setIsAuthenticated(true);
        setHasBiometrics(true);
    }, []);

    const loginWithBiometrics = useCallback(async () => {
        const credentialsStr = await getKeychainItem(CREDENTIALS_KEY);
        if (!credentialsStr) {
            throw new Error('No stored credentials');
        }

        // Authenticate with biometrics first
        const { success } = await rnBiometrics.simplePrompt({
            promptMessage: 'Authenticate to login',
        });

        if (!success) {
            throw new Error('Biometric authentication failed');
        }

        const { mobileNumber, password } = JSON.parse(credentialsStr);
        await login(mobileNumber, password);
    }, [login]);

    const logout = useCallback(async () => {
        await deleteKeychainItem(TOKEN_KEY);
        await deleteKeychainItem(USER_DATA_KEY);
        // Keep credentials for biometric login

        setAuthToken(null);
        setStaff(null);
        setStore(null);
        setFranchisee(null);
        setIsAuthenticated(false);
    }, []);

    // Initialize auth on mount
    useEffect(() => {
        const initialize = async () => {
            console.log('🔐 AuthProvider: Initializing...');
            try {
                console.log('🔐 AuthProvider: Checking biometrics');
                await checkBiometrics();
                console.log('🔐 AuthProvider: Checking auth');
                await checkAuth();
                console.log('🔐 AuthProvider: Initialized successfully');
            } catch (error) {
                console.error('🔐 AuthProvider: Initialization failed:', error);
                setIsLoading(false);
            }
        };
        initialize();
    }, [checkAuth]);

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                staff,
                store,
                franchisee,
                hasBiometrics,
                login,
                signup,
                loginWithBiometrics,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
