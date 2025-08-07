
  const db = require('../models');
  const schema = require('../validations/student');
  const Student = db['student'];

  module.exports = {
    async create(req, res) {
      try {
        await schema.validate(req.body);
        const item = await Student.create(req.body);
        res.status(201).json(item);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },

    async findAll(req, res) {
      const data = await Student.findAll();
      res.json(data);
    },

    async findOne(req, res) {
      const data = await Student.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: "Not found" });
      res.json(data);
    },

    async update(req, res) {
      try {
        await schema.validate(req.body);
        await Student.update(req.body, {
          where: { id: req.params.id }
        });
        res.json({ message: "Updated" });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },

    async delete(req, res) {
      await Student.destroy({ where: { id: req.params.id } });
      res.json({ message: "Deleted" });
    }
  };
  