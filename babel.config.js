module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Este plugin es OBLIGATORIO para que no se te congele la app
      'react-native-reanimated/plugin',
    ],
  };
};
