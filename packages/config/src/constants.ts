// User roles
export const USER_ROLES = {
  CREATIVE: "CREATIVE",
  CLIENT: "CLIENT",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Availability statuses
export const AVAILABILITY_STATUS = {
  AVAILABLE: "AVAILABLE",
  BUSY: "BUSY",
  NOT_AVAILABLE: "NOT_AVAILABLE",
} as const;

export type AvailabilityStatus = (typeof AVAILABILITY_STATUS)[keyof typeof AVAILABILITY_STATUS];

// Verification statuses
export const VERIFICATION_STATUS = {
  NONE: "NONE",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",
  RED_BADGE: "RED_BADGE",
  BLACK_BADGE: "BLACK_BADGE",
  PLATINUM: "PLATINUM",
} as const;

export type VerificationStatus = (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

// Media types
export const MEDIA_TYPES = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  AUDIO: "AUDIO",
} as const;

export type MediaType = (typeof MEDIA_TYPES)[keyof typeof MEDIA_TYPES];

// Limits
export const LIMITS = {
  BIO_MAX_LENGTH: 500,
  HEADLINE_MAX_LENGTH: 280,
  POST_MAX_LENGTH: 500,
  COMMENT_MAX_LENGTH: 280,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  DISPLAY_NAME_MIN_LENGTH: 2,
  DISPLAY_NAME_MAX_LENGTH: 50,
  MAX_PORTFOLIO_IMAGES: 10,
  MAX_POST_IMAGES: 10,
  MAX_FILE_SIZE_AVATAR: 2 * 1024 * 1024, // 2MB
  MAX_FILE_SIZE_PORTFOLIO: 10 * 1024 * 1024, // 10MB
  MAX_FILE_SIZE_POST: 10 * 1024 * 1024, // 10MB
  MAX_FILE_SIZE_VIDEO: 50 * 1024 * 1024, // 50MB
  MAX_FILE_SIZE_AUDIO: 20 * 1024 * 1024, // 20MB
  MAX_FILE_SIZE_MODEL: 50 * 1024 * 1024, // 50MB
  FEED_PAGE_SIZE: 20,
  SEARCH_PAGE_SIZE: 20,
  MESSAGE_MAX_LENGTH: 2000,
  MESSAGES_PAGE_SIZE: 30,
  CONVERSATIONS_PAGE_SIZE: 20,
  NOTIFICATION_PAGE_SIZE: 20,
  WORK_ORDERS_PAGE_SIZE: 10,
  DELIVERIES_PAGE_SIZE: 20,
  GIGS_PAGE_SIZE: 12,
  APPLICATION_COVER_LETTER_MAX: 1000,
  DELIVERY_MESSAGE_MAX: 2000,
  MILESTONE_TITLE_MAX: 100,
  MILESTONE_DESCRIPTION_MAX: 500,
} as const;

// Collective limits
export const COLLECTIVE_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 50,
  DESCRIPTION_MAX: 500,
  SLUG_MAX: 50,
  ROLE_NAME_MAX: 30,
  PAGE_SIZE: 12,
  POSTS_PAGE_SIZE: 20,
  MEMBERS_PAGE_SIZE: 20,
  PORTFOLIO_PAGE_SIZE: 12,
} as const;

// Default collective role permissions
export interface CollectivePermissions {
  canPost: boolean;
  canModerate: boolean;
  canEditPortfolio: boolean;
  canManageMembers: boolean;
  canManageRoles: boolean;
  canManageCollective: boolean;
  canInvite: boolean;
}

export const DEFAULT_COLLECTIVE_ROLES: Array<{
  name: string;
  slug: string;
  sortOrder: number;
  isDefault: boolean;
  permissions: CollectivePermissions;
}> = [
  {
    name: "Creator",
    slug: "creator",
    sortOrder: 0,
    isDefault: true,
    permissions: {
      canPost: true,
      canModerate: true,
      canEditPortfolio: true,
      canManageMembers: true,
      canManageRoles: true,
      canManageCollective: true,
      canInvite: true,
    },
  },
  {
    name: "Admin",
    slug: "admin",
    sortOrder: 1,
    isDefault: true,
    permissions: {
      canPost: true,
      canModerate: true,
      canEditPortfolio: true,
      canManageMembers: true,
      canManageRoles: true,
      canManageCollective: true,
      canInvite: true,
    },
  },
  {
    name: "Moderator",
    slug: "moderator",
    sortOrder: 2,
    isDefault: true,
    permissions: {
      canPost: true,
      canModerate: true,
      canEditPortfolio: true,
      canManageMembers: true,
      canManageRoles: false,
      canManageCollective: false,
      canInvite: true,
    },
  },
  {
    name: "Editor",
    slug: "editor",
    sortOrder: 3,
    isDefault: true,
    permissions: {
      canPost: true,
      canModerate: false,
      canEditPortfolio: true,
      canManageMembers: false,
      canManageRoles: false,
      canManageCollective: false,
      canInvite: true,
    },
  },
  {
    name: "Member",
    slug: "member",
    sortOrder: 4,
    isDefault: true,
    permissions: {
      canPost: true,
      canModerate: false,
      canEditPortfolio: false,
      canManageMembers: false,
      canManageRoles: false,
      canManageCollective: false,
      canInvite: false,
    },
  },
];

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: "Free",
    maxPortfolioProjects: 5,
    maxMediaPerPost: 4,
    analytics: false,
    verifiedBadge: false,
    customAccent: false,
    price: null,
  },
  PRO: {
    name: "Pro",
    maxPortfolioProjects: 20,
    maxMediaPerPost: 10,
    analytics: true,
    verifiedBadge: true,
    customAccent: true,
    price: "$9.99/mo",
  },
  BUSINESS: {
    name: "Business",
    maxPortfolioProjects: 999,
    maxMediaPerPost: 20,
    analytics: true,
    verifiedBadge: true,
    customAccent: true,
    prioritySupport: true,
    price: "$29.99/mo",
  },
} as const;

// Proficiency levels
export const PROFICIENCY_LEVELS = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Basic" },
  { value: 3, label: "Intermediate" },
  { value: 4, label: "Advanced" },
  { value: 5, label: "Expert" },
] as const;
