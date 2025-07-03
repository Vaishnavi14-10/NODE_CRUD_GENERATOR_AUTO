
const yup = require('yup');

const schema = yup.object({
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  dob: yup.string().required(),
  status: yup.string().required()
});

module.exports = schema;
