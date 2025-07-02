"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const courseController_1 = require("../controllers/courseController");
const allotmentController_1 = require("../controllers/allotmentController");
const router = express_1.default.Router();
router.post('/add/courseOffering', courseController_1.addCourseOffering);
router.post('/allot/:course_id', allotmentController_1.allotCourse);
exports.default = router;
//# sourceMappingURL=courseRoutes.js.map