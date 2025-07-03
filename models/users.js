
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('users', {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    dob: DataTypes.STRING,
    status: DataTypes.STRING
  }, {});
  return Users;
};