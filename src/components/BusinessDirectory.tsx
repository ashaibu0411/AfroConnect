import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, MapPin, Globe2, Search, Star } from "lucide-react";

type DirectoryBusiness = {
  id: number;
  name: string;
  category: string;
  shortDescription: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  website?: string;
  tags: string[];
  isVerified: boolean;
};

const DIRECTORY_DATA: DirectoryBusiness[] = [
  {
    id: 1,
    name: "Mama Efua’s Kitchen",
    category: "Food & Catering",
    shortDescription: "Authentic Ghanaian dishes for events, families, and weekly meal prep.",
    city: "Aurora",
    state: "CO",
    country: "USA",
    phone: "+1 (720) 555-1234",
    tags: ["Ghanaian", "Meal prep", "Events"],
    isVerified: true,
  },
  {
    id: 2,
    name: "AfroGlow Hair Studio",
    category: "Hair & Beauty",
    shortDescription: "Braids, wigs, natural hair care, and protective styles for all ages.",
    city: "Denver",
    state: "CO",
    country: "USA",
    phone: "+1 (303) 555-6789",
    website: "https://afroglow.example.com",
    tags: ["Braids", "Wigs", "Mobile"],
    isVerified: true,
  },
  {
    id: 3,
    name: "Diaspora Market Hub",
    category: "Groceries & Shops",
    shortDescription: "African groceries, snacks, spices, hair products, and home essentials.",
    city: "Dallas",
    state: "TX",
    country: "USA",
    phone: "+1 (214) 555-2222",
    tags: ["Groceries", "Pan-African"],
    isVerified: false,
  },
];

const DIRECTORY_CATEGORIES = [
  "All categories",
  "Food & Catering",
  "Hair & Beauty",
  "Groceries & Shops",
  "Home Services",
  "Events & Decor",
];

export default function BusinessDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");

  const visibleBusinesses = DIRECTORY_DATA.filter((biz) => {
    const matchesCategory =
      selectedCategory === "All categories" ||
      biz.category === selectedCategory;

    const matchesSearch =
      !searchTerm ||
      biz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      biz.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      biz.tags.some((t) =>
        t.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background via-background to-secondary/5">
      <div className="container max-w-5xl py-6 space-y-6">
        {/* HEADER */}
        <Card className="border-2 border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="text-xl font-bold">Business Directory</span>
              <Badge variant="outline" className="text-xs">
                Beta · Local & Home-based
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Explore African-owned and home-based businesses in your area.
              Perfect for food orders, hair appointments, events, and everyday services.
            </p>

            {/* SEARCH / FILTERS */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, city, or tag (e.g. braids, jollof, decor)..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {DIRECTORY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* BUSINESS LIST */}
        <ScrollArea className="h-[calc(100vh-16rem)] pr-2">
          <div className="space-y-4">
            {visibleBusinesses.map((biz) => (
              <Card key={biz.id} className="border border-border/60">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{biz.name}</CardTitle>
                      {biz.isVerified && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1 text-[11px]"
                        >
                          <Star className="h-3 w-3 text-amber-500" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {biz.category}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {biz.city}, {biz.state} · {biz.country}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {biz.shortDescription}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {biz.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[11px]">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      asChild
                    >
                      <a href={`tel:${biz.phone}`}>
                        <Phone className="h-4 w-4" />
                        Call
                      </a>
                    </Button>

                    {biz.website && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                        asChild
                      >
                        <a
                          href={biz.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Globe2 className="h-4 w-4" />
                          Website
                        </a>
                      </Button>
                    )}

                    <span className="ml-auto text-xs text-muted-foreground">
                      Future: claim business & update inventory in real-time
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {visibleBusinesses.length === 0 && (
              <Card className="text-center py-10">
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No businesses match your filters yet. Try another category or search term.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
