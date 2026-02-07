import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  console.log('📍 Index: Rendering');
  const { isAuthenticated, isLoading } = useAuth();

  console.log('📍 Index: isLoading=', isLoading, 'isAuthenticated=', isAuthenticated);

  if (isLoading) {
    console.log('📍 Index: Showing loading spinner');
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (isAuthenticated) {
    console.log('📍 Index: Redirecting to /(app)/scan');
    return <Redirect href="/(app)/scan" />;
  }

  console.log('📍 Index: Redirecting to /(auth)/login');
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
