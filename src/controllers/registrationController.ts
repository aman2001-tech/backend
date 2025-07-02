import mongoose, { Types } from 'mongoose';
import { Request, Response } from 'express';
import { Course } from '../models/Course';
import { isValidDDMMYY } from '../utils/validators';
import { Registration, RegisterRequestBody } from '../models/Registration';

export const registerToCourse = async (req: Request, res: Response) => {
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
};
