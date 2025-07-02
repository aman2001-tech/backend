import express from 'express';
import {
  addCourseOffering,
} from '../controllers/courseController';

import { allotCourse } from '../controllers/allotmentController';

const router = express.Router();

router.post('/add/courseOffering', addCourseOffering);
router.post('/allot/:course_id', allotCourse);

export default router;
