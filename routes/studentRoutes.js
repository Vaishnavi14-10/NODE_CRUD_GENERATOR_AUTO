
  /**
   *@swagger
  *components:
  *  schemas:
  *    Student:
  *      type: object
  *      required:
                    - name
        - class
        - status
  *      properties:
                    name:
          type: "string"
        class:
          type: "integer"
        status:
          type: "string"
  */
  

  const express = require('express');
  const router = express.Router();
  const controller = require('../controllers/student');

  /**
   * @swagger
   * /student:
   *   post:
   *     tags: [Student]
   *     summary: Create a new student
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Student'
   *     responses:
   *       201:
   *         description: Created
   *       400:
   *         description: Validation error
   */
  router.post('/', controller.create);

  /**
   * @swagger
   * /student:
   *   get:
   *     tags: [Student]
   *     summary: Get all student
   *     responses:
   *       200:
   *         description: Success
   */
  router.get('/', controller.findAll);

  /**
   * @swagger
   * /student/{id}:
   *   get:
   *     tags: [Student]
   *     summary: Get student by ID
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Found
   *       404:
   *         description: Not found
   */
  router.get('/:id', controller.findOne);

  /**
   * @swagger
   * /student/{id}:
   *   put:
   *     tags: [Student]
   *     summary: Update student
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Student'
   *     responses:
   *       200:
   *         description: Updated
   *       400:
   *         description: Validation error
   */
  router.put('/:id', controller.update);

  /**
   * @swagger
   * /student/{id}:
   *   delete:
   *     tags: [Student]
   *     summary: Delete student
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Deleted
   */
  router.delete('/:id', controller.delete);

  module.exports = router;
  