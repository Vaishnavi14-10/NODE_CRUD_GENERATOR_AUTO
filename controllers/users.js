
const db = require('../models');
const schema = require('../validations/users');
const Users = db['users'];

module.exports = {
  async create(req, res) {
    try {
      await schema.validate(req.body);
      const item = await Users.create(req.body);
      res.status(201).json(item);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async findAll(req, res) {
    const data = await Users.findAll();
    res.json(data);
  },

  async findOne(req, res) {
    const data = await Users.findByPk(req.params.id);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  },

  async update(req, res) {
    try {
      await schema.validate(req.body);
      await Users.update(req.body, {
        where: { id: req.params.id }
      });
      res.json({ message: "Updated" });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async delete(req, res) {
    await Users.destroy({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  }
};
