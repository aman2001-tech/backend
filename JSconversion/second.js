"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const mongoose_1 = __importStar(require("mongoose"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongodb_session_1 = __importDefault(require("connect-mongodb-session"));
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
const MONGODB_URI = 'mongodb://127.0.0.1:27017/Courses';
const MongoDBStore = (0, connect_mongodb_session_1.default)(express_session_1.default);
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions',
});
store.on('error', function (error) {
    console.error('Session store error:', error);
});
app.use((0, express_session_1.default)({
    secret: 'This is my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
}));
// --- Schemas
const RegistrationSchema = new mongoose_1.Schema({
    registration_id: String,
    email: String,
    employee_name: String,
    course_id: String,
});
const CourseSchema = new mongoose_1.Schema({
    course_id: { type: String, unique: true },
    course_name: String,
    instructor_name: String,
    start_date: String,
    min_employees: Number,
    max_employees: Number,
    registered: [RegistrationSchema],
    allotted: Boolean,
});
const RegistrationSchemaFull = new mongoose_1.Schema({
    registration_id: { type: String, unique: true },
    email: String,
    employee_name: String,
    course_id: String,
});
// --- Models
const Course = mongoose_1.default.model('Course', CourseSchema);
const Registration = mongoose_1.default.model('Registration', RegistrationSchemaFull);
// --- Routes
// Add course
app.post('/add/courseOffering', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { course_name, instructor_name, start_date, min_employees, max_employees, } = req.body;
    if (!course_name ||
        !instructor_name ||
        !start_date ||
        typeof min_employees !== 'number' ||
        typeof max_employees !== 'number') {
        return res.status(400).json({ message: 'Invalid or missing fields' });
    }
    const course_id = `OFFERING-${course_name}-${instructor_name}`;
    try {
        const exists = yield Course.findOne({ course_id });
        if (exists) {
            return res.status(400).json({
                status: 400,
                message: 'INPUT_DATA_ERROR',
                data: { failure: { Message: 'Course already exists' } },
            });
        }
        const course = new Course({
            course_id,
            course_name,
            instructor_name,
            start_date,
            min_employees,
            max_employees,
            registered: [],
            allotted: false,
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
}));
// Register employee to course
app.post('/add/register/:course_id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, employee_name } = req.body;
    const course_id = req.params.course_id;
    if (!email || !employee_name || !course_id) {
        return res.status(400).json({
            status: 400,
            message: 'INPUT_DATA_ERROR',
            data: {
                failure: { Message: 'email, employee_name and course_id are required' },
            },
        });
    }
    try {
        const course = yield Course.findOne({ course_id });
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
        if (course.registered.some((r) => r.email === email)) {
            return res.status(400).json({
                status: 400,
                message: 'ALREADY_REGISTERED',
                data: { failure: { Message: 'Already registered for this course' } },
            });
        }
        const registration_id = `${employee_name}-${course.course_id}`;
        const registration = {
            registration_id,
            email,
            employee_name,
            course_id,
        };
        course.registered.push(registration);
        yield course.save();
        const regDoc = new Registration(registration);
        yield regDoc.save();
        return res.status(200).json({
            status: 200,
            message: `successfully registered for ${course_id}`,
            data: { success: { registration_id, status: 'ACCEPTED' } },
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// Allot course
app.post('/allot/:course_id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const course_id = req.params.course_id;
    console.log('Course ID from URL:', course_id);
    try {
        const course = yield Course.findOne({ course_id });
        console.log("Course found", course);
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
        yield course.save();
        return res.status(200).json({
            status: 200,
            message: 'successfully allotted course to registered employees',
            data: {
                success: allotments.sort((a, b) => a.registration_id.localeCompare(b.registration_id)),
            },
        });
    }
    catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// Cancel registration
app.post('/cancel/:registration_id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const registration_id = req.params.registration_id;
    try {
        const registration = yield Registration.findOne({ registration_id });
        if (!registration) {
            return res.status(400).json({
                status: 400,
                message: 'REGISTRATION_NOT_FOUND',
                data: { failure: { Message: 'Registration ID not found' } },
            });
        }
        const course = yield Course.findOne({ course_id: registration.course_id });
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
        yield course.save();
        yield Registration.deleteOne({ registration_id });
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
    catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
// --- MongoDB Connection and App Start
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    console.log('MongoDB connected');
    app.listen(7070, () => console.log('Server running on port 7070'));
})
    .catch((err) => {
    console.error('MongoDB connection error:', err);
});
//# sourceMappingURL=second.js.map