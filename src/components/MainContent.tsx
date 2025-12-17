import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Users, Briefcase, MessageCircle, ShoppingBag, Calendar } from 'lucide-react';
import CommunityFeed from './CommunityFeed';
import GroupsSection from './GroupsSection';
import BusinessDirectory from './BusinessDirectory';
import MessagesSection from './MessagesSection';
import FaithCentersSection from './FaithCentersSection';
import Marketplace from './Marketplace';
import EventsSection from './EventsSection';

interface MainContentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MainContent({ activeTab, onTabChange }: MainContentProps) {
  return (
    <main className="flex-1 container py-6">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full max-w-5xl mx-auto grid-cols-7 mb-6 bg-card/50 backdrop-blur">
          <TabsTrigger value="feed" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Feed</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Groups</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Business</span>
          </TabsTrigger>
          <TabsTrigger value="faith" className="flex items-center gap-2">
            <img src="/assets/generated/church-icon.dim_64x64.png" alt="Faith" className="h-4 w-4" />
            <span className="hidden sm:inline">Faith</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Market</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-0">
          <CommunityFeed />
        </TabsContent>

        <TabsContent value="groups" className="mt-0">
          <GroupsSection />
        </TabsContent>

        <TabsContent value="business" className="mt-0">
          <BusinessDirectory />
        </TabsContent>

        <TabsContent value="faith" className="mt-0">
          <FaithCentersSection />
        </TabsContent>

        <TabsContent value="events" className="mt-0">
          <EventsSection />
        </TabsContent>

        <TabsContent value="marketplace" className="mt-0">
          <Marketplace />
        </TabsContent>

        <TabsContent value="messages" className="mt-0">
          <MessagesSection />
        </TabsContent>
      </Tabs>
    </main>
  );
}
