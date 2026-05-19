import { supabase } from './supabase';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  userType: string;
  subject: string;
  message: string;
}

export async function submitContactForm(data: ContactFormData) {
  const { error } = await supabase
    .from('contact_submissions')
    .insert([
      {
        name: data.name,
        email: data.email,
        phone: data.phone,
        user_type: data.userType,
        subject: data.subject,
        message: data.message,
        status: 'new'
      }
    ]);

  if (error) {
    throw error;
  }

  return { success: true };
}
