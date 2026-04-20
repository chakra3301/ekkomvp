import SwiftUI

/// Single entry point for rendering ANY user's Connect profile in
/// display mode (no editing). Picks the right template from
/// `profile.profileTemplate` and forwards the data.
///
/// Designed for the "viewing someone else's profile" surfaces:
/// LikesView's expanded sheet, ChatView's profile sheet, SwipeCard's
/// expanded view. The owner's own profile keeps using `ProfileView`
/// because it needs the inline edit chrome — putting two render paths
/// behind one view here would force display+edit assumptions to leak
/// across both contexts.
struct ConnectProfileViewer: View {
    let profile: ConnectProfile
    /// Tier used by templates that show a tier badge. Falls back to the
    /// profile's tier when the caller doesn't override it.
    var connectTier: ConnectTier? = nil
    /// Set by the host to indicate the signed-in user is viewing their
    /// own profile. Templates use this to gate the "Book a call" /
    /// "Apply now" CTAs — they only fire for OTHER viewers.
    var viewerIsOwner: Bool = false
    /// CTA tap handler. Templates call it with their inquiry type so the
    /// host can present the right form sheet.
    var onTapInquiryCTA: ((ConnectInquiryType) -> Void)? = nil

    private var displayName: String {
        profile.user?.profile?.displayName ?? "Creative"
    }

    private var avatarUrl: String? {
        profile.user?.profile?.avatarUrl
    }

    private var username: String? {
        profile.user?.profile?.username
    }

    private var isAdmin: Bool {
        profile.user?.role == .ADMIN
    }

    private var template: ConnectProfileTemplate {
        ConnectProfileTemplate.from(profile.profileTemplate)
    }

    private var tier: ConnectTier {
        connectTier ?? profile.connectTier
    }

    /// Forwarded to Hire / Client templates so they can swap their CTA
    /// behavior (open form for visitors, open editor for owner).
    private var inquiryActions: ProfileInquiryActions? {
        guard !viewerIsOwner, let onTap = onTapInquiryCTA else { return nil }
        return ProfileInquiryActions(
            onTapBookCall:  { onTap(.BOOKING_REQUEST) },
            onTapApplyNow:  { onTap(.APPLICATION) }
        )
    }

