import { useState } from 'react';
import { AvailabilitySlot } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface RefAvailabilityProps {
  slots: AvailabilitySlot[];
  onAdd: (startTime: string, endTime: string) => Promise<void>;
  onDelete: (slotId: number) => Promise<void>;
}

export default function RefAvailability({ slots, onAdd, onDelete }: RefAvailabilityProps) {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('18:00');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setIsAdding(true);
    try {
      const start = new Date(`${startDate}T${startTime}:00`).toISOString();
      const end = new Date(`${endDate}T${endTime}:00`).toISOString();
      await onAdd(start, end);
      setStartDate('');
      setEndDate('');
    } finally {
      setIsAdding(false);
    }
  };

  const formatSlot = (slot: AvailabilitySlot) => {
    const start = new Date(slot.start_time);
    const end = new Date(slot.end_time);
    const sameDay = format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd');

    if (sameDay) {
      return `${format(start, 'EEE, MMM d')} • ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    }
    return `${format(start, 'MMM d, h:mm a')} - ${format(end, 'MMM d, h:mm a')}`;
  };

  return (
    <div className="space-y-6">
      {/* Add Availability Form */}
      <form onSubmit={handleAdd} className="space-y-4 p-4 border rounded-lg bg-muted/30">
        <h4 className="font-medium flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Availability
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={isAdding} size="sm">
          {isAdding ? 'Adding...' : 'Add Slot'}
        </Button>
      </form>

      {/* Existing Slots */}
      <div className="space-y-3">
        <h4 className="font-medium">Your Availability</h4>
        {slots.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">
            No availability slots added yet. Add your available times above.
          </p>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatSlot(slot)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(slot.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
