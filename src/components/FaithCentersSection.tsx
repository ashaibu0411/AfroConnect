import { useState } from 'react';
import { useGetAllFaithCenters, useCreateFaithCenter, useUpdateFaithCenter, useDeleteFaithCenter, useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2, MapPin, Globe, Clock, Phone, Edit, Trash2 } from 'lucide-react';
import { getPrioritizedCountries, getRegionsForCountry, PRIORITY_COUNTRIES } from '../lib/locations';
import { CenterType, type FaithCenter } from '../backend';

const CHURCH_DENOMINATIONS = [
  'Catholic',
  'Protestant',
  'Pentecostal',
  'Baptist',
  'Methodist',
  'Anglican',
  'Presbyterian',
  'Seventh-day Adventist',
  'Orthodox',
  'Non-denominational',
  'Other',
];

const MOSQUE_DENOMINATIONS = [
  'Sunni',
  'Shia',
  'Sufi',
  'Ahmadiyya',
  'Non-denominational',
  'Other',
];

export default function FaithCentersSection() {
  const { data: faithCenters, isLoading } = useGetAllFaithCenters();
  const { data: userProfile } = useGetCallerUserProfile();
  const createFaithCenter = useCreateFaithCenter();
  const updateFaithCenter = useUpdateFaithCenter();
  const deleteFaithCenter = useDeleteFaithCenter();
  const { identity } = useInternetIdentity();

  const [viewMode, setViewMode] = useState<'local' | 'global'>('local');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<FaithCenter | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'church' | 'mosque'>('all');
  const [filterDenomination, setFilterDenomination] = useState<string>('all');
  const [centerType, setCenterType] = useState<'church' | 'mosque'>('church');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    denomination: '',
    country: '',
    region: '',
    serviceTimes: '',
    contactInfo: '',
  });

  const prioritizedCountries = getPrioritizedCountries();

  const handleCountryChange = (country: string) => {
    setFormData({ ...formData, country, region: '' });
  };

  const handleCenterTypeChange = (type: 'church' | 'mosque') => {
    setCenterType(type);
    setFormData({ ...formData, denomination: '' });
  };

  const handleCreateFaithCenter = () => {
    if (!formData.name.trim() || !formData.denomination || !formData.country || !formData.region) return;

    createFaithCenter.mutate(
      {
        ...formData,
        centerType: centerType === 'church' ? CenterType.church : CenterType.mosque,
      },
      {
        onSuccess: () => {
          setFormData({ name: '', description: '', denomination: '', country: '', region: '', serviceTimes: '', contactInfo: '' });
          setIsCreateDialogOpen(false);
          setCenterType('church');
        },
      }
    );
  };

  const handleEditFaithCenter = (center: FaithCenter) => {
    setEditingCenter(center);
    setCenterType(center.centerType === CenterType.church ? 'church' : 'mosque');
    setFormData({
      name: center.name,
      description: center.description,
      denomination: center.denomination,
      country: center.location.country,
      region: center.location.region,
      serviceTimes: center.serviceTimes,
      contactInfo: center.contactInfo,
    });
  };

  const handleUpdateFaithCenter = () => {
    if (!editingCenter || !formData.name.trim() || !formData.denomination || !formData.country || !formData.region) return;

    updateFaithCenter.mutate(
      {
        faithCenterId: editingCenter.id,
        ...formData,
        centerType: centerType === 'church' ? CenterType.church : CenterType.mosque,
      },
      {
        onSuccess: () => {
          setFormData({ name: '', description: '', denomination: '', country: '', region: '', serviceTimes: '', contactInfo: '' });
          setEditingCenter(null);
          setCenterType('church');
        },
      }
    );
  };

  const handleDeleteFaithCenter = (centerId: bigint) => {
    if (confirm('Are you sure you want to delete this faith center listing?')) {
      deleteFaithCenter.mutate(centerId);
    }
  };

  const isCenterCreator = (center: FaithCenter): boolean => {
    if (!identity) return false;
    return center.creator.toString() === identity.getPrincipal().toString();
  };

  // Filter faith centers based on view mode, type, and denomination
  const filteredCenters = faithCenters?.filter((center) => {
    const typeMatch = filterType === 'all' || 
      (filterType === 'church' && center.centerType === CenterType.church) ||
      (filterType === 'mosque' && center.centerType === CenterType.mosque);
    
    const denominationMatch = filterDenomination === 'all' || center.denomination === filterDenomination;
    
    if (viewMode === 'global') {
      return typeMatch && denominationMatch;
    }
    
    // For local view, filter by user's country and region
    const locationMatch = userProfile?.country === center.location.country && userProfile?.region === center.location.region;
    return typeMatch && denominationMatch && locationMatch;
  });

  const regions = formData.country ? getRegionsForCountry(formData.country) : [];
  const denominations = centerType === 'church' ? CHURCH_DENOMINATIONS : MOSQUE_DENOMINATIONS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Faith Centers</h2>
          <p className="text-muted-foreground">Find churches and mosques in your community</p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingCenter} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingCenter(null);
            setFormData({ name: '', description: '', denomination: '', country: '', region: '', serviceTimes: '', contactInfo: '' });
            setCenterType('church');
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Faith Center
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCenter ? 'Edit Faith Center' : 'Add Faith Center'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Tabs value={centerType} onValueChange={(value) => handleCenterTypeChange(value as 'church' | 'mosque')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="church">
                      <img src="/assets/generated/church-icon.dim_64x64.png" alt="Church" className="h-4 w-4 mr-2" />
                      Church
                    </TabsTrigger>
                    <TabsTrigger value="mosque">
                      <img src="/assets/generated/mosque-icon.dim_64x64.png" alt="Mosque" className="h-4 w-4 mr-2" />
                      Mosque
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="space-y-2">
                <Label htmlFor="center-name">Name *</Label>
                <Input
                  id="center-name"
                  placeholder={centerType === 'church' ? 'e.g., Grace Community Church' : 'e.g., Central Mosque'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="center-denomination">Denomination *</Label>
                <Select value={formData.denomination} onValueChange={(value) => setFormData({ ...formData, denomination: value })}>
                  <SelectTrigger id="center-denomination">
                    <SelectValue placeholder="Select denomination" />
                  </SelectTrigger>
                  <SelectContent>
                    {denominations.map((denom) => (
                      <SelectItem key={denom} value={denom}>
                        {denom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="center-country">Country *</Label>
                <Select value={formData.country} onValueChange={handleCountryChange}>
                  <SelectTrigger id="center-country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[300px]">
                      {prioritizedCountries.map((country) => {
                        if (country === '---separator---') {
                          return <SelectSeparator key="separator" />;
                        }
                        return (
                          <SelectItem 
                            key={country} 
                            value={country}
                            className={PRIORITY_COUNTRIES.includes(country) ? 'font-medium' : ''}
                          >
                            {country}
                          </SelectItem>
                        );
                      })}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              {formData.country && (
                <div className="space-y-2">
                  <Label htmlFor="center-region">State/Region *</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                    <SelectTrigger id="center-region">
                      <SelectValue placeholder="Select state/region" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {regions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="center-description">Description</Label>
                <Textarea
                  id="center-description"
                  placeholder="Tell us about this faith center..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="center-service-times">Service Times</Label>
                <Textarea
                  id="center-service-times"
                  placeholder={centerType === 'church' ? 'e.g., Sunday 9:00 AM & 11:00 AM' : 'e.g., Friday 1:00 PM, Daily prayers 5 times'}
                  value={formData.serviceTimes}
                  onChange={(e) => setFormData({ ...formData, serviceTimes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="center-contact">Contact Information</Label>
                <Textarea
                  id="center-contact"
                  placeholder="Phone, email, address..."
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  rows={2}
                />
              </div>
              <Button
                onClick={editingCenter ? handleUpdateFaithCenter : handleCreateFaithCenter}
                disabled={
                  (editingCenter ? updateFaithCenter.isPending : createFaithCenter.isPending) ||
                  !formData.name.trim() ||
                  !formData.denomination ||
                  !formData.country ||
                  !formData.region
                }
                className="w-full"
              >
                {editingCenter
                  ? updateFaithCenter.isPending
                    ? 'Updating...'
                    : 'Update Faith Center'
                  : createFaithCenter.isPending
                  ? 'Adding...'
                  : 'Add Faith Center'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Mode Toggle */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'local' | 'global')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local">
                Local ({userProfile?.region || 'Your Area'})
              </TabsTrigger>
              <TabsTrigger value="global">
                <Globe className="h-4 w-4 mr-2" />
                Global
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {viewMode === 'local' 
              ? `Showing faith centers from ${userProfile?.region}, ${userProfile?.country || 'your area'}` 
              : 'Showing faith centers from all locations'}
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Filter by Type</Label>
              <Select value={filterType} onValueChange={(value) => {
                setFilterType(value as 'all' | 'church' | 'mosque');
                setFilterDenomination('all');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Faith Centers</SelectItem>
                  <SelectItem value="church">Churches</SelectItem>
                  <SelectItem value="mosque">Mosques</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filter by Denomination</Label>
              <Select value={filterDenomination} onValueChange={setFilterDenomination}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Denominations</SelectItem>
                  {(filterType === 'church' || filterType === 'all' ? CHURCH_DENOMINATIONS : MOSQUE_DENOMINATIONS).map((denom) => (
                    <SelectItem key={denom} value={denom}>
                      {denom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faith Center Listings */}
      {filteredCenters && filteredCenters.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCenters.map((center) => (
            <Card key={center.id.toString()} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <img 
                    src={center.centerType === CenterType.church 
                      ? '/assets/generated/church-icon.dim_64x64.png' 
                      : '/assets/generated/mosque-icon.dim_64x64.png'
                    } 
                    alt={center.centerType === CenterType.church ? 'Church' : 'Mosque'} 
                    className="h-8 w-8" 
                  />
                  <Badge variant="secondary">{center.denomination}</Badge>
                </div>
                <CardTitle className="text-lg mt-2">{center.name}</CardTitle>
                <CardDescription className="line-clamp-2">{center.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{center.location.region}, {center.location.country}</span>
                </div>
                {center.serviceTimes && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mt-0.5" />
                    <span className="line-clamp-2">{center.serviceTimes}</span>
                  </div>
                )}
                {center.contactInfo && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mt-0.5" />
                    <span className="line-clamp-2">{center.contactInfo}</span>
                  </div>
                )}
              </CardContent>
              {isCenterCreator(center) && (
                <CardFooter className="gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditFaithCenter(center)} className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteFaithCenter(center.id)}
                    disabled={deleteFaithCenter.isPending}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <img
              src="/assets/generated/church-icon.dim_64x64.png"
              alt="No faith centers"
              className="w-16 h-16 mx-auto mb-4 opacity-50"
            />
            <h3 className="text-lg font-semibold mb-2">No faith centers found</h3>
            <p className="text-muted-foreground mb-4">
              {viewMode === 'local' 
                ? `No faith centers from ${userProfile?.region}, ${userProfile?.country || 'your area'} yet. Try switching to Global view or add the first one!` 
                : filterType !== 'all' || filterDenomination !== 'all'
                ? 'Try adjusting your filters'
                : 'Be the first to add a faith center to the directory!'}
            </p>
            {(viewMode === 'global' || (filterType === 'all' && filterDenomination === 'all')) && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Faith Center
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
