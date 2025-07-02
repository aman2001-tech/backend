import { Request, Response } from 'express';
import { Course , CourseOfferingRequestBody } from '../models/Course';
import { isValidDDMMYY } from '../utils/validators';


 export const addCourseOffering = async(req:Request, res: Response) =>{
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
    };