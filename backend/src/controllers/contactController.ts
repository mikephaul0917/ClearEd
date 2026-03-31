import { Request, Response } from 'express';
import { sendContactFormEmail } from '../utils/emailService';

export class ContactController {
  /**
   * @route   POST /api/contact/submit
   * @desc    Handle contact form submission
   * @access  Public
   */
  static async submitContactForm(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, service, description } = req.body;

      // Basic validation
      if (!firstName || !lastName || !email || !description) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required fields (Name, Email, and Description)'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // Send email notification
      try {
        await sendContactFormEmail({
          firstName,
          lastName,
          email,
          service,
          description
        });
      } catch (emailError) {
        console.error('Error in ContactController while sending email:', emailError);
        // We continue even if email fails, but you might want to return an error depending on requirements
        // In this case, since email IS the primary action, we should probably fail.
        return res.status(500).json({
          success: false,
          message: 'Failed to send your message. Please try again later.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon!'
      });
    } catch (error: any) {
      console.error('Error in submitContactForm:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error occurred while processing your request'
      });
    }
  }
}
