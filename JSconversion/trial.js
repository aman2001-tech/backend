"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
const COURSES_FILE = path_1.default.join(__dirname, 'data', 'courses.json');
const REGISTER_FILE = path_1.default.join(__dirname, 'data', 'registeration.json');
if (!fs_1.default.existsSync(path_1.default.dirname(COURSES_FILE))) {
    fs_1.default.mkdirSync(path_1.default.dirname(COURSES_FILE), { recursive: true });
}
if (!fs_1.default.existsSync(COURSES_FILE)) {
    fs_1.default.writeFileSync(COURSES_FILE, '[]');
}
if (!fs_1.default.existsSync(path_1.default.dirname(REGISTER_FILE))) {
    fs_1.default.mkdirSync(path_1.default.dirname(REGISTER_FILE), { recursive: true });
}
if (!fs_1.default.existsSync(REGISTER_FILE)) {
    fs_1.default.writeFileSync(REGISTER_FILE, '[]');
}
function ReadCourses() {
    return JSON.parse(fs_1.default.readFileSync(COURSES_FILE, 'utf-8'));
}
function SaveCourses(courses) {
    fs_1.default.writeFileSync(COURSES_FILE, JSON.stringify(courses, null, 2));
}
function ReadRegisterations() {
    return JSON.parse(fs_1.default.readFileSync(REGISTER_FILE, 'utf-8'));
}
function SaveRegistrations(registerations) {
    fs_1.default.writeFileSync(REGISTER_FILE, JSON.stringify(registerations, null, 2));
}
app.post('/add/courseOffering', (req, res) => {
    const { course_name, instructor_name, start_date, min_employees, max_employees, } = req.body;
    if (!course_name ||
        !instructor_name ||
        !start_date ||
        min_employees === undefined ||
        max_employees === undefined) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const course_id = `OFFERING-${course_name}-${instructor_name}`;
    const courses = ReadCourses();
    const existingCourse = courses.find((course) => course.course_id === course_id);
    if (existingCourse) {
        return res.status(400).json({
            status: 400,
            message: 'INPUT_DATA_ERROR',
            data: { failure: { Message: 'course_id already exists' } },
        });
    }
    const newCourse = {
        course_id,
        course_name,
        instructor_name,
        start_date,
        min_employees,
        max_employees,
        registered: [],
        allotted: false,
    };
    courses.push(newCourse);
    SaveCourses(courses);
    return res.status(200).json({
        status: 200,
        message: 'course added successfully',
        data: {
            success: { course_id },
        },
    });
});
app.post('/add/register/:course_id', (req, res) => {
    const { email, employee_name, course_id } = req.body;
    if (!email || !employee_name || !course_id) {
        return res.status(400).json({
            status: 400,
            message: 'INPUT_DATA_ERROR',
            data: {
                failure: { Message: 'email, employee_name and course_id are required' },
            },
        });
    }
    const courses = ReadCourses();
    const course = courses.find((c) => c.course_id === course_id);
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
    if (course.registered.some((reg) => reg.email === email)) {
        return res.status(400).json({
            status: 400,
            message: 'ALREADY_REGISTERED',
            data: { failure: { Message: 'Already registered for this course' } },
        });
    }
    const registration_id = `${employee_name}-${course.course_id}`;
    const newRegistration = {
        registration_id,
        email,
        employee_name,
        course_id,
    };
    course.registered.push(newRegistration);
    SaveCourses(courses);
    const registerations = ReadRegisterations();
    registerations.push(newRegistration);
    SaveRegistrations(registerations);
    return res.status(200).json({
        status: 200,
        message: `successfully registered for ${course_id}`,
        data: { success: { registration_id, status: 'ACCEPTED' } },
    });
});
app.post('/allot/:course_id', (req, res) => {
    const course_id = req.params.course_id;
    const courses = ReadCourses();
    const course = courses.find((c) => c.course_id === course_id);
    if (!course) {
        return res.status(400).json({
            status: 400,
            message: 'COURSE_NOT_FOUND',
            data: { failure: { Message: 'Course not found' } },
        });
    }
    const isEnough = course.registered.length >= course.min_employees;
    const allotments = course.registered.map((emp) => ({
        registration_id: emp.registration_id,
        email: emp.email,
        course_name: course.course_name,
        course_id: course.course_id,
        status: isEnough ? 'ACCEPTED' : 'COURSE_CANCELED',
    }));
    course.allotted = true;
    SaveCourses(courses);
    return res.status(200).json({
        status: 200,
        message: 'successfully allotted course to registered employees',
        data: {
            success: allotments.sort((a, b) => a.registration_id.localeCompare(b.registration_id)),
        },
    });
});
app.post('/cancel/:registration_id', (req, res) => {
    const registration_id = req.params.registration_id;
    const courses = ReadCourses();
    const registrations = ReadRegisterations();
    const registration = registrations.find((r) => r.registration_id === registration_id);
    if (!registration) {
        return res.status(400).json({
            status: 400,
            message: 'REGISTRATION_NOT_FOUND',
            data: { failure: { Message: 'Registration ID not found' } },
        });
    }
    const course = courses.find((c) => c.course_id === registration.course_id);
    if (!course) {
        return res.status(400).json({
            status: 400,
            message: 'COURSE_NOT_FOUND',
            data: { failure: { Message: 'Course not found' } },
        });
    }
    if (course.allotted) {
        return res.status(200).json({
            status: 200,
            message: 'Cancel registration unsuccessful',
            data: {
                success: {
                    registration_id,
                    course_id: course.course_id,
                    status: 'CANCEL_REJECTED',
                },
            },
        });
    }
    course.registered = course.registered.filter((r) => r.registration_id !== registration_id);
    SaveCourses(courses);
    const updatedRegistrations = registrations.filter((r) => r.registration_id !== registration_id);
    SaveRegistrations(updatedRegistrations);
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
});
app.listen(9000, () => console.log('Server running on http://localhost:9000'));
//# sourceMappingURL=trial.js.map