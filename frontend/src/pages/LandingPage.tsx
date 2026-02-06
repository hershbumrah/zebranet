import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Shield, 
  Users, 
  Calendar, 
  Sparkles, 
  Star, 
  MapPin, 
  CheckCircle2,
  ArrowRight 
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  const dashboardLink = user?.role === 'ref' ? '/referee' : '/league';

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              The Modern Platform for{' '}
              <span className="text-primary">Soccer Referee</span> Management
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              RefNexus connects leagues with qualified referees using smart matching and AI-powered assignments. 
              Simplify scheduling, track performance, and build better games.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to={dashboardLink}>
                  <Button size="lg" className="gap-2">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="gap-2">
                      Get Started Free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're a referee looking for games or a league managing assignments, 
              RefNexus has the tools you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="p-3 rounded-full bg-primary/10 w-fit mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Referee Profiles</h3>
                <p className="text-muted-foreground text-sm">
                  Build your professional profile with certifications, experience, and availability. 
                  Get discovered by leagues looking for quality officials.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="p-3 rounded-full bg-primary/10 w-fit mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Smart Scheduling</h3>
                <p className="text-muted-foreground text-sm">
                  Manage availability, accept or decline assignments, and keep track of your 
                  upcoming games all in one place.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="p-3 rounded-full bg-primary/10 w-fit mb-4">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Ratings & Reviews</h3>
                <p className="text-muted-foreground text-sm">
                  Build your reputation with ratings from leagues. Higher ratings mean more 
                  opportunities and better assignments.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="p-3 rounded-full bg-primary/10 w-fit mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Location Matching</h3>
                <p className="text-muted-foreground text-sm">
                  Find referees within your specified radius. Set travel preferences and get 
                  matched with nearby games.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="p-3 rounded-full bg-primary/10 w-fit mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">AI-Powered Matching</h3>
                <p className="text-muted-foreground text-sm">
                  Describe your needs in plain English and let AI find the perfect referee. 
                  Smart matching considers ratings, location, and availability.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="p-3 rounded-full bg-primary/10 w-fit mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">League Management</h3>
                <p className="text-muted-foreground text-sm">
                  Create games, track assignments, and manage your referee pool. 
                  Keep notes and build relationships with reliable officials.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Referees / For Leagues Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* For Referees */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Shield className="h-4 w-4" />
                For Referees
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                Get More Games, Build Your Career
              </h3>
              <ul className="space-y-4">
                {[
                  'Create a professional profile showcasing your certifications',
                  'Set your availability and travel radius',
                  'Receive assignment requests directly from leagues',
                  'Track your games, ratings, and performance over time',
                  'Build reputation and get better assignments',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated && (
                <Link to="/register">
                  <Button variant="outline" className="gap-2">
                    Register as Referee
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>

            {/* For Leagues */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Users className="h-4 w-4" />
                For Leagues
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                Find the Right Referee, Every Time
              </h3>
              <ul className="space-y-4">
                {[
                  'Search referees by location, rating, and certification',
                  'Use AI to describe your needs and get smart matches',
                  'Create and manage games with full scheduling tools',
                  'Rate referees and keep private notes for future reference',
                  'Track assignment history and build your referee network',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              {!isAuthenticated && (
                <Link to="/register">
                  <Button variant="outline" className="gap-2">
                    Register as League
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join RefNexus today and experience the modern way to manage soccer officiating. 
            It's free to get started.
          </p>
          {isAuthenticated ? (
            <Link to={dashboardLink}>
              <Button size="lg" variant="secondary" className="gap-2">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Create Your Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-card">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">RefNexus</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} RefNexus. Soccer referee management made simple.
            </p>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
}
