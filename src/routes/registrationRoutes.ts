import express from 'express';
import {registerToCourse} from '../controllers/registrationController';
import { cancelRegistration } from '../controllers/cancelRegistration';
const router = express.Router();

router.post('/add/register/:course_id', registerToCourse);
router.post('/cancel/:registration_id', cancelRegistration);

export default router;
