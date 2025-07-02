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
exports.registerToCourse = void 0;
const Course_1 = require("../models/Course");
const Registration_1 = require("../models/Registration");
const registerToCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, employee_name } = req.body;
    const course_id = req.params.course_id;
    if (!email || !employee_name || !course_id) {
        return res.status(400).json({
            status: 400,
            message: 'INPUT_DATA_ERROR',
            data: {
                failure: {
                    Message: 'email, employee_name and course_id are required',
                },
            },
        });
    }
    try {
        const course = yield Course_1.Course.findOne({ course_id }).populate('registered');
        if (!course) {
            return res.status(400).json({
                status: 400,
                message: 'COURSE_NOT_FOUND',
                data: { failure: { Message: 'Course not found' } },
            });
        }
        if (course.registered.length >= course.max_employees) {
            return res.status(400).json({
                status: 400,
                message: 'REGISTRATION_FULL',
                data: { failure: { Message: 'Registration is full' } },
            });
        }
        const alreadyRegistered = yield Registration_1.Registration.findOne({ course_id, email });
        if (alreadyRegistered) {
            return res.status(400).json({
                status: 400,
                message: 'ALREADY_REGISTERED',
                data: { failure: { Message: 'Already registered for this course' } },
            });
        }
        const registration_id = `${employee_name}-${course.course_id}`;
        const regDoc = new Registration_1.Registration({
            registration_id,
            email,
            employee_name,
            course_id,
            status: 'PENDING',
        });
        yield regDoc.save();
        course.registered.push(regDoc._id);
        yield course.save();
        return res.status(200).json({
            status: 200,
            message: `successfully registered for ${course_id}`,
            data: { success: { registration_id, status: 'PENDING' } },
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.registerToCourse = registerToCourse;
//# sourceMappingURL=registrationController.js.map