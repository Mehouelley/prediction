module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true, // Peut être null si phoneNumber est fourni
      validate: { isEmail: true }
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true // Peut être null si email est fourni
    },
    zoneId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false // Doit être associé à une zone
    },
    userId: { // Nouveau champ pour lier à l'utilisateur
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users', // Nom de la table des utilisateurs
        key: 'id'
      }
    }
  }, {
    tableName: 'subscriptions'
  });

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.RiskZone, { foreignKey: 'zoneId', as: 'zone' });
    Subscription.belongsTo(models.User, { foreignKey: 'userId', as: 'user' }); // Association avec User
  };

  return Subscription;
};
