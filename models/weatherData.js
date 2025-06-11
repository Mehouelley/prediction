module.exports = (sequelize, DataTypes) => {
  const WeatherData = sequelize.define('WeatherData', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    zoneId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    humidity: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    windSpeed: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    tableName: 'weather_data'
  });

  WeatherData.associate = (models) => {
    WeatherData.belongsTo(models.RiskZone, { foreignKey: 'zoneId' });
  };

  return WeatherData;
};
