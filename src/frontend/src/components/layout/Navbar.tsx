import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Menu, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useEffect, useRef, useState } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardLink = user?.role === 'referee' ? '/referee' : '/league';

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://` +
      `${window.location.hostname}:8000/messages/ws/inbox?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'unread' && typeof data.unread_count === 'number') {
          setUnreadCount(data.unread_count);
        }
      } catch {
        // ignore malformed
      }
    };

    ws.onclose = () => {
      socketRef.current = null;
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">Refium</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link
                to={dashboardLink}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/inbox"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  Inbox
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="max-w-[150px] truncate">{user?.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="text-muted-foreground">
                    Role: {user?.role === 'referee' ? 'Referee' : 'League'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-4 mt-8">
              {isAuthenticated ? (
                <>
                  <div className="px-2 py-4 border-b">
                    <p className="text-sm text-muted-foreground">Signed in as</p>
                    <p className="font-medium truncate">{user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user?.role === 'referee' ? 'Referee' : 'League'}
                    </p>
                  </div>
                  <Link
                    to={dashboardLink}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2 py-2 text-foreground hover:bg-accent rounded-md"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/inbox"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2 py-2 text-foreground hover:bg-accent rounded-md"
                  >
                    <span className="inline-flex items-center gap-2">
                      Inbox
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-2 py-2 text-destructive hover:bg-accent rounded-md text-left"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2 py-2 text-foreground hover:bg-accent rounded-md"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
