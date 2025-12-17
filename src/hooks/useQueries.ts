import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, Post, Group, Business, ExternalBlob, Conversation, GroupMessage, FaithCenter, MarketItem, Product, Event } from '../backend';
import { CenterType, EventCreatorType, EventCategory } from '../backend';
import { toast } from 'sonner';
import type { Principal } from '@dfinity/principal';

// Helper to check if actor is ready for authenticated operations
function useActorReady() {
  const { actor, isFetching } = useActor();
  const { identity, loginStatus } = useInternetIdentity();
  
  const isActorReady = !!(actor && !isFetching);
  const isAuthenticatedActorReady = !!(identity && isActorReady && loginStatus !== 'logging-in');
  
  return { actor, isFetching, isActorReady, isAuthenticatedActorReady };
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching, isAuthenticatedActorReady } = useActorReady();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: isAuthenticatedActorReady,
    retry: 2,
    retryDelay: 1000,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: isAuthenticatedActorReady && query.isFetched,
  };
}

export function useGetUserProfile(principal: string) {
  const { actor, isAuthenticatedActorReady } = useActorReady();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principal],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.getUserProfile(Principal.fromText(principal));
    },
    enabled: isAuthenticatedActorReady && !!principal,
    retry: 2,
  });
}

export function useSaveCallerUserProfile() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

// Admin Check Query
export function useIsCurrentUserAdmin() {
  const { actor, isAuthenticatedActorReady } = useActorReady();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: isAuthenticatedActorReady,
    retry: 2,
  });
}

// Public Post Queries (no authentication required)
export function useGetPublicPosts(country: string, region: string) {
  const { actor, isActorReady } = useActorReady();

  return useQuery<Post[]>({
    queryKey: ['publicPosts', country, region],
    queryFn: async () => {
      if (!actor) return [];
      const posts = await actor.getPublicPosts(country, region);
      return posts.sort((a, b) => Number(b.timestamp - a.timestamp));
    },
    enabled: isActorReady && !!country && !!region,
    retry: 2,
  });
}

// Post Queries (authenticated)
export function useGetAllPosts() {
  const { actor, isAuthenticatedActorReady } = useActorReady();

  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      if (!actor) return [];
      const posts = await actor.getAllPosts();
      return posts.sort((a, b) => Number(b.timestamp - a.timestamp));
    },
    enabled: isAuthenticatedActorReady,
    retry: 2,
  });
}

export function useCreatePost() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, media }: { content: string; media: ExternalBlob | null }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete before posting');
      }
      return actor.createPost(content, media);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
      toast.success('Post created successfully!');
    },
    onError: (error: Error) => {
      console.error('Failed to create post:', error);
      toast.error(`Failed to create post: ${error.message}`);
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useLikePost() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.likePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to like post: ${error.message}`);
    },
    retry: 1,
  });
}

export function useCommentOnPost() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: bigint; content: string }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.commentOnPost(postId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
      toast.success('Comment added!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
    retry: 1,
  });
}

export function useDeletePost() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['publicPosts'] });
      toast.success('Post deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete post: ${error.message}`);
    },
  });
}

// Group Queries
export function useGetAllGroups() {
  const { actor, isAuthenticatedActorReady } = useActorReady();

  return useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGroups();
    },
    enabled: isAuthenticatedActorReady,
    retry: 2,
  });
}

export function useCreateGroup() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      return actor.createGroup(name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create group: ${error.message}`);
    },
  });
}

export function useJoinGroup() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: bigint) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.joinGroup(groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Joined group successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to join group: ${error.message}`);
    },
  });
}

// Business Queries
export function useGetAllBusinesses() {
  const { actor, isAuthenticatedActorReady } = useActorReady();

  return useQuery<Business[]>({
    queryKey: ['businesses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBusinesses();
    },
    enabled: isAuthenticatedActorReady,
    refetchInterval: 10000,
    retry: 2,
  });
}

export function useCreateBusiness() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      contactInfo,
      category,
      country,
    }: {
      name: string;
      description: string;
      contactInfo: string;
      category: string;
      country: string;
    }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      return actor.createBusiness(name, description, contactInfo, category, country);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('Business created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create business: ${error.message}`);
    },
  });
}

