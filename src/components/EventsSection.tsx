import { useState } from 'react';
import { useGetAllEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useGetCallerUserProfile, useGetAllFaithCenters, useGetAllBusinesses, useGetAllGroups } from '../hooks/useQueries';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, MapPin, Globe, Calendar, Clock, Edit, Trash2, AlertCircle, X, Upload } from 'lucide-react';
import { getPrioritizedCountries, getRegionsForCountry, PRIORITY_COUNTRIES } from '../lib/locations';
import { EventCreatorType, EventCategory, type Event, ExternalBlob } from '../backend';
import MediaDisplay from './MediaDisplay';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function EventsSection() {
  const { data: events, isLoading } = useGetAllEvents();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: faithCenters } = useGetAllFaithCenters();
  const { data: businesses } = useGetAllBusinesses();
  const { data: groups } = useGetAllGroups();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { identity } = useInternetIdentity();

  const [viewMode, setViewMode] = useState<'local' | 'global'>('local');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'faith' | 'business' | 'community'>('all');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    country: '',
    region: '',
    creatorType: 'faithCenter' as 'faithCenter' | 'business' | 'group',
    creatorId: '',
    category: 'faith' as 'faith' | 'business' | 'community',
  });

  const prioritizedCountries = getPrioritizedCountries();

  const handleCountryChange = (country: string) => {
    setFormData({ ...formData, country, region: '' });
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    
    if (file) {
      // Validate file type
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
      
      if (!isImage && !isVideo) {
        setFileError('Please select a valid image (JPEG, PNG, GIF, WebP) or video file (MP4, WebM, OGG, MOV)');
        e.target.value = '';
        return;
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setFileError('File size must be less than 50MB');
        e.target.value = '';
        return;
      }
      
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setFileError(null);
    setUploadProgress(0);
  };

  const handleCreateEvent = async () => {
    if (!formData.title.trim() || !formData.date || !formData.time || !formData.country || !formData.region || !formData.creatorId) return;

    setUploadProgress(0);
    let media: ExternalBlob | null = null;
    
    if (mediaFile) {
      try {
        const arrayBuffer = await mediaFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        media = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      } catch (error) {
        console.error('Error processing file:', error);
        setFileError('Failed to process file. Please try again.');
        setUploadProgress(0);
        return;
      }
    }

    const creatorType = formData.creatorType === 'faithCenter' ? EventCreatorType.faithCenter : 
                        formData.creatorType === 'business' ? EventCreatorType.business : 
                        EventCreatorType.group;

    const category = formData.category === 'faith' ? EventCategory.faith :
                     formData.category === 'business' ? EventCategory.business :
                     EventCategory.community;

    createEvent.mutate(
      {
        ...formData,
        creatorType,
        creatorId: BigInt(formData.creatorId),
        category,
        media,
      },
      {
        onSuccess: () => {
          setFormData({ title: '', description: '', date: '', time: '', country: '', region: '', creatorType: 'faithCenter', creatorId: '', category: 'faith' });
          setMediaFile(null);
          setMediaPreview(null);
          setUploadProgress(0);
          setFileError(null);
          setIsCreateDialogOpen(false);
        },
        onError: (error) => {
          console.error('Error creating event:', error);
          setUploadProgress(0);
          setFileError('Failed to create event. Please try again.');
        },
      }
    );
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      country: event.location.country,
      region: event.location.region,
      creatorType: event.creatorType === EventCreatorType.faithCenter ? 'faithCenter' :
                   event.creatorType === EventCreatorType.business ? 'business' : 'group',
      creatorId: event.creatorId.toString(),
      category: event.category === EventCategory.faith ? 'faith' :
                event.category === EventCategory.business ? 'business' : 'community',
    });
    if (event.media) {
      setMediaPreview(event.media.getDirectURL());
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !formData.title.trim() || !formData.date || !formData.time || !formData.country || !formData.region) return;

    setUploadProgress(0);
    let media: ExternalBlob | null = null;
    
    if (mediaFile) {
      try {
        const arrayBuffer = await mediaFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        media = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      } catch (error) {
        console.error('Error processing file:', error);
        setFileError('Failed to process file. Please try again.');
        setUploadProgress(0);
        return;
      }
    } else if (editingEvent.media) {
      media = editingEvent.media;
    }

    const category = formData.category === 'faith' ? EventCategory.faith :
                     formData.category === 'business' ? EventCategory.business :
                     EventCategory.community;

    updateEvent.mutate(
      {
        eventId: editingEvent.id,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        country: formData.country,
        region: formData.region,
        media,
        category,
      },
      {
        onSuccess: () => {
          setFormData({ title: '', description: '', date: '', time: '', country: '', region: '', creatorType: 'faithCenter', creatorId: '', category: 'faith' });
          setMediaFile(null);
          setMediaPreview(null);
          setUploadProgress(0);
          setFileError(null);
          setEditingEvent(null);
        },
        onError: (error) => {
          console.error('Error updating event:', error);
          setUploadProgress(0);
          setFileError('Failed to update event. Please try again.');
        },
      }
    );
  };

  const handleDeleteEvent = (eventId: bigint) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEvent.mutate(eventId);
    }
  };

  const canManageEvent = (event: Event): boolean => {
    if (!identity) return false;
    
    const creatorType = event.creatorType;
    const creatorId = event.creatorId;

    if (creatorType === EventCreatorType.faithCenter) {
      const center = faithCenters?.find(c => c.id === creatorId);
      return center?.creator.toString() === identity.getPrincipal().toString();
    } else if (creatorType === EventCreatorType.business) {
      const business = businesses?.find(b => b.id === creatorId);
      return business?.owner.toString() === identity.getPrincipal().toString();
    } else if (creatorType === EventCreatorType.group) {
      const group = groups?.find(g => g.id === creatorId);
      return group?.creator.toString() === identity.getPrincipal().toString();
    }
    return false;
  };

  // Get available creators based on selected creator type
  const getAvailableCreators = () => {
    if (!identity) return [];
    
    if (formData.creatorType === 'faithCenter') {
      return faithCenters?.filter(c => c.creator.toString() === identity.getPrincipal().toString()) || [];
    } else if (formData.creatorType === 'business') {
      return businesses?.filter(b => b.owner.toString() === identity.getPrincipal().toString()) || [];
    } else {
      return groups?.filter(g => g.creator.toString() === identity.getPrincipal().toString()) || [];
    }
  };

  const getCreatorName = (event: Event): string => {
    if (event.creatorType === EventCreatorType.faithCenter) {
      return faithCenters?.find(c => c.id === event.creatorId)?.name || 'Unknown';
    } else if (event.creatorType === EventCreatorType.business) {
      return businesses?.find(b => b.id === event.creatorId)?.name || 'Unknown';
    } else {
      return groups?.find(g => g.id === event.creatorId)?.name || 'Unknown';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  // Filter events based on view mode and category
  const filteredEvents = events?.filter((event) => {
    const categoryMatch = filterCategory === 'all' || 
      (filterCategory === 'faith' && event.category === EventCategory.faith) ||
      (filterCategory === 'business' && event.category === EventCategory.business) ||
      (filterCategory === 'community' && event.category === EventCategory.community);
    
    if (viewMode === 'global') {
      return categoryMatch;
    }
    
    // For local view, filter by user's country and region
    const locationMatch = userProfile?.country === event.location.country && userProfile?.region === event.location.region;
    return categoryMatch && locationMatch;
  });

  const regions = formData.country ? getRegionsForCountry(formData.country) : [];
  const availableCreators = getAvailableCreators();
  const isVideoFile = mediaFile?.type.startsWith('video/');

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
          <h2 className="text-2xl font-bold">Events</h2>
          <p className="text-muted-foreground">Discover upcoming events in your community</p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingEvent} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingEvent(null);
            setFormData({ title: '', description: '', date: '', time: '', country: '', region: '', creatorType: 'faithCenter', creatorId: '', category: 'faith' });
            setMediaFile(null);
            setMediaPreview(null);
            setFileError(null);
            setUploadProgress(0);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pr-2">
              {!editingEvent && (
                <>
                  <div className="space-y-2">
                    <Label>Event Host Type *</Label>
                    <Select value={formData.creatorType} onValueChange={(value) => setFormData({ ...formData, creatorType: value as 'faithCenter' | 'business' | 'group', creatorId: '', category: value === 'faithCenter' ? 'faith' : value === 'business' ? 'business' : 'community' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="faithCenter">Faith Center</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="group">Community Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Host *</Label>
                    <Select value={formData.creatorId} onValueChange={(value) => setFormData({ ...formData, creatorId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${formData.creatorType === 'faithCenter' ? 'faith center' : formData.creatorType === 'business' ? 'business' : 'group'}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCreators.length > 0 ? (
                          availableCreators.map((creator: any) => (
                            <SelectItem key={creator.id.toString()} value={creator.id.toString()}>
                              {creator.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No {formData.creatorType === 'faithCenter' ? 'faith centers' : formData.creatorType === 'business' ? 'businesses' : 'groups'} available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {availableCreators.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        You need to create a {formData.creatorType === 'faithCenter' ? 'faith center' : formData.creatorType === 'business' ? 'business' : 'group'} first to host events.
                      </p>
                    )}
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="event-title">Event Title *</Label>
                <Input
                  id="event-title"
                  placeholder="e.g., Community Gathering"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as 'faith' | 'business' | 'community' })}>
                  <SelectTrigger id="event-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faith">Faith</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="event-date">Date *</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-time">Time *</Label>
                  <Input
                    id="event-time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-country">Country *</Label>
                <Select value={formData.country} onValueChange={handleCountryChange}>
                  <SelectTrigger id="event-country">
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
                  <Label htmlFor="event-region">City/Region *</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                    <SelectTrigger id="event-region">
                      <SelectValue placeholder="Select city/region" />
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
                <Label htmlFor="event-description">Description</Label>
                <Textarea
                  id="event-description"
                  placeholder="Tell us about this event..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-media">Event Photo/Video</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="event-media"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleMediaChange}
                    className="flex-1"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                {mediaPreview && (
                  <div className="relative mt-2">
                    {isVideoFile ? (
                      <video src={mediaPreview} className="w-full h-32 object-cover rounded-md" controls />
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="w-full h-32 object-cover rounded-md" />
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveMedia}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {fileError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{fileError}</AlertDescription>
                  </Alert>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                disabled={
                  (editingEvent ? updateEvent.isPending : createEvent.isPending) ||
                  !formData.title.trim() ||
                  !formData.date ||
                  !formData.time ||
                  !formData.country ||
                  !formData.region ||
                  (!editingEvent && !formData.creatorId)
                }
                className="w-full"
              >
                {editingEvent
                  ? updateEvent.isPending
                    ? 'Updating...'
                    : 'Update Event'
                  : createEvent.isPending
                  ? 'Creating...'
                  : 'Create Event'}
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
                <MapPin className="h-4 w-4 mr-2" />
                Nearby Events
              </TabsTrigger>
              <TabsTrigger value="global">
                <Globe className="h-4 w-4 mr-2" />
                All Events
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {viewMode === 'local' 
              ? `Showing events in ${userProfile?.region}, ${userProfile?.country || 'your area'}` 
              : 'Showing events from all locations'}
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Filter by Category</Label>
            <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as 'all' | 'faith' | 'business' | 'community')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="faith">Faith Events</SelectItem>
                <SelectItem value="business">Business Events</SelectItem>
                <SelectItem value="community">Community Events</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Event Listings */}
      {filteredEvents && filteredEvents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Card key={event.id.toString()} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
              {event.media && (
                <div className="w-full">
                  <MediaDisplay 
                    mediaUrl={event.media.getDirectURL()} 
                    alt={event.title}
                    aspectRatio="video"
                  />
                </div>
              )}
              <CardHeader className="flex-grow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={event.category === EventCategory.faith ? 'default' : event.category === EventCategory.business ? 'secondary' : 'outline'}>
                    {event.category === EventCategory.faith ? 'Faith' : event.category === EventCategory.business ? 'Business' : 'Community'}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription className="line-clamp-2">{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(event.time)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location.region}, {event.location.country}</span>
                </div>
                <div className="text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Hosted by: </span>
                  <span className="font-medium">{getCreatorName(event)}</span>
                </div>
              </CardContent>
              {canManageEvent(event) && (
                <CardFooter className="gap-2 pt-0">
                  <Button variant="outline" size="sm" onClick={() => handleEditEvent(event)} className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                    disabled={deleteEvent.isPending}
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
              src="/assets/generated/events-icon-transparent.dim_64x64.png"
              alt="No events"
              className="w-16 h-16 mx-auto mb-4 opacity-50"
            />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">
              {viewMode === 'local' 
                ? `No events in ${userProfile?.region}, ${userProfile?.country || 'your area'} yet. Try switching to "All Events" or create the first one!` 
                : filterCategory !== 'all'
                ? 'Try adjusting your filters or create a new event'
                : 'Be the first to create an event!'}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
