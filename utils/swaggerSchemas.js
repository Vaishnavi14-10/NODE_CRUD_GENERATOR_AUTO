const globalSchemas = {
  Student: {
    type: 'object',
    required: ['firstName', 'lastName', 'status'],
    properties: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      status: { type: 'string' }
    },
  },
};

module.exports = { globalSchemas };