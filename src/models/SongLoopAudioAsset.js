const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('SongLoopAudioAsset', {
    SongLoopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'SongLoops',
        key: 'SongLoopId'
      }
    },
    AudioAssetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'AudioAssets',
        key: 'AudioAssetId'
      }
    }
  }, {
    sequelize,
    tableName: 'SongLoopAudioAssets',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK_SongLoopAudioAssets",
        unique: true,
        fields: [
          { name: "SongLoopId" },
          { name: "AudioAssetId" },
        ]
      },
    ]
  });
};
