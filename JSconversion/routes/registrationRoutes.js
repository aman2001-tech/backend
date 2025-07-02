"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const registrationController_1 = require("../controllers/registrationController");
const cancelRegistration_1 = require("../controllers/cancelRegistration");
const router = express_1.default.Router();
router.post('/add/register/:course_id', registrationController_1.registerToCourse);
router.post('/cancel/:registration_id', cancelRegistration_1.cancelRegistration);
exports.default = router;
//# sourceMappingURL=registrationRoutes.js.map