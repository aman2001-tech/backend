import { Request, Response } from 'express';
import {Course} from '../models/Course';
import {Registration} from '../models/Registration';

export const allotCourse = async (req: Request, res: Response) => {
  const { course_id } = req.params;

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
      course.registered.map(async (reg: any) => {
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
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
