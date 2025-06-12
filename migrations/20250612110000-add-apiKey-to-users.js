"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'apiKey', {
      type: Sequelize.UUID,
      allowNull: true,
      unique: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'apiKey');
  }
};
