
  const yup = require('yup');

  const schema = yup.object({
    name: yup.string().required(),
  class: yup.string().required(),
  status: yup.string().required()
  });

  module.exports = schema;
  