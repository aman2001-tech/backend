import mongoose, { Schema, Document } from 'mongoose';

export interface RegistrationDoc extends Document {
  registration_id: string;
  email: string;
  employee_name: string;
  course_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED';
}

export  interface RegisterRequestBody {
  email: string;
  employee_name: string;
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

export const Registration = mongoose.model<RegistrationDoc>(
  'Registration',
  RegistrationSchema
);
