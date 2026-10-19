const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('SongLoop', {
    SongLoopId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    Name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    CreatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'SongLoops',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK_SongLoops",
        unique: true,
        fields: [
          { name: "SongLoopId" },
        ]
      },
    ]
  });
};
