import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';
import { UserRole } from '@/types';

const experienceOptions = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Adult', 'Advanced'];

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('referee');
  const [leagueName, setLeagueName] = useState('');
  const [primaryRegion, setPrimaryRegion] = useState('');
  const [refName, setRefName] = useState('');
  const [refLocation, setRefLocation] = useState('');
  const [refExperience, setRefExperience] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (role === 'league' && !leagueName) {
      toast({
        title: 'League name required',
        description: 'Please enter your league name.',
        variant: 'destructive',
      });
      return;
    }

    if (role === 'referee') {
      if (!refName) {
        toast({
          title: 'Name required',
          description: 'Please enter your full name.',
          variant: 'destructive',
        });
        return;
      }
      if (!refLocation) {
        toast({
          title: 'Location required',
          description: 'Please enter your home location.',
          variant: 'destructive',
        });
        return;
      }
      if (!refExperience) {
        toast({
          title: 'Experience level required',
          description: 'Please select your experience level.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const extraData =
        role === 'league'
          ? {
              name: leagueName,
              primary_region: primaryRegion,
            }
          : {
              name: refName,
              home_location: refLocation,
              cert_level: refExperience,
            };
      await register(email, password, role, extraData, profileImageFile);
      toast({
        title: 'Account created!',
        description: 'Welcome to Refium.',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-foreground">Refium</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Choose your role and enter your details
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>I am a...</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="referee" id="referee" className="peer sr-only" />
                    <Label
                      htmlFor="referee"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="text-lg font-semibold">Referee</span>
                      <span className="text-xs text-muted-foreground">Officiate games</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="league" id="league" className="peer sr-only" />
                    <Label
                      htmlFor="league"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="text-lg font-semibold">League</span>
                      <span className="text-xs text-muted-foreground">Manage games</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {role === 'referee' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="refName">Full Name</Label>
                    <Input
                      id="refName"
                      placeholder="Alex Morgan"
                      value={refName}
                      onChange={(e) => setRefName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refLocation">Home Location</Label>
                    <Input
                      id="refLocation"
                      placeholder="e.g., Austin, TX"
                      value={refLocation}
                      onChange={(e) => setRefLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refExperience">Certification / Age Group</Label>
                    <Select value={refExperience} onValueChange={setRefExperience}>
                      <SelectTrigger id="refExperience">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {role === 'league' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="leagueName">League Name</Label>
                    <Input
                      id="leagueName"
                      placeholder="Central Soccer League"
                      value={leagueName}
                      onChange={(e) => setLeagueName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryRegion">Primary Region</Label>
                    <Input
                      id="primaryRegion"
                      placeholder="e.g., Central New Jersey"
                      value={primaryRegion}
                      onChange={(e) => setPrimaryRegion(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="profileImageUpload">Profile Picture</Label>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border bg-muted">
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Profile preview" className="h-full w-full" />
                    ) : null}
                  </div>
                  <Input
                    id="profileImageUpload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setProfileImageFile(file);
                      setProfileImagePreview(file ? URL.createObjectURL(file) : '');
                    }}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
