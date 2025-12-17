import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn, Loader2, Users, Briefcase, MessageCircle, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Failed to connect. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/afroconnect-logo.dim_200x200.png"
              alt="AfroConnect"
              className="h-10 w-10"
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                AfroConnect
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Connecting Africans Globally</p>
            </div>
          </div>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting to Internet Identity...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <img
              src="/assets/generated/hero-banner.dim_1200x400.png"
              alt="AfroConnect Hero"
              className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
            />
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Welcome to AfroConnect
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A vibrant social platform connecting Africans globally through community, culture, and business.
            </p>
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8 py-6"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Connecting to Internet Identity...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Get Started
                </>
              )}
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6 text-center space-y-3">
                <img
                  src="/assets/generated/community-icon.dim_64x64.png"
                  alt="Community"
                  className="h-16 w-16 mx-auto"
                />
                <h3 className="text-lg font-semibold">Community Feed</h3>
                <p className="text-sm text-muted-foreground">
                  Share updates, photos, and connect with Africans worldwide through local and global feeds.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6 text-center space-y-3">
                <img
                  src="/assets/generated/groups-icon.dim_64x64.png"
                  alt="Groups"
                  className="h-16 w-16 mx-auto"
                />
                <h3 className="text-lg font-semibold">Interest Groups</h3>
                <p className="text-sm text-muted-foreground">
                  Join groups based on your interests, hobbies, or professional networks.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6 text-center space-y-3">
                <img
                  src="/assets/generated/business-icon.dim_64x64.png"
                  alt="Business"
                  className="h-16 w-16 mx-auto"
                />
                <h3 className="text-lg font-semibold">Business Directory</h3>
                <p className="text-sm text-muted-foreground">
                  Discover African-owned businesses, leave reviews, and explore products and services.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6 text-center space-y-3">
                <img
                  src="/assets/generated/church-icon.dim_64x64.png"
                  alt="Faith Centers"
                  className="h-16 w-16 mx-auto"
                />
                <h3 className="text-lg font-semibold">Faith Centers</h3>
                <p className="text-sm text-muted-foreground">
                  Find churches and mosques in your area with service times and contact information.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6 text-center space-y-3">
                <img
                  src="/assets/generated/marketplace-icon-transparent.dim_64x64.png"
                  alt="Marketplace"
                  className="h-16 w-16 mx-auto"
                />
                <h3 className="text-lg font-semibold">Marketplace</h3>
                <p className="text-sm text-muted-foreground">
                  Buy and sell items locally within your community with secure transactions.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6 text-center space-y-3">
                <img
                  src="/assets/generated/messages-icon-transparent.dim_64x64.png"
                  alt="Messages"
                  className="h-16 w-16 mx-auto"
                />
                <h3 className="text-lg font-semibold">Direct Messages</h3>
                <p className="text-sm text-muted-foreground">
                  Connect privately with other members through secure direct messaging.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-accent/10 to-primary/10">
            <CardContent className="pt-6 text-center space-y-4">
              <h3 className="text-2xl font-bold">Ready to Join the Community?</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Create your account with Internet Identity - a secure, privacy-focused authentication system. 
                No passwords to remember, just seamless access to AfroConnect.
              </p>
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Connecting to Internet Identity...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Create Account or Login
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto bg-background/50 backdrop-blur">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 AfroConnect. Built with ❤️ for the African diaspora.</p>
          <p className="mt-1">
            Powered by{' '}
            <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
