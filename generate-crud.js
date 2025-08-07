const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const promptColumns = async () => {
  const columns = {};
  let addMore = true;
  while (addMore) {
    const { name, type, more } = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Enter column name:",
      },
      {
        type: "list",
        name: "type",
        message: "Select Sequelize data type:",
        choices: ["STRING", "INTEGER", "BOOLEAN", "DATE", "TEXT", "FLOAT"],
      },
      {
        type: "confirm",
        name: "more",
        message: "Add more columns?",
        default: true,
      },
    ]);
    columns[name] = type;
    addMore = more;
  }
  return columns;
};

const swaggerTypeMap = {
  STRING: "string",
  INTEGER: "integer",
  BOOLEAN: "boolean",
  DATE: "string",
  TEXT: "string",
  FLOAT: "number",
};

const generateSwaggerSchema = (tableName, columns) => {
  const schemaName = capitalize(tableName);

  const requiredFields = Object.keys(columns)
    .map((key) => `        - ${key}`)
    .join("\n");

  const properties = Object.entries(columns)
    .map(
      ([key, type]) =>
        `        ${key}:\n          type: ${JSON.stringify(
          swaggerTypeMap[type] || "string"
        )}`
    )
    .join("\n");

  return `
  /**
   *@swagger
  *components:
  *  schemas:
  *    ${schemaName}:
  *      type: object
  *      required:
            ${requiredFields}
  *      properties:
            ${properties}
  */
  `;
};

const generateMigration = (tableName, columns) => {
  const fields = Object.entries(columns)
    .map(
      ([name, type]) => `      ${name}: {
          type: Sequelize.${type},
          allowNull: false
        }`
    )
    .join(",\n");

  return `
  'use strict';
  module.exports = {
    async up(queryInterface, Sequelize) {
      await queryInterface.createTable('${tableName}', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
  ${fields},
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      });
    },
    async down(queryInterface, Sequelize) {
      await queryInterface.dropTable('${tableName}');
    }
  };`;
};

const generateModel = (tableName, columns) => {
  const fields = Object.entries(columns)
    .map(([name, type]) => `${name}: DataTypes.${type}`)
    .join(",\n    ");

  return `
  'use strict';
  module.exports = (sequelize, DataTypes) => {
    const ${capitalize(tableName)} = sequelize.define('${tableName}', {
      ${fields}
    }, {});
    return ${capitalize(tableName)};
  };`;
};

const generateModelsIndex = () => {
  const content = `
  'use strict';

  const fs = require('fs');
  const path = require('path');
  const Sequelize = require('sequelize');
  const basename = path.basename(__filename);
  const env = process.env.NODE_ENV || 'development';
  const config = require(__dirname + '/../config/config.js')[env];
  const db = {};

  let sequelize;
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }

  fs
    .readdirSync(__dirname)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js'
      );
    })
    .forEach(file => {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  module.exports = db;
  `;

  const modelsDir = path.join(__dirname, "models");
  const indexFile = path.join(modelsDir, "index.js");

  if (!fs.existsSync(indexFile)) {
    fs.writeFileSync(indexFile, content);
    console.log("✅ Generated models/index.js");
  }
};

const generateValidation = (columns) => {
  const rules = Object.keys(columns)
    .map((key) => `  ${key}: yup.string().required()`)
    .join(",\n");

  return `
  const yup = require('yup');

  const schema = yup.object({
  ${rules}
  });

  module.exports = schema;
  `;
};

const generateController = (tableName) => {
  return `
  const db = require('../models');
  const schema = require('../validations/${tableName}');
  const ${capitalize(tableName)} = db['${tableName}'];

  module.exports = {
    async create(req, res) {
      try {
        await schema.validate(req.body);
        const item = await ${capitalize(tableName)}.create(req.body);
        res.status(201).json(item);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },

    async findAll(req, res) {
      const data = await ${capitalize(tableName)}.findAll();
      res.json(data);
    },

    async findOne(req, res) {
      const data = await ${capitalize(tableName)}.findByPk(req.params.id);
      if (!data) return res.status(404).json({ error: "Not found" });
      res.json(data);
    },

    async update(req, res) {
      try {
        await schema.validate(req.body);
        await ${capitalize(tableName)}.update(req.body, {
          where: { id: req.params.id }
        });
        res.json({ message: "Updated" });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },

    async delete(req, res) {
      await ${capitalize(tableName)}.destroy({ where: { id: req.params.id } });
      res.json({ message: "Deleted" });
    }
  };
  `;
};

