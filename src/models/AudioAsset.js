const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('AudioAsset', {
    AudioAssetId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    InstrumentType: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    RelativePath: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "UQ_AudioAssets_RelativePath"
    }
  }, {
    sequelize,
    tableName: 'AudioAssets',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK_AudioAssets",
        unique: true,
        fields: [
          { name: "AudioAssetId" },
        ]
      },
      {
        name: "UQ_AudioAssets_RelativePath",
        unique: true,
        fields: [
          { name: "RelativePath" },
        ]
      },
    ]
  });
};
