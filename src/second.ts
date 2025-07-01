import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mongoose, { Schema, Document } from 'mongoose';
import session from 'express-session';
import connectMongoDBSession from 'connect-mongodb-session';

const app = express();
app.use(bodyParser.json());

const MONGODB_URI = 'mongodb://127.0.0.1:27017/Courses';



const MongoDBStore = connectMongoDBSession(session);
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions',
});

store.on('error', function (error) {
  console.error('Session store error:', error);
});

app.use(
  session({
    secret: 'This is my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// --- Interfaces
interface RegistrationSubDoc {
  registration_id: string;
  email: string;
  employee_name: string;
  course_id: string;
}

interface CourseDoc extends Document {
  course_id: string;
  course_name: string;
  instructor_name: string;
  start_date: string;
  min_employees: number;
  max_employees: number;
  registered: RegistrationSubDoc[];
  allotted: boolean;
}

interface RegistrationDoc extends Document {
  registration_id: string;
  email: string;
  employee_name: string;
  course_id: string;
}

// --- Schemas
const RegistrationSchema = new Schema<RegistrationSubDoc>({
  registration_id: String,
  email: String,
  employee_name: String,
  course_id: String,
});

const CourseSchema = new Schema<CourseDoc>({
  course_id: { type: String, unique: true },
  course_name: String,
  instructor_name: String,
  start_date: String,
  min_employees: Number,
  max_employees: Number,
  registered: [RegistrationSchema],
  allotted: Boolean,
});

const RegistrationSchemaFull = new Schema<RegistrationDoc>({
  registration_id: { type: String, unique: true },
  email: String,
  employee_name: String,
  course_id: String,
});

// --- Models
const Course = mongoose.model<CourseDoc>('Course', CourseSchema);
const Registration = mongoose.model<RegistrationDoc>(
  'Registration',
  RegistrationSchemaFull
);

// --- Routes

// Add course
app.post('/add/courseOffering', async (req: Request, res: Response) => {
  const {
    course_name,
    instructor_name,
    start_date,
    min_employees,
    max_employees,
  } = req.body;

  if (
    !course_name ||
    !instructor_name ||
    !start_date ||
    typeof min_employees !== 'number' ||
    typeof max_employees !== 'number'
  ) {
    return res.status(400).json({ message: 'Invalid or missing fields' });
  }

  const course_id = `OFFERING-${course_name}-${instructor_name}`;

  try {
    const exists = await Course.findOne({ course_id });
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

    await course.save();

    return res.status(200).json({
      status: 200,
      message: 'course added successfully',
      data: { success: { course_id } },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Register employee to course
app.post('/add/register/:course_id', async (req: Request, res: Response) => {
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
    const course = await Course.findOne({ course_id });
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
    await course.save();

    const regDoc = new Registration(registration);
    await regDoc.save();

    return res.status(200).json({
      status: 200,
      message: `successfully registered for ${course_id}`,
      data: { success: { registration_id, status: 'ACCEPTED' } },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Allot course
app.post('/allot/:course_id', async (req: Request, res: Response) => {
  const course_id = req.params.course_id;
    console.log('Course ID from URL:', course_id);
  try {
    const course = await Course.findOne({ course_id });
    console.log("Course found", course)
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
    await course.save();

    return res.status(200).json({
      status: 200,
      message: 'successfully allotted course to registered employees',
      data: {
        success: allotments.sort((a, b) =>
          a.registration_id.localeCompare(b.registration_id)
        ),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel registration
app.post('/cancel/:registration_id', async (req: Request, res: Response) => {
  const registration_id = req.params.registration_id;

  try {
    const registration = await Registration.findOne({ registration_id });
    if (!registration) {
      return res.status(400).json({
        status: 400,
        message: 'REGISTRATION_NOT_FOUND',
        data: { failure: { Message: 'Registration ID not found' } },
      });
    }

    const course = await Course.findOne({ course_id: registration.course_id });
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

    course.registered = course.registered.filter(
      (r) => r.registration_id !== registration_id
    );
    await course.save();
    await Registration.deleteOne({ registration_id });

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
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- MongoDB Connection and App Start
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(7070, () => console.log('Server running on port 7070'));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