const generateRoute = (tableName, columns) => {
  const schemaBlock = generateSwaggerSchema(tableName, columns);
  return `${schemaBlock}

  const express = require('express');
  const router = express.Router();
  const controller = require('../controllers/${tableName}');

  /**
   * @swagger
   * /${tableName}:
   *   post:
   *     tags: [${capitalize(tableName)}]
   *     summary: Create a new ${tableName}
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/${capitalize(tableName)}'
   *     responses:
   *       201:
   *         description: Created
   *       400:
   *         description: Validation error
   */
  router.post('/', controller.create);

  /**
   * @swagger
   * /${tableName}:
   *   get:
   *     tags: [${capitalize(tableName)}]
   *     summary: Get all ${tableName}
   *     responses:
   *       200:
   *         description: Success
   */
  router.get('/', controller.findAll);

  /**
   * @swagger
   * /${tableName}/{id}:
   *   get:
   *     tags: [${capitalize(tableName)}]
   *     summary: Get ${tableName} by ID
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
   * /${tableName}/{id}:
   *   put:
   *     tags: [${capitalize(tableName)}]
   *     summary: Update ${tableName}
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
   *             $ref: '#/components/schemas/${capitalize(tableName)}'
   *     responses:
   *       200:
   *         description: Updated
   *       400:
   *         description: Validation error
   */
  router.put('/:id', controller.update);

  /**
   * @swagger
   * /${tableName}/{id}:
   *   delete:
   *     tags: [${capitalize(tableName)}]
   *     summary: Delete ${tableName}
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
  `;
};

const updateRouteIndex = (tableName) => {
  const indexPath = path.join("routes", "index.js");
  const importLine = `const ${tableName}Routes = require('./${tableName}Routes');`;
  const useLine = `router.use('/${tableName}', ${tableName}Routes);`;

  let content = "";
  if (fs.existsSync(indexPath)) {
    content = fs.readFileSync(indexPath, "utf-8");

    if (!content.includes(importLine)) {
      content = content.replace(
        /(const express = require\('express'\);\s*const router = express\.Router\(\);)/,
        `$1\n${importLine}`
      );
    }

    if (!content.includes(useLine)) {
      content = content.replace(
        /(module\.exports = router;)/,
        `${useLine}\n$1`
      );
    }

    fs.writeFileSync(indexPath, content);
  } else {
    content = `
  const express = require('express');
  const router = express.Router();

  ${importLine}
  ${useLine}

  module.exports = router;
  `;
    fs.writeFileSync(indexPath, content);
  }
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const checkFileExists = (filePath) => {
  if (fs.existsSync(filePath)) {
    throw new Error(`❌ File already exists: ${filePath}`);
  }
};

const writeGlobalSwaggerSchema = (tableName, columns) => {
  const capitalizedName = capitalize(tableName);
  const props = Object.entries(columns)
    .map(([key, type]) => {
      const swaggerType = swaggerTypeMap[type] || "string";
      return `      ${key}: { type: '${swaggerType}' }`;
    })
    .join(",\n");

  const schema = `export const globalSchemas = {
  ${capitalizedName}: {
    type: 'object',
    required: [${Object.keys(columns)
      .map((key) => `'${key}'`)
      .join(", ")}],
    properties: {
${props}
    },
  },
};
`;

  const filePath = path.join("utils", "swaggerSchemas.js");
  ensureDir("utils");
  fs.writeFileSync(filePath, schema);
  console.log("✅ Swagger schema saved in utils/swaggerSchemas.js");
};


const run = async () => {
  const { tableName } = await inquirer.prompt([
    {
      type: "input",
      name: "tableName",
      message: "Enter the table/model name (e.g., users):",
    },
  ]);

  const timestamp = Date.now();

  const migrationFile = `migrations/${timestamp}-create-${tableName}.js`;
  const modelFile = `models/${tableName}.js`;
  const controllerFile = `controllers/${tableName}.js`;
  const validationFile = `validations/${tableName}.js`;
  const routeFile = `routes/${tableName}Routes.js`;

  try {
    checkFileExists(migrationFile);
    checkFileExists(modelFile);
    checkFileExists(controllerFile);
    checkFileExists(validationFile);
    checkFileExists(routeFile);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const columns = await promptColumns();

  ensureDir("migrations");
  ensureDir("models");
  ensureDir("controllers");
  ensureDir("validations");
  ensureDir("routes");

  fs.writeFileSync(migrationFile, generateMigration(tableName, columns));
  fs.writeFileSync(modelFile, generateModel(tableName, columns));
  fs.writeFileSync(controllerFile, generateController(tableName));
  fs.writeFileSync(validationFile, generateValidation(columns));
  fs.writeFileSync(routeFile, generateRoute(tableName, columns));
  updateRouteIndex(tableName);
  generateModelsIndex();
  writeGlobalSwaggerSchema(tableName, columns);

  console.log(
    `✅ CRUD with Swagger for '${tableName}' generated successfully.`
  );
};

run();
