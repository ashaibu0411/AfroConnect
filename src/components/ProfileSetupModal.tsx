import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPrioritizedCountries, getRegionsForCountry, PRIORITY_COUNTRIES } from '../lib/locations';
import type { UserProfile } from '../backend';
import { Loader2 } from 'lucide-react';

export default function ProfileSetupModal() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    interests: '',
    country: '',
    region: '',
    professionalDetails: '',
  });

  const saveProfile = useSaveCallerUserProfile();

  const handleCountryChange = (country: string) => {
    setFormData({ ...formData, country, region: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.country || !formData.region) {
      return;
    }

    const profile: UserProfile = {
      name: formData.name,
      email: formData.email,
      bio: formData.bio,
      interests: formData.interests.split(',').map((i) => i.trim()).filter(Boolean),
      country: formData.country,
      region: formData.region,
      professionalDetails: formData.professionalDetails,
    };

    saveProfile.mutate(profile);
  };

  const regions = formData.country ? getRegionsForCountry(formData.country) : [];
  const isFormValid = formData.name && formData.email && formData.country && formData.region;
  const prioritizedCountries = getPrioritizedCountries();

  return (
    <Dialog open={true}>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to AfroConnect!</DialogTitle>
          <DialogDescription>
            Let's set up your profile to get started. Share a bit about yourself with the community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={saveProfile.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={saveProfile.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select 
              value={formData.country} 
              onValueChange={handleCountryChange} 
              required
              disabled={saveProfile.isPending}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[300px]">
                  {prioritizedCountries.map((country, index) => {
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
              <Label htmlFor="region">State/Region *</Label>
              <Select 
                value={formData.region} 
                onValueChange={(value) => setFormData({ ...formData, region: value })} 
                required
                disabled={saveProfile.isPending}
              >
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select your state/region" />
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
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              disabled={saveProfile.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests">Interests (Optional)</Label>
            <Input
              id="interests"
              placeholder="Music, Art, Technology (comma-separated)"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              disabled={saveProfile.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="professionalDetails">Professional Details (Optional)</Label>
            <Textarea
              id="professionalDetails"
              placeholder="Your profession, skills, or business..."
              value={formData.professionalDetails}
              onChange={(e) => setFormData({ ...formData, professionalDetails: e.target.value })}
              rows={2}
              disabled={saveProfile.isPending}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={saveProfile.isPending || !isFormValid}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Profile...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
