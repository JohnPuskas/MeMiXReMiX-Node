var DataTypes = require("sequelize").DataTypes;
var _AudioAsset = require("./AudioAsset");
var _SongLoopAudioAsset = require("./SongLoopAudioAsset");
var _SongLoop = require("./SongLoop");

function initModels(sequelize) {
  var AudioAsset = _AudioAsset(sequelize, DataTypes);
  var SongLoopAudioAsset = _SongLoopAudioAsset(sequelize, DataTypes);
  var SongLoop = _SongLoop(sequelize, DataTypes);

  AudioAsset.belongsToMany(SongLoop, { as: 'SongLoopId_SongLoops', through: SongLoopAudioAsset, foreignKey: "AudioAssetId", otherKey: "SongLoopId" });
  SongLoop.belongsToMany(AudioAsset, { as: 'AudioAssetId_AudioAssets', through: SongLoopAudioAsset, foreignKey: "SongLoopId", otherKey: "AudioAssetId" });
  SongLoopAudioAsset.belongsTo(AudioAsset, { as: "AudioAsset", foreignKey: "AudioAssetId" });
  AudioAsset.hasMany(SongLoopAudioAsset, { as: "SongLoopAudioAssets", foreignKey: "AudioAssetId" });
  SongLoopAudioAsset.belongsTo(SongLoop, { as: "SongLoop", foreignKey: "SongLoopId" });
  SongLoop.hasMany(SongLoopAudioAsset, { as: "SongLoopAudioAssets", foreignKey: "SongLoopId" });

  return {
    AudioAsset,
    SongLoopAudioAsset,
    SongLoop,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
