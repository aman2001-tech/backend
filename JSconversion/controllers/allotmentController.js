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
exports.allotCourse = void 0;
const Course_1 = require("../models/Course");
const allotCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { course_id } = req.params;
    try {
        const course = yield Course_1.Course.findOne({ course_id }).populate('registered');
        if (!course) {
            return res.status(400).json({
                status: 400,
                message: 'COURSE_NOT_FOUND',
                data: { failure: { Message: 'Course not found' } },
            });
        }
        const day = parseInt(course.start_date.substring(0, 2));
        const month = parseInt(course.start_date.substring(2, 4));
        const year = 2000 + parseInt(course.start_date.substring(4, 6));
        const courseStartDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (courseStartDate < today) {
            return res.status(400).json({
                status: 400,
                message: 'COURSE_EXPIRED',
                data: {
                    failure: {
                        Message: 'Cannot allot a course that starts in the past.',
                    },
                },
            });
        }
        const isEnough = course.registered.length >= course.min_employees;
        const newStatus = isEnough ? 'ACCEPTED' : 'CANCELLED';
        yield Promise.all(course.registered.map((reg) => __awaiter(void 0, void 0, void 0, function* () {
            reg.status = newStatus;
            yield reg.save();
        })));
        course.status = isEnough ? 'ALLOTTED' : 'CANCELLED';
        yield course.save();
        const allotments = course.registered
            .map((emp) => ({
            registration_id: emp.registration_id,
            email: emp.email,
            course_name: course.course_name,
            course_id: course.course_id,
            status: emp.status,
        }))
            .sort((a, b) => a.registration_id.localeCompare(b.registration_id));
        return res.status(200).json({
            status: 200,
            message: 'Successfully allotted course to registered employees',
            data: { success: allotments },
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.allotCourse = allotCourse;
//# sourceMappingURL=allotmentController.js.map