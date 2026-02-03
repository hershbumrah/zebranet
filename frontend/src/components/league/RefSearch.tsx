import { useState } from 'react';
import { Game, RefereeWithStats, RefSearchParams } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, MapPin, Award } from 'lucide-react';
import RefCard from './RefCard';

interface RefSearchProps {
  games: Game[];
  onSearch: (params: RefSearchParams) => Promise<RefereeWithStats[]>;
  onRequest: (gameId: number, refereeId: number, role: 'center' | 'ar') => Promise<void>;
}

export default function RefSearch({ games, onSearch, onRequest }: RefSearchProps) {
  const [location, setLocation] = useState('');
  const [radiusKm, setRadiusKm] = useState(50);
  const [minRating, setMinRating] = useState(0);
  const [results, setResults] = useState<RefereeWithStats[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setHasSearched(true);

    try {
      const refs = await onSearch({
        location,
        radius_km: radiusKm,
        min_rating: minRating > 0 ? minRating : undefined,
      });
      setResults(refs);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4 p-4 border rounded-lg bg-muted/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or ZIP code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="radius">Radius (km)</Label>
            <Input
              id="radius"
              type="number"
              min={5}
              max={200}
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value) || 50)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minRating">Min Rating</Label>
            <Select
              value={String(minRating)}
              onValueChange={(value) => setMinRating(parseFloat(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any rating</SelectItem>
                <SelectItem value="3">3+ stars</SelectItem>
                <SelectItem value="4">4+ stars</SelectItem>
                <SelectItem value="4.5">4.5+ stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="game">Assign to Game</Label>
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger>
                <SelectValue placeholder="Select game" />
              </SelectTrigger>
              <SelectContent>
                {games.map((game) => (
                  <SelectItem key={game.id} value={String(game.id)}>
                    {game.age_group} @ {game.location.split(',')[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" disabled={isSearching}>
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? 'Searching...' : 'Search Referees'}
        </Button>
      </form>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">
            {results.length} referee{results.length !== 1 ? 's' : ''} found
          </h4>

          {results.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No referees match your criteria. Try adjusting your search.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((ref) => (
                <RefCard
                  key={ref.id}
                  referee={ref}
                  selectedGame={selectedGame ? parseInt(selectedGame) : undefined}
                  onRequest={onRequest}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
