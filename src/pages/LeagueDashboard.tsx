import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { League, Game, RefereeWithStats } from '@/types';
import { mockLeaguesApi, mockGamesApi, mockRefsApi, mockAiApi } from '@/services/mockApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Sparkles, Search } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import CreateGameForm from '@/components/league/CreateGameForm';
import GamesList from '@/components/league/GamesList';
import RefSearch from '@/components/league/RefSearch';
import AIAssignor from '@/components/league/AIAssignor';
import { useToast } from '@/hooks/use-toast';

export default function LeagueDashboard() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [league, setLeague] = useState<League | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      try {
        const [leagueData, gamesData] = await Promise.all([
          mockLeaguesApi.getProfile(token),
          mockGamesApi.list(token),
        ]);

        setLeague(leagueData);
        setGames(gamesData);
      } catch (error) {
        toast({
          title: 'Error loading data',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [token, toast]);

  const handleCreateGame = async (data: Omit<Game, 'id' | 'league_id' | 'status'>) => {
    if (!token) return;

    try {
      const newGame = await mockGamesApi.create(token, data);
      setGames([...games, newGame]);
      toast({
        title: 'Game created',
        description: 'Your game has been added to the schedule.',
      });
    } catch (error) {
      toast({
        title: 'Error creating game',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRequestRef = async (gameId: number, refereeId: number, role: 'center' | 'ar') => {
    if (!token) return;

    try {
      await mockGamesApi.requestRef(token, gameId, refereeId, role);
      // Refresh games list
      const updatedGames = await mockGamesApi.list(token);
      setGames(updatedGames);
      toast({
        title: 'Request sent',
        description: 'The referee has been notified of your request.',
      });
    } catch (error) {
      toast({
        title: 'Error requesting referee',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSearchRefs = async (params: any): Promise<RefereeWithStats[]> => {
    if (!token) return [];
    return mockRefsApi.search(params);
  };

  const handleAISearch = async (query: string, gameId?: number) => {
    if (!token) return null;
    return mockAiApi.findRef(token, { natural_language_query: query, game_id: gameId });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const openGames = games.filter((g) => g.status === 'open').length;
  const pendingGames = games.filter((g) => g.status === 'pending_assignment').length;
  const assignedGames = games.filter((g) => g.status === 'assigned' || g.status === 'completed').length;

  return (
    <MainLayout>
      <div className="container py-8 animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">{league?.name || 'League Dashboard'}</h1>
          <p className="page-description">
            Manage games, find referees, and use AI to match the best refs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="stat-value">{openGames}</p>
                  <p className="stat-label">Open Games</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-warning/10">
                  <Users className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="stat-value">{pendingGames}</p>
                  <p className="stat-label">Pending Assignment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10">
                  <Sparkles className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="stat-value">{assignedGames}</p>
                  <p className="stat-label">Assigned/Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="ai">AI Assignor</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="animate-slide-in">
            <Card>
              <CardHeader>
                <CardTitle>My Games</CardTitle>
                <CardDescription>
                  View and manage your scheduled games
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GamesList games={games} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="animate-slide-in">
            <Card>
              <CardHeader>
                <CardTitle>Create Game</CardTitle>
                <CardDescription>
                  Add a new game to your schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateGameForm onSubmit={handleCreateGame} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="animate-slide-in">
            <Card>
              <CardHeader>
                <CardTitle>Find Referees</CardTitle>
                <CardDescription>
                  Search for available referees by location, rating, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RefSearch
                  games={games.filter((g) => g.status === 'open')}
                  onSearch={handleSearchRefs}
                  onRequest={handleRequestRef}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="animate-slide-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Assignor
                </CardTitle>
                <CardDescription>
                  Describe what you need in natural language and let AI find the best matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIAssignor
                  games={games.filter((g) => g.status === 'open')}
                  onSearch={handleAISearch}
                  onRequest={handleRequestRef}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
