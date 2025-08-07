
  'use strict';
  module.exports = (sequelize, DataTypes) => {
    const Student = sequelize.define('student', {
      name: DataTypes.STRING,
    class: DataTypes.INTEGER,
    status: DataTypes.STRING
    }, {});
    return Student;
  };