export function useUpdateBusiness() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      name,
      description,
      contactInfo,
      category,
      country,
    }: {
      businessId: bigint;
      name: string;
      description: string;
      contactInfo: string;
      category: string;
      country: string;
    }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.updateBusiness(businessId, name, description, contactInfo, category, country);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('Business updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update business: ${error.message}`);
    },
  });
}

export function useDeleteBusiness() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (businessId: bigint) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.deleteBusiness(businessId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('Business deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete business: ${error.message}`);
    },
  });
}

export function useReviewBusiness() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      rating,
      comment,
    }: {
      businessId: bigint;
      rating: bigint;
      comment: string;
    }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.reviewBusiness(businessId, rating, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('Review submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit review: ${error.message}`);
    },
  });
}

// Business Product Queries
export function useAddProduct() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      name,
      price,
      description,
      availableQuantity,
    }: {
      businessId: bigint;
      name: string;
      price: bigint;
      description: string;
      availableQuantity: bigint;
    }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      return actor.addProduct(businessId, name, price, description, availableQuantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('Product added successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add product: ${error.message}`);
    },
  });
}

export function useUpdateProduct() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessId,
      productId,
      name,
      price,
      description,
      availableQuantity,
    }: {
      businessId: bigint;
      productId: bigint;
      name: string;
      price: bigint;
      description: string;
      availableQuantity: bigint;
    }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.updateProduct(businessId, productId, name, price, description, availableQuantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('Product updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
}

export function useDeleteProduct() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessId, productId }: { businessId: bigint; productId: bigint }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.deleteProduct(businessId, productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('Product deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });
}

// Faith Center Queries
export function useGetAllFaithCenters() {
  const { actor, isAuthenticatedActorReady } = useActorReady();

  return useQuery<FaithCenter[]>({
    queryKey: ['faithCenters'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFaithCenters();
    },
    enabled: isAuthenticatedActorReady,
    retry: 2,
  });
}

export function useCreateFaithCenter() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      denomination,
      country,
      region,
      serviceTimes,
      contactInfo,
      centerType,
    }: {
      name: string;
      description: string;
      denomination: string;
      country: string;
      region: string;
      serviceTimes: string;
      contactInfo: string;
      centerType: CenterType;
    }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      return actor.createFaithCenter(name, description, denomination, country, region, serviceTimes, contactInfo, centerType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faithCenters'] });
      toast.success('Faith center created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create faith center: ${error.message}`);
    },
  });
}

export function useUpdateFaithCenter() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      faithCenterId,
      name,
      description,
      denomination,
      country,
      region,
      serviceTimes,
      contactInfo,
      centerType,
    }: {
      faithCenterId: bigint;
      name: string;
      description: string;
      denomination: string;
      country: string;
      region: string;
      serviceTimes: string;
      contactInfo: string;
      centerType: CenterType;
    }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.updateFaithCenter(faithCenterId, name, description, denomination, country, region, serviceTimes, contactInfo, centerType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faithCenters'] });
      toast.success('Faith center updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update faith center: ${error.message}`);
    },
  });
}

export function useDeleteFaithCenter() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (faithCenterId: bigint) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.deleteFaithCenter(faithCenterId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faithCenters'] });
      toast.success('Faith center deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete faith center: ${error.message}`);
    },
  });
}

// Marketplace Queries
export function useGetLocalMarketItems() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const { data: userProfile } = useGetCallerUserProfile();

  return useQuery<MarketItem[]>({
    queryKey: ['marketItems', userProfile?.country, userProfile?.region],
    queryFn: async () => {
      if (!actor || !userProfile) return [];
      return actor.getLocalMarketItems(userProfile.country, userProfile.region);
    },
    enabled: isAuthenticatedActorReady && !!userProfile,
    retry: 2,
  });
}

export function useCreateMarketItem() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      price,
      description,
      media,
      country,
      region,
    }: {
      title: string;
      price: bigint;
      description: string;
      media: ExternalBlob | null;
      country: string;
      region: string;
    }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      return actor.createMarketItem(title, price, description, media, country, region);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketItems'] });
      toast.success('Item listed successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to list item: ${error.message}`);
    },
  });
}

export function useDeleteMarketItem() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (marketItemId: bigint) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.deleteMarketItem(marketItemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketItems'] });
      toast.success('Item removed successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove item: ${error.message}`);
    },
  });
}

