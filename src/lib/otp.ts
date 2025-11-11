import { supabase } from './supabase';

export interface OTPRequest {
  identifier: string; // email or phone
  otp_type: 'email' | 'phone';
}

export interface OTPVerification {
  identifier: string;
  otp_code: string;
  otp_type: 'email' | 'phone';
}

// Generate 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to email
export const sendOTP = async (identifier: string, otpType: 'email'): Promise<{ error: any }> => {
  try {
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

    // Store OTP in database (user_id is null during registration, before account creation)
    // Note: attempts column may not exist yet - it will be added via migration
    const insertData: any = {
      user_id: null, // Will be set later after user creation
      identifier: identifier,
      otp_code: otpCode,
      otp_type: otpType,
      expires_at: expiresAt.toISOString(),
      verified: false,
    };
    
    // Only include attempts if the column exists (will be added via migration)
    // For now, we'll try without it first
    const { error } = await supabase.from('otp_verifications').insert(insertData);

    if (error) {
      console.error('Error storing OTP:', error);
      return { error };
    }

    // Call backend API to send email OTP
    // Strategy:
    // - In production (Vercel): Use relative path (same domain) - API routes work automatically
    // - In development: 
    //   * Always use relative path '/api/send-otp-email'
    //   * Vite proxy (vite.config.ts) will forward to backend server if running
    //   * OR use Vercel dev for local API routes testing
    // NOTE: VITE_API_URL should NOT be set - use Vite proxy instead
    const apiEndpoint = '/api/send-otp-email';
    
    console.log('📡 Calling OTP API:', apiEndpoint);
    console.log('🔍 Development mode - using Vite proxy or Vercel dev');
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier,
          otp_code: otpCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to send OTP via API:', errorData);
        
        // If API returns OTP code (Gmail auth error or Resend limitation), use it
        if (errorData.otp_code) {
          console.log('%c🔐 OTP FOR TESTING', 'color: #ffaa00; font-size: 20px; font-weight: bold;');
          console.log(`%cEMAIL: ${identifier}`, 'color: #ffaa00; font-size: 16px;');
          console.log(`%cOTP CODE: ${errorData.otp_code}`, 'color: #00ff00; font-size: 24px; font-weight: bold; background: #000; padding: 10px; border: 2px solid #00ff00;');
          console.log('%c⚠️ Email sending failed - using console OTP for testing', 'color: #ffaa00; font-size: 14px;');
          if (errorData.details && errorData.details.includes('535')) {
            console.log('%c💡 Gmail authentication error - check FIX_GMAIL_AUTH.md for instructions', 'color: #ff6b6b; font-size: 14px;');
          }
          // Don't return error - OTP is stored in DB and user can use it from console
          return { error: null };
        }
        
        // Fallback: Log OTP for development/testing (only if API fails)
        if (import.meta.env.DEV) {
          console.log('%c🔐 OTP FOR TESTING (API failed)', 'color: #ffaa00; font-size: 20px; font-weight: bold;');
          console.log(`%cEMAIL: ${identifier}`, 'color: #ffaa00; font-size: 16px;');
          console.log(`%cOTP CODE: ${otpCode}`, 'color: #ffaa00; font-size: 24px; font-weight: bold; background: #000; padding: 10px;');
          console.log('%c⚠️ Resend free tier only allows sending to your account email', 'color: #ffaa00; font-size: 14px;');
        }
        // Don't return error in dev mode - OTP is stored and user can see it in console
        if (import.meta.env.DEV) {
          return { error: null };
        }
        return { error: new Error(errorData.error || 'Failed to send OTP') };
      }

      const result = await response.json();
      
      // Email OTP - always sent via Resend
      console.log(`✅ OTP sent successfully to ${identifier} via email`);
      if (import.meta.env.DEV) {
        console.log('%c📧 Check your email for the OTP code', 'color: #00ff00; font-size: 16px;');
      }
      
      return { error: null };
    } catch (apiError: any) {
      console.error('Error calling OTP API:', apiError);
      
      // Fallback: Log OTP for development/testing if API is not available
      if (import.meta.env.DEV) {
        console.log('%c🔐 OTP FOR TESTING (Backend API unavailable)', 'color: #ffaa00; font-size: 20px; font-weight: bold;');
        console.log(`%cEMAIL: ${identifier}`, 'color: #ffaa00; font-size: 16px;');
        console.log(`%cOTP CODE: ${otpCode}`, 'color: #ffaa00; font-size: 24px; font-weight: bold; background: #000; padding: 10px;');
        console.log('⚠️ Backend API not available. Make sure server is running on port 3001.');
        console.log('⚠️ This is development mode only. In production, OTPs will be sent via email.');
      }
      
      return { error: apiError };
    }
  } catch (error: any) {
    return { error };
  }
};

// Verify OTP
export const verifyOTP = async (
  identifier: string,
  otpCode: string,
  otpType: 'email'
): Promise<{ error: any; verified: boolean }> => {
  try {
    // Get the latest OTP for this identifier
    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('identifier', identifier)
      .eq('otp_type', otpType)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { error: new Error('Invalid or expired OTP'), verified: false };
    }

    // Check attempts (if attempts column exists)
    const attempts = data.attempts || 0;
    if (attempts >= 5) {
      return { error: new Error('Too many attempts. Please request a new OTP.'), verified: false };
    }

    // Verify OTP
    if (data.otp_code !== otpCode) {
      // Increment attempts (if attempts column exists)
      if (data.attempts !== undefined) {
        await supabase
          .from('otp_verifications')
          .update({ attempts: attempts + 1 })
          .eq('id', data.id);
      }

      return { error: new Error('Invalid OTP code'), verified: false };
    }

    // Mark as verified
    await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', data.id);

    return { error: null, verified: true };
  } catch (error: any) {
    return { error, verified: false };
  }
};

// Update user verification status
export const updateVerificationStatus = async (
  userId: string,
  otpType: 'email'
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', userId);

    return { error };
  } catch (error: any) {
    return { error };
  }
};
