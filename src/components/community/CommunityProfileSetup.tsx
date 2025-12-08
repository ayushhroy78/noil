import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCommunityProfileActions } from '@/hooks/useCommunityProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface CommunityProfileSetupProps {
  onComplete: () => void;
  existingProfile?: {
    username: string;
    bio?: string | null;
    avatar_url?: string | null;
    banner_url?: string | null;
  };
}

export const CommunityProfileSetup = ({ onComplete, existingProfile }: CommunityProfileSetupProps) => {
  const { createProfile, updateProfile, uploadImage, saving } = useCommunityProfileActions();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(existingProfile?.avatar_url || null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(existingProfile?.banner_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: existingProfile?.username || '',
      bio: existingProfile?.bio || '',
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const url = await uploadImage(file, 'avatar');
    if (url) setAvatarUrl(url);
    setUploadingAvatar(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    const url = await uploadImage(file, 'banner');
    if (url) setBannerUrl(url);
    setUploadingBanner(false);
  };

  const onSubmit = async (data: ProfileFormData) => {
    const profileData = {
      username: data.username,
      bio: data.bio,
      avatar_url: avatarUrl || undefined,
      banner_url: bannerUrl || undefined,
    };

    const success = existingProfile
      ? await updateProfile(profileData)
      : await createProfile(profileData);

    if (success) onComplete();
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{existingProfile ? 'Edit Profile' : 'Create Your Community Profile'}</CardTitle>
        <CardDescription>Set up your profile to connect with the community</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Banner Upload */}
        <div 
          className="relative h-32 bg-muted rounded-lg mb-12 cursor-pointer overflow-hidden group"
          onClick={() => bannerInputRef.current?.click()}
        >
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Camera className="w-6 h-6 mr-2" />
              <span>Add banner</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploadingBanner ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerUpload}
          />

          {/* Avatar Upload - positioned over banner */}
          <div 
            className="absolute -bottom-10 left-4 cursor-pointer group/avatar"
            onClick={(e) => {
              e.stopPropagation();
              avatarInputRef.current?.click();
            }}
          >
            <Avatar className="w-20 h-20 border-4 border-background">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                      <Input {...field} placeholder="username" className="pl-8" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Tell us about yourself..." 
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={saving || uploadingAvatar || uploadingBanner}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : existingProfile ? 'Save Changes' : 'Create Profile'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
