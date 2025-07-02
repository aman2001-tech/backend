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
exports.cancelRegistration = void 0;
const Course_1 = require("../models/Course");
const Registration_1 = require("../models/Registration");
const cancelRegistration = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { registration_id } = req.params;
    try {
        const registration = yield Registration_1.Registration.findOne({ registration_id });
        if (!registration) {
            return res.status(400).json({
                status: 400,
                message: 'REGISTRATION_NOT_FOUND',
                data: { failure: { Message: 'Registration ID not found' } },
            });
        }
        if (registration.status !== 'PENDING') {
            // अगर allotment हो चुका है (status ACCEPTED/CANCELLED), तो reject कर दो
            return res.status(200).json({
                status: 200,
                message: 'Cancel registration unsuccessful',
                data: {
                    success: {
                        registration_id,
                        course_id: registration.course_id,
                        status: 'CANCEL_REJECTED',
                    },
                },
            });
        }
        const course = yield Course_1.Course.findOne({ course_id: registration.course_id });
        if (!course) {
            return res.status(400).json({
                status: 400,
                message: 'COURSE_NOT_FOUND',
                data: { failure: { Message: 'Course not found' } },
            });
        }
        // registered array से हटा दो
        course.registered = course.registered.filter((id) => id.toString() !== registration._id.toString());
        yield course.save();
        // registration delete कर दो
        yield Registration_1.Registration.deleteOne({ registration_id });
        return res.status(200).json({
            status: 200,
            message: 'Cancel registration successful',
            data: {
                success: {
                    registration_id,
                    course_id: course.course_id,
                    status: 'CANCEL_ACCEPTED',
                },
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.cancelRegistration = cancelRegistration;
//# sourceMappingURL=cancelRegistration.js.map