    var body: some View {
        switch template {
        case .hero:
            ConnectProfileHeroView(
                displayName: displayName, avatarUrl: avatarUrl,
                headline: profile.headline, location: profile.location,
                lookingFor: profile.lookingFor, bio: profile.bio,
                mediaSlots: profile.mediaSlots, prompts: profile.prompts,
                instagramHandle: profile.instagramHandle,
                twitterHandle: profile.twitterHandle,
                websiteUrl: profile.websiteUrl,
                connectTier: tier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: isAdmin
            )

        case .editorial:
            ConnectProfileEditorialView(
                displayName: displayName, avatarUrl: avatarUrl,
                headline: profile.headline, location: profile.location,
                lookingFor: profile.lookingFor, bio: profile.bio,
                mediaSlots: profile.mediaSlots, prompts: profile.prompts,
                instagramHandle: profile.instagramHandle,
                twitterHandle: profile.twitterHandle,
                websiteUrl: profile.websiteUrl,
                connectTier: tier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: isAdmin
            )

        case .stack:
            ConnectProfileStackView(
                displayName: displayName, avatarUrl: avatarUrl,
                headline: profile.headline, location: profile.location,
                lookingFor: profile.lookingFor, bio: profile.bio,
                mediaSlots: profile.mediaSlots, prompts: profile.prompts,
                instagramHandle: profile.instagramHandle,
                twitterHandle: profile.twitterHandle,
                websiteUrl: profile.websiteUrl,
                connectTier: tier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: isAdmin
            )

        case .split:
            ConnectProfileSplitView(
                displayName: displayName, avatarUrl: avatarUrl,
                username: username,
                headline: profile.headline, location: profile.location,
                lookingFor: profile.lookingFor, bio: profile.bio,
                mediaSlots: profile.mediaSlots, prompts: profile.prompts,
                instagramHandle: profile.instagramHandle,
                twitterHandle: profile.twitterHandle,
                websiteUrl: profile.websiteUrl,
                connectTier: tier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: isAdmin
            )

        case .terminal:
            ConnectProfileTerminalView(
                displayName: displayName, avatarUrl: avatarUrl,
                username: username,
                headline: profile.headline, location: profile.location,
                lookingFor: profile.lookingFor, bio: profile.bio,
                mediaSlots: profile.mediaSlots, prompts: profile.prompts,
                instagramHandle: profile.instagramHandle,
                twitterHandle: profile.twitterHandle,
                websiteUrl: profile.websiteUrl,
                connectTier: tier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: isAdmin
            )

        case .photo:
            ConnectProfilePhotoView(
                displayName: displayName, avatarUrl: avatarUrl,
                username: username,
                headline: profile.headline, location: profile.location,
                lookingFor: profile.lookingFor, bio: profile.bio,
                mediaSlots: profile.mediaSlots, prompts: profile.prompts,
                instagramHandle: profile.instagramHandle,
                twitterHandle: profile.twitterHandle,
                websiteUrl: profile.websiteUrl,
                connectTier: tier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: isAdmin
            )

        case .video:
            ConnectProfileVideoView(
                displayName: displayName, avatarUrl: avatarUrl,
                username: username,
                headline: profile.headline, location: profile.location,
                lookingFor: profile.lookingFor, bio: profile.bio,
                mediaSlots: profile.mediaSlots, prompts: profile.prompts,
                instagramHandle: profile.instagramHandle,
                twitterHandle: profile.twitterHandle,
                websiteUrl: profile.websiteUrl,
                connectTier: tier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: isAdmin
            )

        case .music:
            ConnectProfileMusicView(
                displayName: displayName, avatarUrl: avatarUrl,
                username: username,
                headline: profile.headline, location: profile.location,
                lookingFor: profile.lookingFor, bio: profile.bio,
                mediaSlots: profile.mediaSlots, prompts: profile.prompts,
                instagramHandle: profile.instagramHandle,
                twitterHandle: profile.twitterHandle,
                websiteUrl: profile.websiteUrl,
                connectTier: tier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: isAdmin
            )

        case .threeD:
            ConnectProfileThreeDView(
                displayName: displayName, avatarUrl: avatarUrl,
                username: username,
                headline: profile.headline, location: profile.location,
                lookingFor: profile.lookingFor, bio: profile.bio,
                mediaSlots: profile.mediaSlots, prompts: profile.prompts,
                instagramHandle: profile.instagramHandle,
                twitterHandle: profile.twitterHandle,
                websiteUrl: profile.websiteUrl,
                connectTier: tier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: isAdmin
            )

        case .hire:
            ConnectProfileHireView(
                displayName: displayName, avatarUrl: avatarUrl,
                headline: profile.headline, location: profile.location,
                lookingFor: profile.lookingFor, bio: profile.bio,
                mediaSlots: profile.mediaSlots, prompts: profile.prompts,
                instagramHandle: profile.instagramHandle,
                twitterHandle: profile.twitterHandle,
                websiteUrl: profile.websiteUrl,
                connectTier: tier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: isAdmin,
                hireData: profile.hireData,
                inquiryActions: inquiryActions
            )

        case .client:
            ConnectProfileClientView(
                displayName: displayName, avatarUrl: avatarUrl,
                headline: profile.headline, location: profile.location,
                lookingFor: profile.lookingFor, bio: profile.bio,
                mediaSlots: profile.mediaSlots, prompts: profile.prompts,
                instagramHandle: profile.instagramHandle,
                twitterHandle: profile.twitterHandle,
                websiteUrl: profile.websiteUrl,
                connectTier: tier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: isAdmin,
                clientData: profile.clientData,
                inquiryActions: inquiryActions
            )

        case .default:
            ConnectProfileCard(
                displayName: displayName, avatarUrl: avatarUrl,
                headline: profile.headline, location: profile.location,
                lookingFor: profile.lookingFor, bio: profile.bio,
                mediaSlots: profile.mediaSlots, prompts: profile.prompts,
                instagramHandle: profile.instagramHandle,
                twitterHandle: profile.twitterHandle,
                websiteUrl: profile.websiteUrl,
                connectTier: tier,
                isAdmin: isAdmin
            )
        }
    }
}

// MARK: - Inquiry actions
//
// Templates that have a "send a note" CTA (Hire's Book a Call, Client's
// Apply Now) accept this struct so the host view can present a form
// sheet on tap. nil = render the CTA as inert / hidden.

struct ProfileInquiryActions {
    var onTapBookCall: () -> Void
    var onTapApplyNow: () -> Void
}
