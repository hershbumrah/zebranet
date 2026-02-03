import { Assignment } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface RefAssignmentsProps {
  assignments: Assignment[];
  onRespond: (assignmentId: number, response: 'accepted' | 'declined') => Promise<void>;
}

const STATUS_STYLES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  requested: { variant: 'outline', label: 'Pending' },
  accepted: { variant: 'default', label: 'Accepted' },
  declined: { variant: 'destructive', label: 'Declined' },
  cancelled: { variant: 'secondary', label: 'Cancelled' },
};

export default function RefAssignments({ assignments, onRespond }: RefAssignmentsProps) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No assignments yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          When leagues request you for games, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const game = assignment.game;
        const statusInfo = STATUS_STYLES[assignment.status] || STATUS_STYLES.requested;

        return (
          <div
            key={assignment.id}
            className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {assignment.role === 'ar' ? 'Assistant Referee' : 'Center Referee'}
                  </Badge>
                </div>

                {game && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{game.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(game.scheduled_start), 'EEE, MMM d, yyyy • h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {game.age_group} • {game.competition_level}
                      </span>
                      <span className="flex items-center gap-1 text-success">
                        <DollarSign className="h-4 w-4" />
                        {assignment.role === 'center' ? game.center_fee : game.ar_fee}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {assignment.status === 'requested' && (
                <div className="flex gap-2 sm:flex-col">
                  <Button
                    size="sm"
                    onClick={() => onRespond(assignment.id, 'accepted')}
                    className="flex-1 sm:flex-none"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRespond(assignment.id, 'declined')}
                    className="flex-1 sm:flex-none"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
