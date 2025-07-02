import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import mongoose, { Schema, Document, Types } from 'mongoose';
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

interface CourseDoc extends Document {
  course_id: string;
  course_name: string;
  instructor_name: string;
  start_date: string;
  min_employees: number;
  max_employees: number;
  registered: (Types.ObjectId | RegistrationDoc)[];
  status: 'PENDING' | 'ALLOTTED' | 'CANCELLED';
}

interface RegistrationDoc extends Document {
  registration_id: string;
  email: string;
  employee_name: string;
  course_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED';
}

const RegistrationSchema = new Schema<RegistrationDoc>({
  registration_id: { type: String, unique: true },
  email: String,
  employee_name: String,
  course_id: String,
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'CANCELLED'],
    default: 'PENDING',
  },
});

const CourseSchema = new Schema<CourseDoc>({
  course_id: { type: String, unique: true },
  course_name: String,
  instructor_name: String,
  start_date: String,
  min_employees: Number,
  max_employees: Number,
  registered: [{ type: Schema.Types.ObjectId, ref: 'Registration' }],
  status: {
    type: String,
    enum: ['PENDING', 'ALLOTTED', 'CANCELLED'],
    default: 'PENDING',
  },
});

const Course = mongoose.model<CourseDoc>('Course', CourseSchema);
const Registration = mongoose.model<RegistrationDoc>(
  'Registration',
  RegistrationSchema
);

interface CourseOfferingRequestBody {
  course_name: string;
  instructor_name: string;
  start_date: string;
  min_employees: number;
  max_employees: number;
}

interface RegisterRequestBody {
  email: string;
  employee_name: string;
}

function isValidDDMMYY(dateStr: string): boolean {
  if (!/^\d{6}$/.test(dateStr)) return false;

  const day = parseInt(dateStr.substring(0, 2));
  const month = parseInt(dateStr.substring(2, 4));
  const year = parseInt(dateStr.substring(4, 6));
  const fullYear = 2000 + year;
  const date = new Date(fullYear, month - 1, day);

  return (
    date.getFullYear() === fullYear &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

app.post('/add/courseOffering', async (req: Request, res: Response) => {
  const {
    course_name,
    instructor_name,
    start_date,
    min_employees,
    max_employees,
  } = req.body as CourseOfferingRequestBody;

  if (
    !course_name ||
    !instructor_name ||
    !start_date ||
    typeof min_employees !== 'number' ||
    typeof max_employees !== 'number'
  ) {
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

  if (!isValidDDMMYY(start_date)) {
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
      status: 'PENDING',
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

app.post('/add/register/:course_id', async (req: Request, res: Response) => {
  const { email, employee_name } = req.body as RegisterRequestBody;
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
    const course = await Course.findOne({ course_id }).populate('registered');
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

    const alreadyRegistered = await Registration.findOne({ course_id, email });
    if (alreadyRegistered) {
      return res.status(400).json({
        status: 400,
        message: 'ALREADY_REGISTERED',
        data: { failure: { Message: 'Already registered for this course' } },
      });
    }

    const registration_id = `${employee_name}-${course.course_id}`;
    const regDoc = new Registration({
      registration_id,
      email,
      employee_name,
      course_id,
      status: 'PENDING',
    });

    await regDoc.save();
    course.registered.push(regDoc._id as Types.ObjectId);
    await course.save();

    return res.status(200).json({
      status: 200,
      message: `successfully registered for ${course_id}`,
      data: { success: { registration_id, status: 'PENDING' } },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/allot/:course_id', async (req: Request, res: Response) => {
  const course_id = req.params.course_id;

  try {
    const course = await Course.findOne({ course_id }).populate('registered');
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

    await Promise.all(
      (course.registered as RegistrationDoc[]).map(async (reg) => {
        reg.status = newStatus;
        await reg.save();
      })
    );

    course.status = isEnough ? 'ALLOTTED' : 'CANCELLED';
    await course.save();

    const allotments = course.registered
      .map((emp: any) => ({
        registration_id: emp.registration_id,
        email: emp.email,
        course_name: course.course_name,
        course_id: course.course_id,
        status: emp.status,
      }))
      .sort((a: any, b: any) =>
        a.registration_id.localeCompare(b.registration_id)
      );

    return res.status(200).json({
      status: 200,
      message: 'Successfully allotted course to registered employees',
      data: { success: allotments },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

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

    course.registered = course.registered.filter(
      (id: any) => id.toString() !== registration._id.toString()
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

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(7070, () => console.log('Server running on port 7070'));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
