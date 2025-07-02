import { Request, Response } from 'express';
import { Course } from '../models/Course';
import { Registration } from '../models/Registration';

export const cancelRegistration = async (req: Request, res: Response) => {
  const { registration_id } = req.params;

  try {
    const registration = await Registration.findOne({ registration_id });
    if (!registration) {
      return res.status(400).json({
        status: 400,
        message: 'REGISTRATION_NOT_FOUND',
        data: { failure: { Message: 'Registration ID not found' } },
      });
    }

    if (registration.status !== 'PENDING') {
      //(status ACCEPTED/CANCELLED)
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

    const course = await Course.findOne({ course_id: registration.course_id });
    if (!course) {
      return res.status(400).json({
        status: 400,
        message: 'COURSE_NOT_FOUND',
        data: { failure: { Message: 'Course not found' } },
      });
    }

    // registered array 
    course.registered = course.registered.filter(
      (id: any) => id.toString() !== registration._id.toString()
    );
    await course.save();

    // registration delete 
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
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
  