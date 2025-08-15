"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const saleswomen_routes_1 = require("./routes/saleswomen.routes");
const task_routes_1 = require("./routes/task.routes");
const config_routes_1 = require("./routes/config.routes");
const router = (0, express_1.Router)();
exports.router = router;
router.use('/saleswomen', saleswomen_routes_1.saleswomenRouter);
router.use('/tasks', task_routes_1.tasksRouter);
router.use('/config', config_routes_1.configRouter);
//# sourceMappingURL=index.js.map