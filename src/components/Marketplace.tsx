import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  MapPin,
  MessageCircle,
  Search,
  PackageSearch,
  DollarSign,
  Truck,
  MapPinned,
  Plus,
} from "lucide-react";

type MarketplaceProps = {
  onStartChat?: (title: string, prefillMessage?: string) => void;
};

type Listing = {
  id: number;
  title: string;
  businessName: string;
  category: string;
  city: string;
  state: string;
  country: string;
  priceLabel: string;
  description: string;
  isHomeBased: boolean;
};

const SAMPLE_LISTINGS: Listing[] = [
  {
    id: 1,
    title: "Authentic Ghanaian Meals",
    businessName: "Mama Efua’s Kitchen",
    category: "Food & Catering",
    city: "Aurora",
    state: "CO",
    country: "USA",
    priceLabel: "Plates from $15",
    description: "Home-cooked waakye, jollof, banku, and more. Pickup or delivery on weekends.",
    isHomeBased: true,
  },
  {
    id: 2,
    title: "Mobile Braids & Wigs",
    businessName: "AfroGlow Hair Studio",
    category: "Hair & Beauty",
    city: "Denver",
    state: "CO",
    country: "USA",
    priceLabel: "Styles from $80",
    description: "Knotless braids, sew-ins, wig installs. We travel within Denver metro.",
    isHomeBased: false,
  },
  {
    id: 3,
    title: "African Groceries & Products",
    businessName: "Diaspora Market Hub",
    category: "Groceries & Shops",
    city: "Dallas",
    state: "TX",
    country: "USA",
    priceLabel: "Varies",
    description: "Palm oil, fufu, spices, snacks and more. Order and pick up same day.",
    isHomeBased: false,
  },
];

const CATEGORIES = [
  "All categories",
  "Food & Catering",
  "Hair & Beauty",
  "Groceries & Shops",
  "Home Services",
  "Events & Decor",
];

export default function Marketplace({ onStartChat }: MarketplaceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [selectedCountry, setSelectedCountry] = useState("USA");

  const filteredListings = SAMPLE_LISTINGS.filter((listing) => {
    const matchesCountry = selectedCountry === "All" || listing.country === selectedCountry;
    const matchesCategory = selectedCategory === "All categories" || listing.category === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.city.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCountry && matchesCategory && matchesSearch;
  });

  const startChat = (businessName: string, prefillMessage?: string) => {
    if (onStartChat) {
      onStartChat(businessName, prefillMessage);
      return;
    }
    alert(`Start a chat with ${businessName}\n\nPrefill:\n${prefillMessage ?? "(none)"}`);
  };

  const openSellComposer = () => {
    window.dispatchEvent(new CustomEvent("afroconnect.openComposer", { detail: { kind: "sell" } }));
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container max-w-5xl py-6 space-y-6">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <span className="text-xl font-bold">AfroConnect Marketplace</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Discover home-based and local African businesses near you. Order food, book hair, find services, and support the diaspora.
              </p>
            </div>

            {/* ✅ NEW: Sell an item CTA */}
            <Button onClick={openSellComposer} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Sell an Item
            </Button>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search businesses, food, hair, services..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="UK">UK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Tap <span className="font-medium">Quick Ask</span> to message fast about inventory, prices, delivery, and pickup.
            </p>
          </CardContent>
        </Card>

        <ScrollArea className="h-[calc(100vh-16rem)] pr-2">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="flex flex-col h-full">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{listing.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {listing.category}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    by <span className="font-medium">{listing.businessName}</span>
                  </p>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {listing.city}, {listing.state} · {listing.country}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 flex-1">
                  <p className="text-sm text-muted-foreground">{listing.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">{listing.priceLabel}</span>
                    {listing.isHomeBased && (
                      <Badge variant="secondary" className="text-[11px]">
                        Home-based business
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs flex items-center gap-1"
                      onClick={() =>
                        startChat(listing.businessName, `Hi ${listing.businessName}, what do you have available today (inventory list)?`)
                      }
                    >
                      <PackageSearch className="h-4 w-4" />
                      Inventory
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs flex items-center gap-1"
                      onClick={() =>
                        startChat(listing.businessName, `Hi ${listing.businessName}, please can you share your price list (or menu) and any specials?`)
                      }
                    >
                      <DollarSign className="h-4 w-4" />
                      Prices
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs flex items-center gap-1"
                      onClick={() =>
                        startChat(listing.businessName, `Hi ${listing.businessName}, do you offer delivery? If yes, what areas and what’s the fee/time?`)
                      }
                    >
                      <Truck className="h-4 w-4" />
                      Delivery
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-xs flex items-center gap-1"
                      onClick={() =>
                        startChat(listing.businessName, `Hi ${listing.businessName}, what’s your pickup process and when is the best pickup time today?`)
                      }
                    >
                      <MapPinned className="h-4 w-4" />
                      Pickup
                    </Button>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <Button className="flex-1" size="sm" variant="outline">
                      View Details
                    </Button>

                    <Button className="flex-1 flex items-center gap-1" size="sm" onClick={() => startChat(listing.businessName)}>
                      <MessageCircle className="h-4 w-4" />
                      Message Seller
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredListings.length === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-8">
                No listings match your filters yet. Try broadening your search.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
