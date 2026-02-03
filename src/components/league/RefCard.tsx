import { RefereeWithStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Award, Trophy } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RefCardProps {
  referee: RefereeWithStats;
  selectedGame?: number;
  onRequest: (gameId: number, refereeId: number, role: 'center' | 'ar') => Promise<void>;
}

export default function RefCard({ referee, selectedGame, onRequest }: RefCardProps) {
  const handleRequest = async (role: 'center' | 'ar') => {
    if (!selectedGame) return;
    await onRequest(selectedGame, referee.id, role);
  };

  return (
    <div className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-lg">{referee.full_name || 'Unnamed Referee'}</h4>
            <Badge variant="secondary">{referee.cert_level || 'Uncertified'}</Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {referee.home_location || 'Location not set'}
            </span>
            <span className="flex items-center gap-1">
              <Award className="h-3.5 w-3.5" />
              {referee.years_experience} yrs
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-warning fill-warning" />
              <span className="font-medium">
                {referee.stats?.average_rating
                  ? referee.stats.average_rating.toFixed(1)
                  : '—'}
              </span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              {referee.stats?.total_games || 0} games
            </span>
          </div>

          {referee.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">{referee.bio}</p>
          )}
        </div>

        {selectedGame && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">Request</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleRequest('center')}>
                As Center Referee
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRequest('ar')}>
                As Assistant Referee
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
