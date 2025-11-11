import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, User, Building, Calendar, Users, Briefcase, Camera, Mail, Phone } from 'lucide-react';
import { OTPVerification } from '@/components/OTPVerification';
import { IDCardScanner } from '@/components/IDCardScanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, userProfile, updateProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'profile' | 'otp' | 'id-card'>('profile');
  const [otpType, setOtpType] = useState<'email' | 'phone'>('email');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [idCardVerified, setIdCardVerified] = useState(false);
  const [formData, setFormData] = useState({
    user_type: '' as 'student' | 'teacher' | '',
    department: '',
    year: '',
    section: '',
    club: '',
  });

  useEffect(() => {
    // Redirect if already completed
    if (userProfile?.profile_completed) {
      navigate('/dashboard');
    }
  }, [userProfile, navigate]);

  // Common departments
  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
    'Chemical',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Business Administration',
    'Economics',
    'Other',
  ];

  // Years for students
  const years = ['1', '2', '3', '4', '5'];

  // Common sections
  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Common clubs
  const clubs = [
    'Computer Science Club',
    'Robotics Club',
    'Drama Club',
    'Music Club',
    'Sports Club',
    'Debate Club',
    'Photography Club',
    'Art Club',
    'None',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates: any = {
        user_type: formData.user_type,
        department: formData.department,
        profile_completed: true,
      };

      if (formData.user_type === 'student') {
        if (!formData.year || !formData.section) {
          toast({
            title: 'Validation Error',
            description: 'Please fill in all required fields for students',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        updates.year = parseInt(formData.year);
        updates.section = formData.section;
        updates.club = formData.club || null;
      } else if (formData.user_type === 'teacher') {
        if (!formData.department) {
          toast({
            title: 'Validation Error',
            description: 'Please select a department',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        // Teachers don't need year, section, or club
        updates.year = null;
        updates.section = null;
        updates.club = null;
      }

      const { error } = await updateProfile(updates);

      if (error) {
        throw error;
      }

      toast({
        title: 'Profile Completed!',
        description: 'Your profile has been successfully updated.',
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-card border-white/20">
          <CardContent className="p-6">
            <p className="text-white">Please log in to complete your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-white/70">
              Please provide your details to continue. This information helps us personalize your voting experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`flex items-center gap-2 ${step === 'profile' ? 'text-primary' : 'text-white/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'profile' ? 'bg-primary text-white' : 'bg-white/10 text-white/50'}`}>
                  1
                </div>
                <span className="text-sm">Profile</span>
              </div>
              <div className="w-8 h-0.5 bg-white/20"></div>
              <div className={`flex items-center gap-2 ${step === 'otp' ? 'text-primary' : step === 'id-card' ? 'text-white' : 'text-white/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'otp' || step === 'id-card' ? 'bg-primary text-white' : 'bg-white/10 text-white/50'}`}>
                  2
                </div>
                <span className="text-sm">Verification</span>
              </div>
              <div className="w-8 h-0.5 bg-white/20"></div>
              <div className={`flex items-center gap-2 ${step === 'id-card' ? 'text-primary' : 'text-white/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'id-card' ? 'bg-primary text-white' : 'bg-white/10 text-white/50'}`}>
                  3
                </div>
                <span className="text-sm">ID Card</span>
              </div>
            </div>

            {/* Profile Step */}
            {step === 'profile' && (
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type */}
              <div className="space-y-3">
                <Label className="text-white font-semibold flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  I am a:
                </Label>
                <RadioGroup
                  value={formData.user_type}
                  onValueChange={(value) => setFormData({ ...formData, user_type: value as 'student' | 'teacher' })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="student" className="border-white/30" />
                    <Label htmlFor="student" className="text-white cursor-pointer flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Student
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="teacher" id="teacher" className="border-white/30" />
                    <Label htmlFor="teacher" className="text-white cursor-pointer flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Teacher
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-white flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Department *
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/30 text-white">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-white/30">
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept} className="text-white">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student-specific fields */}
              {formData.user_type === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Year */}
                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Year *
                      </Label>
                      <Select
                        value={formData.year}
                        onValueChange={(value) => setFormData({ ...formData, year: value })}
                      >
                        <SelectTrigger className="bg-white/10 border-white/30 text-white">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/30">
                          {years.map((year) => (
                            <SelectItem key={year} value={year} className="text-white">
                              Year {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Section */}
                    <div className="space-y-2">
                      <Label htmlFor="section" className="text-white flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Section *
                      </Label>
                      <Select
                        value={formData.section}
                        onValueChange={(value) => setFormData({ ...formData, section: value })}
                      >
                        <SelectTrigger className="bg-white/10 border-white/30 text-white">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-white/30">
                          {sections.map((section) => (
                            <SelectItem key={section} value={section} className="text-white">
                              Section {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Club (Optional for students) */}
                  <div className="space-y-2">
                    <Label htmlFor="club" className="text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Club (Optional)
                    </Label>
                    <Select
                      value={formData.club}
                      onValueChange={(value) => setFormData({ ...formData, club: value })}
                    >
                      <SelectTrigger className="bg-white/10 border-white/30 text-white">
                        <SelectValue placeholder="Select your club (optional)" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/30">
                        {clubs.map((club) => (
                          <SelectItem key={club} value={club} className="text-white">
                            {club}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                  disabled={loading || !formData.user_type || !formData.department}
                >
                  {loading ? 'Saving...' : 'Continue to Verification'}
                </Button>
              </form>
            )}

            {/* OTP Verification Step */}
            {step === 'otp' && (
              <div className="space-y-4">
                <OTPVerification
                  identifier={otpType === 'email' ? userProfile?.email || '' : userProfile?.phone || ''}
                  otpType={otpType}
                  onVerified={() => handleOTPVerified(otpType)}
                  onCancel={() => setStep('profile')}
                />
                {emailVerified && !phoneVerified && userProfile?.phone && (
                  <Button
                    onClick={() => setOtpType('phone')}
                    variant="outline"
                    className="w-full border-white/30 text-white hover:bg-white/10"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Verify Phone Number
                  </Button>
                )}
                {(emailVerified && (phoneVerified || !userProfile?.phone)) && (
                  <Button
                    onClick={() => setStep('id-card')}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Continue to ID Card Verification
                  </Button>
                )}
              </div>
            )}

            {/* ID Card Verification Step */}
            {step === 'id-card' && (
              <div className="space-y-4">
                <IDCardScanner
                  onVerified={handleIDCardVerified}
                  onCancel={() => setStep('otp')}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;
