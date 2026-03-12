const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];
config.resolver.blockList = [
  new RegExp(path.join(__dirname, 'backend').replace(/\\/g, '\\\\') + '.*'),
];

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver = {
  ...config.resolver,
  assetExts: [...config.resolver.assetExts.filter(ext => ext !== 'svg'), 'riv'],
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

module.exports = config;
