"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCourseOffering = void 0;
const Course_1 = require("../models/Course");
const validators_1 = require("../utils/validators");
const addCourseOffering = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { course_name, instructor_name, start_date, min_employees, max_employees, } = req.body;
    if (!course_name ||
        !instructor_name ||
        !start_date ||
        typeof min_employees !== 'number' ||
        typeof max_employees !== 'number') {
        return res.status(400).json({
            status: 400,
            message: 'INPUT_VALIDATION_ERROR',
            data: {
                failure: {
                    Message: 'Missing required fields or invalid number format.',
                },
            },
        });
    }
    if (max_employees < min_employees) {
        return res.status(400).json({
            status: 400,
            message: 'INPUT_VALIDATION_ERROR',
            data: {
                failure: {
                    Message: 'max_employees must be >= min_employees.',
                },
            },
        });
    }
    if (!(0, validators_1.isValidDDMMYY)(start_date)) {
        return res.status(400).json({
            status: 400,
            message: 'INPUT_VALIDATION_ERROR',
            data: {
                failure: {
                    Message: 'start_date must be a valid date in ddmmyy format.',
                },
            },
        });
    }
    const day = parseInt(start_date.substring(0, 2));
    const month = parseInt(start_date.substring(2, 4));
    const year = 2000 + parseInt(start_date.substring(4, 6));
    const courseStartDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (courseStartDate < today) {
        return res.status(400).json({
            status: 400,
            message: 'INPUT_VALIDATION_ERROR',
            data: {
                failure: {
                    Message: 'start_date cannot be in the past.',
                },
            },
        });
    }
    const course_id = `OFFERING-${course_name}-${instructor_name}`;
    try {
        const exists = yield Course_1.Course.findOne({ course_id });
        if (exists) {
            return res.status(400).json({
                status: 400,
                message: 'INPUT_DATA_ERROR',
                data: { failure: { Message: 'Course already exists' } },
            });
        }
        const course = new Course_1.Course({
            course_id,
            course_name,
            instructor_name,
            start_date,
            min_employees,
            max_employees,
            registered: [],
            status: 'PENDING',
        });
        yield course.save();
        return res.status(200).json({
            status: 200,
            message: 'course added successfully',
            data: { success: { course_id } },
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.addCourseOffering = addCourseOffering;
//# sourceMappingURL=courseController.js.map