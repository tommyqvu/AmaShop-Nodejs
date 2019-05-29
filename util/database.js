const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete', 'root', 'l0v3u4ever', {
  dialect: 'mysql',
  host: 'localhost',
});

module.exports = sequelize
