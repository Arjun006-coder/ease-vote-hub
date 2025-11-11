import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, User, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { OTPVerification } from '@/components/OTPVerification';
import { IDCardScanner } from '@/components/IDCardScanner';
import { sendOTP, updateVerificationStatus } from '@/lib/otp';
import { supabase } from '@/lib/supabase';

type RegistrationStep = 'id-card' | 'email' | 'email-otp' | 'complete';

const Register = () => {
  const navigate = useNavigate();
  const { signUp, user, userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<RegistrationStep>('id-card');
  const [loading, setLoading] = useState(false);
  
  // Form Data
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Verification Status
  const [emailVerified, setEmailVerified] = useState(false);
  const [idCardHash, setIdCardHash] = useState<string | null>(null);
  const [idCardBarcode, setIdCardBarcode] = useState<string | null>(null); // Store barcode content
  const [idCardImageDataUrl, setIdCardImageDataUrl] = useState<string | null>(null); // Store image data URL temporarily

  useEffect(() => {
    // If user is already logged in and profile is completed, redirect to dashboard
    if (user && userProfile?.profile_completed) {
      navigate('/dashboard');
    }
  }, [user, userProfile, navigate]);

  const validateEmail = () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }

    setLoading(true);

    try {
      // Send email OTP
      const { error: otpError } = await sendOTP(email, 'email');
      
      if (otpError) {
        toast({
          title: 'OTP Generated',
          description: 'Check browser console for OTP code. You can still verify the OTP.',
          duration: 10000,
        });
      } else {
        toast({
          title: 'OTP Sent',
          description: `OTP sent to ${email}. Please check your email.`,
        });
      }

      // Move to email OTP verification
      setStep('email-otp');
    } catch (error: any) {
      toast({
        title: 'OTP Generated',
        description: 'Check browser console for OTP code. You can still verify the OTP.',
        duration: 10000,
      });
      setStep('email-otp');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOTPVerified = async () => {
    setEmailVerified(true);
    
    // Update verification status in database
    if (user) {
      const { error } = await updateVerificationStatus(user.id, 'email');
      if (error) {
        console.error('Error updating email verification status:', error);
      }
    }
    
    toast({
      title: 'Email Verified! ✅',
      description: 'Your email has been verified successfully. Now create your account.',
    });

    // Move directly to account creation
    setStep('complete');
  };

  const handleIDCardVerified = async (hash: string, barcodeContent: string, imageDataUrl: string) => {
    // Store ID card data (image as data URL) and move to email verification
    setIdCardHash(hash);
    setIdCardBarcode(barcodeContent); // Store barcode content
    setIdCardImageDataUrl(imageDataUrl);
    
    toast({
      title: 'ID Card Verified! ✅',
      description: 'Barcode verified and unique. Now verify your email.',
    });

    // Move to email verification step
    setStep('email');
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (!idCardHash || !idCardBarcode || !idCardImageDataUrl) {
      toast({
        title: 'Validation Error',
        description: 'ID card verification is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Validate ID card data is still in state
      if (!idCardHash || !idCardBarcode || !idCardImageDataUrl) {
        toast({
          title: 'Validation Error',
          description: 'ID card verification data is missing. Please go back and verify your ID card again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      console.log('📝 Creating account with ID card data:', {
        hasHash: !!idCardHash,
        hasBarcode: !!idCardBarcode,
        hasImage: !!idCardImageDataUrl,
        barcode: idCardBarcode.substring(0, 10) + '...',
      });

      // Create account with Supabase Auth
      const { error: signUpError } = await signUp(email, password, fullName, ''); // Empty phone

      if (signUpError) {
        toast({
          title: 'Account Creation Failed',
          description: signUpError.message || 'Failed to create account. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Wait for user to be created and session to be available
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get current user from Supabase auth (most reliable way)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast({
          title: 'Error',
          description: 'User session not found. Please try logging in again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      console.log('✅ User created:', currentUser.id);

      // Refresh user profile to ensure it exists
      await refreshProfile();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Now upload the ID card image to storage
      let imageUrl: string | null = null;
      
      if (idCardImageDataUrl) {
        try {
          console.log('📤 Uploading ID card image...');
          // Convert data URL to blob
          const response = await fetch(idCardImageDataUrl);
          const blob = await response.blob();
          
          // Extract file extension
          const fileExt = idCardImageDataUrl.split(';')[0].split('/')[1] || 'jpg';
          const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
          
          // Upload to user's folder in storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('id-cards')
            .upload(fileName, blob, {
              contentType: `image/${fileExt}`,
              upsert: false,
            });

          if (uploadError) {
            console.error('❌ Error uploading image:', uploadError);
            console.error('💡 This is likely an RLS policy issue. Run FIX_STORAGE_RLS.sql in Supabase SQL Editor.');
            // Don't block registration if image upload fails
            toast({
              title: 'Warning',
              description: `Image upload failed: ${uploadError.message}. Account will be created without image. Check console for details.`,
              variant: 'default',
              duration: 10000,
            });
          } else {
            // Get the public URL
            const { data: urlData } = supabase.storage
              .from('id-cards')
              .getPublicUrl(fileName);
            
            imageUrl = urlData.publicUrl;
            console.log('✅ Image uploaded:', imageUrl);
          }
        } catch (uploadErr: any) {
          console.error('❌ Image upload error:', uploadErr);
          // Don't block registration if image upload fails
          toast({
            title: 'Warning',
            description: `Image upload failed: ${uploadErr.message}. Account will be created without image.`,
            variant: 'default',
          });
        }
      }

      // Prepare update data
      const updateData: any = {
        id_card_hash: idCardHash,
        id_card_barcode: idCardBarcode,
        id_card_verified: true,
        email_verified: true,
        phone_verified: false,
        profile_completed: true,
      };

      // Only add image URL if upload was successful
      if (imageUrl) {
        updateData.id_card_image_url = imageUrl;
      }

      console.log('📝 Updating user profile with:', {
        id: currentUser.id,
        hasHash: !!updateData.id_card_hash,
        hasBarcode: !!updateData.id_card_barcode,
        id_card_verified: updateData.id_card_verified,
        email_verified: updateData.email_verified,
        profile_completed: updateData.profile_completed,
        hasImageUrl: !!updateData.id_card_image_url,
      });

      // Update user profile with ID card data and verification status
      const { error: updateError, data: updateDataResult } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', currentUser.id)
        .select();

      if (updateError) {
        console.error('❌ Error updating user profile:', updateError);
        toast({
          title: 'Error',
          description: `Failed to update profile: ${updateError.message}. Please contact support.`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      console.log('✅ Profile updated successfully:', updateDataResult);

      // Refresh profile again to ensure latest data is loaded
      await refreshProfile();
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: 'Account Created! ✅',
        description: 'Your account has been created successfully. Redirecting to dashboard...',
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('❌ Account creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const getStepNumber = (currentStep: RegistrationStep) => {
    const steps: RegistrationStep[] = ['id-card', 'email', 'email-otp', 'complete'];
    return steps.indexOf(currentStep) + 1;
  };

  const getTotalSteps = () => {
    return 4; // ID Card, Email, Email OTP, Complete
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-background/80">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-white flex items-center gap-2">
              <User className="w-8 h-8" />
              Create Your Account
            </CardTitle>
            <CardDescription className="text-white/70">
              Step {getStepNumber(step)} of {getTotalSteps()}: {
                step === 'id-card' && 'Upload ID Card'
              }
              {step === 'email' && 'Enter Email'
              }
              {step === 'email-otp' && 'Verify Email'
              }
              {step === 'complete' && 'Create Account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-6">
              {[
                { step: 'id-card', label: 'ID Card', verify: null },
                { step: 'email', label: 'Email', verify: 'email-otp' },
                { step: 'complete', label: 'Account', verify: null },
              ].map((s, index) => {
                const stepIndex = getStepNumber(step as RegistrationStep);
                const displayIndex = index + 1;
                
                // Check if this step is completed
                let isCompleted = false;
                if (s.step === 'id-card') {
                  isCompleted = stepIndex > getStepNumber('id-card');
                } else if (s.step === 'email') {
                  isCompleted = stepIndex > getStepNumber('email-otp');
                } else if (s.step === 'complete') {
                  isCompleted = stepIndex >= getStepNumber('complete');
                }
                
                // Check if this step is current
                const isCurrent = 
                  step === s.step || 
                  (s.verify && step === s.verify);
                
                return (
                  <div key={s.step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          isCompleted
                            ? 'bg-primary border-primary text-white'
                            : isCurrent
                            ? 'bg-primary border-primary text-white'
                            : 'bg-white/10 border-white/30 text-white/50'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          displayIndex
                        )}
                      </div>
                      <span className="text-xs text-white/70 mt-2 text-center">
                        {s.label}
                      </span>
                    </div>
                    {index < 2 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 ${
                          isCompleted ? 'bg-primary' : 'bg-white/20'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 1: ID Card Verification */}
            {step === 'id-card' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/20 border border-primary/30 mb-4">
                  <p className="text-sm text-white/90">
                    <strong>Step 1: Verify Your ID Card</strong>
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    Upload your ID card image. We'll scan the barcode to verify it's unique and hasn't been used before.
                  </p>
                </div>
                
                <IDCardScanner
                  onVerified={handleIDCardVerified}
                  onCancel={() => navigate('/')}
                />
              </div>
            )}

            {/* Step 2: Email Entry */}
            {step === 'email' && (
              <>
                <div className="p-4 rounded-lg bg-success/20 border border-success/30 mb-4">
                  <p className="text-sm text-white/90">
                    <strong>✅ ID Card Verified!</strong>
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    Your ID card barcode is unique. Now verify your email address.
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-white/50">
                      We'll send a verification code to this email address
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        Send OTP to Email
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* Step 3: Email OTP Verification */}
            {step === 'email-otp' && (
              <div className="space-y-4">
                <OTPVerification
                  identifier={email}
                  otpType="email"
                  onVerified={handleEmailOTPVerified}
                  onCancel={() => setStep('email')}
                />
              </div>
            )}
            
            {/* Step 4: Account Creation Form */}
            {step === 'complete' && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-success/20 border border-success/30">
                  <div className="flex items-center gap-2 text-success mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Verifications Complete!</span>
                  </div>
                  <div className="text-sm text-white/70 space-y-1">
                    <p>✅ ID Card: Barcode verified and unique</p>
                    <p>✅ Email: {email}</p>
                  </div>
                  <p className="text-sm text-white/90 mt-3 font-medium">
                    Now create your account with a password
                  </p>
                </div>

                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">
                      Confirm Password *
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                    disabled={loading || !fullName || !password || password !== confirmPassword || password.length < 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account & Complete Registration
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
