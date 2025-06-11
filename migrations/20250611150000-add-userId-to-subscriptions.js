'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('subscriptions', 'userId', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users', // Nom de la table des utilisateurs
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE', // Ou SET NULL si vous préférez conserver les abonnements anonymes
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('subscriptions', 'userId');
  }
};
