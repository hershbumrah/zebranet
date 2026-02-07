import { useState } from 'react';
import { Game } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateGameFormProps {
  onSubmit: (data: Omit<Game, 'id' | 'league_id' | 'status'>) => Promise<void>;
}

const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'Adult'];
const COMPETITION_LEVELS = ['recreational', 'travel', 'premier', 'semi-pro', 'professional'];

export default function CreateGameForm({ onSubmit }: CreateGameFormProps) {
  const [formData, setFormData] = useState({
    location: '',
    date: '',
    time: '',
    age_group: '',
    competition_level: '',
    center_fee: 65,
    ar_fee: 45,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const scheduled_start = new Date(`${formData.date}T${formData.time}:00`).toISOString();
      await onSubmit({
        location: formData.location,
        scheduled_start,
        age_group: formData.age_group,
        competition_level: formData.competition_level,
        center_fee: formData.center_fee,
        ar_fee: formData.ar_fee,
      });

      // Reset form
      setFormData({
        location: '',
        date: '',
        time: '',
        age_group: '',
        competition_level: '',
        center_fee: 65,
        ar_fee: 45,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Field name, address, or venue"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Kickoff Time</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="age_group">Age Group</Label>
          <Select
            value={formData.age_group}
            onValueChange={(value) => setFormData({ ...formData, age_group: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select age group" />
            </SelectTrigger>
            <SelectContent>
              {AGE_GROUPS.map((age) => (
                <SelectItem key={age} value={age}>
                  {age}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="competition_level">Competition Level</Label>
          <Select
            value={formData.competition_level}
            onValueChange={(value) => setFormData({ ...formData, competition_level: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {COMPETITION_LEVELS.map((level) => (
                <SelectItem key={level} value={level} className="capitalize">
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="center_fee">Center Referee Fee ($)</Label>
          <Input
            id="center_fee"
            type="number"
            min={0}
            value={formData.center_fee}
            onChange={(e) => setFormData({ ...formData, center_fee: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ar_fee">Assistant Referee Fee ($)</Label>
          <Input
            id="ar_fee"
            type="number"
            min={0}
            value={formData.ar_fee}
            onChange={(e) => setFormData({ ...formData, ar_fee: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Game'}
      </Button>
    </form>
  );
}
