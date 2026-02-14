module.exports = {
  dependencies: {
    // Disable autolinking for packages replaced by Expo equivalents
    // These packages stay in package.json but their native code won't link
    'react-native-splash-screen': { platforms: { android: null, ios: null } },
    'react-native-config': { platforms: { android: null, ios: null } },
  },
};
