// Temporary stub backend for AfroConnect frontend.
// This just prevents import errors so the UI can load.

// Used in CommunityFeed / upload-related components
export class ExternalBlob {
  // Extend this later to match your real backend shape.
}

// Used in FaithCentersSection.tsx
export const CenterType = {
  CHURCH: "CHURCH",
  MOSQUE: "MOSQUE",
  FELLOWSHIP: "FELLOWSHIP",
  OTHER: "OTHER",
} as const;

// Used in EventsSection.tsx for event categories
export const EventCategory = {
  CHURCH_SERVICE: "CHURCH_SERVICE",
  CONFERENCE: "CONFERENCE",
  MEETUP: "MEETUP",
  ONLINE: "ONLINE",
  OTHER: "OTHER",
} as const;

// Used in EventsSection.tsx for who created the event
export const EventCreatorType = {
  USER: "USER",
  ORGANIZATION: "ORGANIZATION",
  CHURCH: "CHURCH",
} as const;

// Optional helper types (not required for runtime)
export type CenterTypeValue = (typeof CenterType)[keyof typeof CenterType];
export type EventCategoryValue =
  (typeof EventCategory)[keyof typeof EventCategory];
export type EventCreatorTypeValue =
  (typeof EventCreatorType)[keyof typeof EventCreatorType];

const backend = {
  async sendMessage(_channelId: string, _text: string) {
    console.log("[backend.sendMessage] stub called");
    return { ok: true };
  },

  async listMessages(_channelId: string) {
    console.log("[backend.listMessages] stub called");
    return [];
  },

  async listGroups() {
    console.log("[backend.listGroups] stub called");
    return [];
  },
};

export default backend;
