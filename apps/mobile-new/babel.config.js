module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
          },
        },
      ],
      // '@babel/plugin-transform-export-namespace-from', // included in babel-preset-expo
      'react-native-reanimated/plugin', // MUST be last
    ],
  };
};
