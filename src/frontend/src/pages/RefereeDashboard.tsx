import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RefereeProfile, RefereeStats, Assignment, AvailabilitySlot } from '@/types';
import { mockRefsApi } from '@/services/mockApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Calendar, Clipboard, Trophy } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import RefProfileForm from '@/components/referee/RefProfileForm';
import RefAvailability from '@/components/referee/RefAvailability';
import RefAssignments from '@/components/referee/RefAssignments';
import ChatBox from '@/components/ChatBox';
import { useToast } from '@/hooks/use-toast';

export default function RefereeDashboard() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<RefereeProfile | null>(null);
  const [stats, setStats] = useState<RefereeStats | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      try {
        const [profileData, assignmentsData, availabilityData] = await Promise.all([
          mockRefsApi.getProfile(token),
          mockRefsApi.getAssignments(token),
          mockRefsApi.getAvailability(token),
        ]);

        setProfile(profileData);
        setAssignments(assignmentsData);
        setAvailability(availabilityData);

        if (profileData) {
          const statsData = await mockRefsApi.getStats(profileData.id);
          setStats(statsData);
        }
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

  const handleProfileUpdate = async (data: Partial<RefereeProfile>) => {
    if (!token) return;

    try {
      const updated = await mockRefsApi.updateProfile(token, data);
      setProfile(updated);
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error updating profile',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddAvailability = async (startTime: string, endTime: string) => {
    if (!token) return;

    try {
      const newSlot = await mockRefsApi.addAvailability(token, startTime, endTime);
      setAvailability([...availability, newSlot]);
      toast({
        title: 'Availability added',
        description: 'Your availability slot has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error adding availability',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAvailability = async (slotId: number) => {
    if (!token) return;

    try {
      await mockRefsApi.deleteAvailability(token, slotId);
      setAvailability(availability.filter((a) => a.id !== slotId));
      toast({
        title: 'Availability removed',
        description: 'The slot has been deleted.',
      });
    } catch (error) {
      toast({
        title: 'Error removing availability',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRespondToAssignment = async (assignmentId: number, response: 'accepted' | 'declined') => {
    if (!token) return;

    try {
      const updated = await mockRefsApi.respondToAssignment(token, assignmentId, response);
      setAssignments(assignments.map((a) => (a.id === assignmentId ? { ...a, ...updated } : a)));
      toast({
        title: response === 'accepted' ? 'Assignment accepted' : 'Assignment declined',
        description: response === 'accepted' ? 'You\'ve been assigned to this game.' : 'The assignment has been declined.',
      });
    } catch (error) {
      toast({
        title: 'Error responding to assignment',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">
            {profile?.full_name ? `Welcome, ${profile.full_name}` : 'Referee Dashboard'}
          </h1>
          <p className="page-description">
            Manage your profile, availability, and game assignments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="stat-value">{stats?.total_games || 0}</p>
                  <p className="stat-label">Games Reffed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-warning/10">
                  <Star className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="stat-value">
                    {stats?.average_rating ? stats.average_rating.toFixed(1) : '—'}
                  </p>
                  <p className="stat-label">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10">
                  <Calendar className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="stat-value">{availability.length}</p>
                  <p className="stat-label">Availability Slots</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent">
                  <Clipboard className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="stat-value">
                    {assignments.filter((a) => a.status === 'requested').length}
                  </p>
                  <p className="stat-label">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="animate-slide-in">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your referee profile and certifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RefProfileForm
                  profile={profile}
                  onSave={handleProfileUpdate}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="animate-slide-in">
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
                <CardDescription>
                  Set your available times for assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RefAvailability
                  slots={availability}
                  onAdd={handleAddAvailability}
                  onDelete={handleDeleteAvailability}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="animate-slide-in">
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>
                  View and respond to game assignment requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RefAssignments
                  assignments={assignments}
                  onRespond={handleRespondToAssignment}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Assistant */}
        <div className="mt-6">
          <ChatBox />
        </div>
      </div>
    </MainLayout>
  );
}
