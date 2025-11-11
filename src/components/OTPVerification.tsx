import { useState, useEffect } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { sendOTP, verifyOTP, updateVerificationStatus } from '@/lib/otp';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Mail, Loader2, AlertCircle } from 'lucide-react';

interface OTPVerificationProps {
  identifier: string;
  otpType: 'email';
  onVerified: () => void;
  onCancel: () => void;
}

export const OTPVerification = ({ identifier, otpType, onVerified, onCancel }: OTPVerificationProps) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Send OTP on mount (but don't block UI if it fails)
    handleSendOTP();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOTP = async () => {
    setSending(true);
    const { error } = await sendOTP(identifier, otpType);
    setSending(false);

    // Always show OTP input, even if sending fails
    // In development, OTP is logged to console
    const isDevelopment = import.meta.env.DEV;
    
    if (error) {
      // Still show success message in development (OTP is logged to console)
      if (isDevelopment) {
        // Get OTP from database to show in toast
        const { data } = await supabase
          .from('otp_verifications')
          .select('otp_code')
          .eq('identifier', identifier)
          .eq('otp_type', otpType)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          toast({
            title: 'OTP Generated (Development Mode)',
            description: `Check browser console for OTP. Code: ${data.otp_code}`,
            duration: 10000,
          });
          setResendCooldown(60); // 60 second cooldown
        } else {
          toast({
            title: 'OTP Input Ready',
            description: `Check browser console for OTP code. You can still enter the OTP.`,
            duration: 10000,
          });
        }
      } else {
        toast({
          title: 'OTP Input Ready',
          description: error.message || 'You can still enter the OTP if it was sent.',
          variant: 'default',
        });
      }
    } else {
      // OTP sent successfully
      if (isDevelopment) {
        // Get OTP from database to show in toast
        const { data } = await supabase
          .from('otp_verifications')
          .select('otp_code')
          .eq('identifier', identifier)
          .eq('otp_type', otpType)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          toast({
            title: 'OTP Generated (Development Mode)',
            description: `Check browser console for OTP. Code: ${data.otp_code}`,
            duration: 10000,
          });
        } else {
          toast({
            title: 'OTP Sent',
            description: `Check browser console for OTP code (development mode)`,
            duration: 10000,
          });
        }
      } else {
        toast({
          title: 'OTP Sent',
          description: 'Verification code sent to your email',
        });
      }
      setResendCooldown(60); // 60 second cooldown
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error, verified } = await verifyOTP(identifier, otp, otpType);

    if (error || !verified) {
      toast({
        title: 'Verification Failed',
        description: error?.message || 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Update user verification status
    if (user) {
      const { error: updateError } = await updateVerificationStatus(user.id, otpType);
      if (updateError) {
        console.error('Error updating verification status:', updateError);
      }
    }

    toast({
      title: 'Verified!',
      description: 'Your email has been verified successfully',
    });

    setLoading(false);
    onVerified();
  };

  return (
    <Card className="glass-card border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Verify Email
        </CardTitle>
        <CardDescription className="text-white/70">
          Enter the 6-digit code sent to {identifier}
        </CardDescription>
        {/* Email Notice */}
        <div className="mt-4 p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-200">
              <p className="font-semibold mb-1">Check Your Email</p>
              <p>We've sent a verification code to your email address.</p>
              <p className="mt-1">Please check your inbox (and spam folder).</p>
              {import.meta.env.DEV && (
                <p className="mt-2 text-warning">Development: OTP may also be logged to browser console.</p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} className="bg-white/10 border-white/30 text-white" />
              <InputOTPSlot index={1} className="bg-white/10 border-white/30 text-white" />
              <InputOTPSlot index={2} className="bg-white/10 border-white/30 text-white" />
              <InputOTPSlot index={3} className="bg-white/10 border-white/30 text-white" />
              <InputOTPSlot index={4} className="bg-white/10 border-white/30 text-white" />
              <InputOTPSlot index={5} className="bg-white/10 border-white/30 text-white" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-white/30 text-white hover:bg-white/10"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleSendOTP}
            disabled={sending || resendCooldown > 0}
            className="text-white/70 hover:text-white"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              `Resend in ${resendCooldown}s`
            ) : (
              'Resend OTP'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