// Messaging Queries
export function useGetConversations() {
  const { actor, isAuthenticatedActorReady } = useActorReady();

  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!actor) return [];
      const conversations = await actor.getConversations();
      return conversations.sort((a, b) => {
        const aLastMessage = a.messages[a.messages.length - 1];
        const bLastMessage = b.messages[b.messages.length - 1];
        return Number(bLastMessage.timestamp - aLastMessage.timestamp);
      });
    },
    enabled: isAuthenticatedActorReady,
    refetchInterval: 5000,
    retry: 2,
  });
}

export function useGetConversation(conversationId: bigint | null) {
  const { actor, isAuthenticatedActorReady } = useActorReady();

  return useQuery<Conversation | null>({
    queryKey: ['conversation', conversationId?.toString()],
    queryFn: async () => {
      if (!actor || conversationId === null) return null;
      return actor.getConversation(conversationId);
    },
    enabled: isAuthenticatedActorReady && conversationId !== null,
    refetchInterval: 3000,
    retry: 2,
  });
}

export function useSendMessage() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      receiver,
      content,
      media,
    }: {
      receiver: Principal;
      content: string;
      media: ExternalBlob | null;
    }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      return actor.sendMessage(receiver, content, media);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}

// Group Chat Queries
export function useGetGroupMessages(groupId: bigint | null) {
  const { actor, isAuthenticatedActorReady } = useActorReady();

  return useQuery<GroupMessage[]>({
    queryKey: ['groupMessages', groupId?.toString()],
    queryFn: async () => {
      if (!actor || groupId === null) return [];
      return actor.getGroupMessages(groupId);
    },
    enabled: isAuthenticatedActorReady && groupId !== null,
    refetchInterval: 3000,
    retry: 2,
  });
}

export function useSendGroupMessage() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      content,
      media,
    }: {
      groupId: bigint;
      content: string;
      media: ExternalBlob | null;
    }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      return actor.sendGroupMessage(groupId, content, media);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groupMessages', variables.groupId.toString()] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}

// Events Queries
export function useGetAllEvents() {
  const { actor, isAuthenticatedActorReady } = useActorReady();

  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      if (!actor) return [];
      const events = await actor.getAllEvents();
      return events.sort((a, b) => {
        return a.date.localeCompare(b.date);
      });
    },
    enabled: isAuthenticatedActorReady,
    retry: 2,
  });
}

export function useGetEventsByLocation(country: string, region: string) {
  const { actor, isAuthenticatedActorReady } = useActorReady();

  return useQuery<Event[]>({
    queryKey: ['events', country, region],
    queryFn: async () => {
      if (!actor) return [];
      const events = await actor.getEventsByLocation(country, region);
      return events.sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: isAuthenticatedActorReady && !!country && !!region,
    retry: 2,
  });
}

export function useGetEventsByCreator(creatorType: EventCreatorType, creatorId: bigint) {
  const { actor, isAuthenticatedActorReady } = useActorReady();

  return useQuery<Event[]>({
    queryKey: ['events', creatorType, creatorId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEventsByCreator(creatorType, creatorId);
    },
    enabled: isAuthenticatedActorReady,
    retry: 2,
  });
}

export function useCreateEvent() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      date,
      time,
      country,
      region,
      media,
      creatorType,
      creatorId,
      category,
    }: {
      title: string;
      description: string;
      date: string;
      time: string;
      country: string;
      region: string;
      media: ExternalBlob | null;
      creatorType: EventCreatorType;
      creatorId: bigint;
      category: EventCategory;
    }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      return actor.createEvent(title, description, date, time, country, region, media, creatorType, creatorId, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create event: ${error.message}`);
    },
  });
}

export function useUpdateEvent() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      title,
      description,
      date,
      time,
      country,
      region,
      media,
      category,
    }: {
      eventId: bigint;
      title: string;
      description: string;
      date: string;
      time: string;
      country: string;
      region: string;
      media: ExternalBlob | null;
      category: EventCategory;
    }) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.updateEvent(eventId, title, description, date, time, country, region, media, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update event: ${error.message}`);
    },
  });
}

export function useDeleteEvent() {
  const { actor, isAuthenticatedActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: bigint) => {
      if (!isAuthenticatedActorReady || !actor) {
        throw new Error('Please wait for connection to complete');
      }
      await actor.deleteEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete event: ${error.message}`);
    },
  });
}
