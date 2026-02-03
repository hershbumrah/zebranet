import { useState } from 'react';
import { RefereeProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RefProfileFormProps {
  profile: RefereeProfile | null;
  onSave: (data: Partial<RefereeProfile>) => Promise<void>;
}

const CERT_LEVELS = [
  'Grade 9',
  'Grade 8',
  'Grade 7',
  'Grade 6',
  'Grade 5',
  'Grade 4',
  'National',
  'FIFA',
];

const POSITIONS = [
  { value: 'center', label: 'Center Referee' },
  { value: 'ar', label: 'Assistant Referee' },
  { value: 'center, ar', label: 'Both Center & AR' },
];

export default function RefProfileForm({ profile, onSave }: RefProfileFormProps) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    cert_level: profile?.cert_level || '',
    years_experience: profile?.years_experience || 0,
    primary_positions: profile?.primary_positions || 'center, ar',
    home_location: profile?.home_location || '',
    travel_radius_km: profile?.travel_radius_km || 25,
    bio: profile?.bio || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="John Smith"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cert_level">Certification Level</Label>
          <Select
            value={formData.cert_level}
            onValueChange={(value) => setFormData({ ...formData, cert_level: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select certification" />
            </SelectTrigger>
            <SelectContent>
              {CERT_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="years_experience">Years of Experience</Label>
          <Input
            id="years_experience"
            type="number"
            min={0}
            max={50}
            value={formData.years_experience}
            onChange={(e) =>
              setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary_positions">Primary Positions</Label>
          <Select
            value={formData.primary_positions}
            onValueChange={(value) => setFormData({ ...formData, primary_positions: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select positions" />
            </SelectTrigger>
            <SelectContent>
              {POSITIONS.map((pos) => (
                <SelectItem key={pos.value} value={pos.value}>
                  {pos.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="home_location">Home Location</Label>
          <Input
            id="home_location"
            value={formData.home_location}
            onChange={(e) => setFormData({ ...formData, home_location: e.target.value })}
            placeholder="City, State (e.g., Edison, NJ)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="travel_radius_km">Travel Radius (km)</Label>
          <Input
            id="travel_radius_km"
            type="number"
            min={5}
            max={200}
            value={formData.travel_radius_km}
            onChange={(e) =>
              setFormData({ ...formData, travel_radius_km: parseInt(e.target.value) || 25 })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Tell leagues about your experience, specialties, and what makes you a great referee..."
          rows={4}
        />
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
