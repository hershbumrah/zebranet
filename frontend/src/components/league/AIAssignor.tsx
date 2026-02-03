import { useState } from 'react';
import { Game, FindRefResult, RefereeWithStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import RefCard from './RefCard';

interface AIAssignorProps {
  games: Game[];
  onSearch: (query: string, gameId?: number) => Promise<FindRefResult | null>;
  onRequest: (gameId: number, refereeId: number, role: 'center' | 'ar') => Promise<void>;
}

export default function AIAssignor({ games, onSearch, onRequest }: AIAssignorProps) {
  const [query, setQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [result, setResult] = useState<FindRefResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const gameId = selectedGame ? parseInt(selectedGame) : undefined;
      const searchResult = await onSearch(query, gameId);
      setResult(searchResult);
    } finally {
      setIsSearching(false);
    }
  };

  const exampleQueries = [
    "Find the best center ref for a U15 boys match in Edison, NJ at 7pm on March 15, high rating preferred",
    "I need an experienced AR for a travel game in Newark this Saturday morning",
    "Looking for a Grade 5 or better ref who can travel up to 30 miles for a semi-pro match",
  ];

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="aiQuery">Describe what you need</Label>
          <Textarea
            id="aiQuery"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Find the best center ref for a U15 boys match in Edison, NJ at 7pm on March 15, high rating and okay to travel up to 25 miles..."
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Include details like location, date/time, age group, competition level, preferred certification, and any other requirements.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aiGame">Assign to Game (optional)</Label>
          <Select value={selectedGame} onValueChange={setSelectedGame}>
            <SelectTrigger>
              <SelectValue placeholder="Select a game to assign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No specific game</SelectItem>
              {games.map((game) => (
                <SelectItem key={game.id} value={String(game.id)}>
                  {game.age_group} @ {game.location.split(',')[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              AI is thinking...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Ask AI
            </>
          )}
        </Button>
      </form>

      {/* Example Queries */}
      {!result && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, i) => (
              <button
                key={i}
                onClick={() => setQuery(example)}
                className="text-xs text-left px-3 py-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
              >
                "{example.slice(0, 60)}..."
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-lg bg-accent/50 border">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Recommendation
            </h4>
            <p className="text-sm text-muted-foreground">{result.explanation}</p>
          </div>

          {result.suggested_refs && result.suggested_refs.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">
                {result.suggested_refs.length} matching referee{result.suggested_refs.length !== 1 ? 's' : ''}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.suggested_refs.map((ref) => (
                  <RefCard
                    key={ref.id}
                    referee={ref}
                    selectedGame={selectedGame ? parseInt(selectedGame) : undefined}
                    onRequest={onRequest}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
