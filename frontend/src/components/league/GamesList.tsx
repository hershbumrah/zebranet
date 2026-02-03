import { Game } from '@/types';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface GamesListProps {
  games: Game[];
}

const STATUS_STYLES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  open: { variant: 'outline', label: 'Open' },
  pending_assignment: { variant: 'secondary', label: 'Pending' },
  assigned: { variant: 'default', label: 'Assigned' },
  completed: { variant: 'default', label: 'Completed' },
};

export default function GamesList({ games }: GamesListProps) {
  if (games.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No games scheduled yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first game to get started.
        </p>
      </div>
    );
  }

  // Sort games by date
  const sortedGames = [...games].sort(
    (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedGames.map((game) => {
        const statusInfo = STATUS_STYLES[game.status] || STATUS_STYLES.open;
        const gameDate = new Date(game.scheduled_start);

        return (
          <div
            key={game.id}
            className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  <Badge variant="outline">{game.age_group}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {game.competition_level}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{game.location}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{format(gameDate, 'EEE, MMM d, yyyy • h:mm a')}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">{game.center_fee}</span>
                    <span className="text-muted-foreground">center</span>
                  </div>
                  <div className="flex items-center gap-1 text-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">{game.ar_fee}</span>
                    <span className="text-muted-foreground">AR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
