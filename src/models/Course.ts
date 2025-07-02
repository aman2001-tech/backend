import mongoose, { Schema, Document, Types } from 'mongoose';

export interface CourseDoc extends Document {
  course_id: string;
  course_name: string;
  instructor_name: string;
  start_date: string;
  min_employees: number;
  max_employees: number;
  registered: Types.ObjectId[];
  status: 'PENDING' | 'ALLOTTED' | 'CANCELLED';
}

export interface CourseOfferingRequestBody {
  course_name: string;
  instructor_name: string;
  start_date: string;
  min_employees: number;
  max_employees: number;
}

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

export const Course = mongoose.model<CourseDoc>('Course', CourseSchema);
