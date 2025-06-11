module.exports = (sequelize, DataTypes) => {
  const RiskZone = sequelize.define('RiskZone', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    riskLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'risk_zones'
  });

  RiskZone.associate = (models) => {
    RiskZone.hasMany(models.WeatherData, { foreignKey: 'zoneId' });
  };

  return RiskZone;
};
