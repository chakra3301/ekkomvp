import SwiftUI

/// Client-facing variant of the Connect profile (template = "HIRE").
/// Renders Variant 10 from the design handoff: availability status,
/// services rate card, past clients, testimonials, process, and a closing
/// CTA. Backed by `ConnectProfile.hireData` (a single JSON column) so the
/// shape can iterate without migrations.
///
/// Falls back to placeholder rows when a section is empty so the layout
/// stays legible on a brand-new Hire profile, and so edit-mode users have
/// an obvious place to tap.
struct ConnectProfileHireView: View {
    let displayName: String
    var avatarUrl: String?
    var headline: String?
    var location: String?
    var lookingFor: String?
    var bio: String?
    var mediaSlots: [MediaSlot] = []
    var prompts: [PromptEntry] = []
    var instagramHandle: String?
    var twitterHandle: String?
    var websiteUrl: String?
    var connectTier: ConnectTier = .FREE
    var likesReceivedCount: Int = 0
    var matchesCount: Int = 0
    var isAdmin: Bool = false
    var hireData: HireData?
    var editActions: ProfileEditActions? = nil
    /// Set when a non-owner is viewing this profile. Tapping the
    /// CTA opens the booking form sheet on the host.
    var inquiryActions: ProfileInquiryActions? = nil

    private let mono = "Menlo"

    private var status: StatusStyle {
        StatusStyle.from(hireData?.availability?.status)
    }

    private var availability: HireAvailability {
        hireData?.availability ?? HireAvailability()
    }

    private var services: [HireService] {
        hireData?.services ?? []
    }

    private var clients: [String] {
        hireData?.clients ?? []
    }

    private var testimonials: [HireTestimonial] {
        hireData?.testimonials ?? []
    }

    private var process: [HireProcessStep] {
        hireData?.process ?? []
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            statusHeader
            ctaRow
            servicesBlock
            clientsBlock
            testimonialsBlock
            processBlock
            bioBlock
            promptsBlock
            lookingForBlock
            socialsBlock
            finalCTA
            Spacer(minLength: 32)
        }
    }

    // MARK: - Status header

    private var statusHeader: some View {
        EditableSection(action: editActions?.onTapHireData) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .center, spacing: 14) {
                    AvatarView(url: avatarUrl, name: displayName, size: 68)

                    VStack(alignment: .leading, spacing: 6) {
                        statusPill
                        Text(displayName)
                            .font(.custom(EKKOFont.regular, size: 28))
                            .foregroundStyle(.primary)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                        Text(metaLine)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 0)
                }

                Rectangle()
                    .fill(Color.secondary.opacity(0.18))
                    .frame(height: 0.5)

                availabilityGrid
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(Color.secondary.opacity(0.08))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(status.tint.opacity(0.45), lineWidth: 1)
            )
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
    }

    private var statusPill: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(status.dot)
                .frame(width: 6, height: 6)
                .shadow(color: status.dot.opacity(0.7), radius: 4)
            Text(status.label)
                .font(.custom(mono, size: 9))
                .tracking(2.0)
                .foregroundStyle(status.tint)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(.ultraThinMaterial, in: Capsule())
        .overlay(Capsule().stroke(status.tint.opacity(0.6), lineWidth: 0.5))
    }

    private var metaLine: String {
        let parts = [headline, location].compactMap { $0?.isEmpty == false ? $0 : nil }
        return parts.isEmpty ? "Open for work" : parts.joined(separator: " · ")
    }

    private var availabilityGrid: some View {
        HStack(alignment: .top, spacing: 0) {
            availabilityCell("NEXT",  availability.next ?? "—")
            availabilityCell("SLOTS", firstWord(availability.capacity) ?? "—")
            availabilityCell("TZ",    availability.timezone ?? "—")
            availabilityCell("REPLY", availability.replyTime ?? "—")
        }
    }

    private func availabilityCell(_ key: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(key)
                .font(.custom(mono, size: 8))
                .tracking(2.0)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func firstWord(_ s: String?) -> String? {
        s?.split(separator: " ").first.map(String.init)
    }

    // MARK: - CTA row

    private var ctaRow: some View {
        VStack(spacing: 8) {
            HStack(spacing: 8) {
                startProjectButton
                if let email = availability.contactEmail, !email.isEmpty {
                    emailButton(email)
                }
            }

            if let email = availability.contactEmail, !email.isEmpty {
                Text("\(email) · reply \(availability.replyTime ?? "soon")")
                    .font(.custom(mono, size: 9))
                    .tracking(1.5)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 10)
    }

    @ViewBuilder
    private var startProjectButton: some View {
        Button {
            startProjectTapped()
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "sparkles")
                    .font(.system(size: 13, weight: .semibold))
                Text("Start a project")
                    .font(.system(size: 14, weight: .semibold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .foregroundStyle(.black)
        }
        .buttonStyle(.plain)
    }

    private func emailButton(_ email: String) -> some View {
        Button {
            if let url = URL(string: "mailto:\(email)") {
                UIApplication.shared.open(url)
            }
        } label: {
            Image(systemName: "envelope")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.primary)
                .frame(width: 48, height: 48)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.secondary.opacity(0.25), lineWidth: 0.5)
                )
        }
        .buttonStyle(.plain)
    }

    private func startProjectTapped() {
        // Priority order:
        //   1. Edit mode → open the Hire editor.
        //   2. Visitor + form available → open the booking form sheet.
        //   3. Visitor + only contact email set → open mailto: as a
        //      lightweight fallback (legacy path before the form).
        //   4. Owner without an editor (shouldn't happen) → no-op.
        if let onTap = editActions?.onTapHireData {
            onTap()
            return
        }
        if let inquiryActions {
            inquiryActions.onTapBookCall()
            return
        }
        if let email = availability.contactEmail, !email.isEmpty,
           let url = URL(string: "mailto:\(email)?subject=Project%20inquiry") {
            UIApplication.shared.open(url)
        }
    }

    // MARK: - Services / rate card

    @ViewBuilder
    private var servicesBlock: some View {
        if !services.isEmpty {
            EditableSection(action: editActions?.onTapHireData) {
                VStack(alignment: .leading, spacing: 10) {
                    sectionLabel("SERVICES / RATE CARD")
                    VStack(spacing: 0) {
                        ForEach(Array(services.enumerated()), id: \.offset) { idx, svc in
                            serviceRow(svc)
                            if idx < services.count - 1 {
                                Rectangle()
                                    .fill(Color.secondary.opacity(0.18))
                                    .frame(height: 0.5)
                            }
                        }
                    }
                    .background(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(Color.secondary.opacity(0.06))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(Color.secondary.opacity(0.18), lineWidth: 0.5)
                    )
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        } else if editActions?.onTapHireData != nil {
            EditableSection(action: editActions?.onTapHireData) {
                placeholderRow(label: "Services", hint: "Add your rate card")
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    private func serviceRow(_ svc: HireService) -> some View {
        HStack(alignment: .center, spacing: 10) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(svc.name)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.primary)
                    if let tag = svc.tag, !tag.isEmpty {
                        Text(tag.uppercased())
                            .font(.custom(mono, size: 8))
                            .tracking(1.5)
                            .foregroundStyle(.black)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 4))
                    }
                }
                if let lead = svc.lead, !lead.isEmpty {
                    Text("LEAD TIME · \(lead.uppercased())")
                        .font(.custom(mono, size: 9))
                        .tracking(1.2)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                if let from = svc.from, !from.isEmpty {
                    Text(from)
                        .font(.custom(EKKOFont.regular, size: 18))
                        .foregroundStyle(.primary)
                }
                if let unit = svc.unit, !unit.isEmpty {
                    Text(unit)
                        .font(.custom(mono, size: 9))
                        .tracking(0.8)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
    }

    // MARK: - Clients

    @ViewBuilder
    private var clientsBlock: some View {
        if !clients.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                EditableSection(action: editActions?.onTapHireData) {
                    sectionLabel("TRUSTED BY")
                }
                .padding(.horizontal, 20)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Array(clients.enumerated()), id: \.offset) { _, name in
                            Text(name)
                                .font(.custom(EKKOFont.regular, size: 16))
                                .foregroundStyle(.primary)
                                .padding(.horizontal, 14)
                                .padding(.vertical, 10)
                                .background(
                                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                                        .fill(Color.secondary.opacity(0.08))
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                                        .stroke(Color.secondary.opacity(0.18), lineWidth: 0.5)
                                )
                                .fixedSize()
                        }
                    }
                    .padding(.horizontal, 20)
                }
            }
            .padding(.top, 22)
        }
    }

    // MARK: - Testimonials

    @ViewBuilder
    private var testimonialsBlock: some View {
        if !testimonials.isEmpty {
            EditableSection(action: editActions?.onTapHireData) {
                VStack(alignment: .leading, spacing: 12) {
                    sectionLabel("KIND WORDS")
                    VStack(spacing: 10) {
                        ForEach(Array(testimonials.enumerated()), id: \.offset) { _, t in
                            testimonialCard(t)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    private func testimonialCard(_ t: HireTestimonial) -> some View {
        ZStack(alignment: .topTrailing) {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(Color.secondary.opacity(0.06))
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(Color.secondary.opacity(0.18), lineWidth: 0.5)

            // Accent bar on the leading edge.
            HStack(spacing: 0) {
                Rectangle()
                    .fill(Color.accentColor)
                    .frame(width: 2)
                Spacer()
            }
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            // Big closing quote glyph in the corner.
            Text("\u{275E}")
                .font(.custom(EKKOFont.regular, size: 36))
                .foregroundStyle(Color.accentColor.opacity(0.5))
                .padding(.trailing, 10)
                .padding(.top, 6)

            VStack(alignment: .leading, spacing: 10) {
                Text("\u{201C}\(t.quote)\u{201D}")
                    .font(.subheadline.italic())
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)
                    .lineSpacing(2)
                    .padding(.trailing, 24)
                HStack(spacing: 8) {
                    Text(t.by)
                        .font(.custom(mono, size: 10))
                        .tracking(0.8)
                        .foregroundStyle(.primary)
                    if let role = t.role, !role.isEmpty {
                        Text("·")
                            .foregroundStyle(.secondary)
                        Text(role)
                            .font(.custom(mono, size: 10))
                            .tracking(0.8)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.leading, 14)
            .padding(.trailing, 14)
            .padding(.vertical, 14)
        }
    }

    // MARK: - Process

    @ViewBuilder
    private var processBlock: some View {
        if !process.isEmpty {
            EditableSection(action: editActions?.onTapHireData) {
                VStack(alignment: .leading, spacing: 0) {
                    sectionLabel("HOW WE WORK")
                        .padding(.bottom, 8)
                    ForEach(Array(process.enumerated()), id: \.offset) { idx, step in
                        processRow(step, number: idx + 1)
                        if idx < process.count - 1 {
                            DashedDividerLine()
                                .frame(height: 0.5)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    private func processRow(_ step: HireProcessStep, number: Int) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text(String(format: "%02d", number))
                .font(.custom(EKKOFont.regular, size: 28))
                .foregroundStyle(.tint)
                .frame(width: 44, alignment: .leading)
            VStack(alignment: .leading, spacing: 4) {
                Text(step.title.uppercased())
                    .font(.custom(mono, size: 11))
                    .tracking(2.0)
                    .foregroundStyle(.primary)
                if let detail = step.detail, !detail.isEmpty {
                    Text(detail)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: 0)
            if let length = step.length, !length.isEmpty {
                Text(length.uppercased())
                    .font(.custom(mono, size: 9))
                    .tracking(1.5)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 14)
    }

    // MARK: - Reused blocks (bio / prompts / lookingFor / socials)

    @ViewBuilder
    private var bioBlock: some View {
        if let bio, !bio.isEmpty {
            EditableSection(action: editActions?.onTapBio) {
                VStack(alignment: .leading, spacing: 10) {
                    sectionLabel("ABOUT")
                    Text(bio)
                        .font(.body)
                        .foregroundStyle(.primary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        } else if editActions != nil {
            EditableSection(action: editActions?.onTapBio) {
                placeholderRow(label: "About", hint: "Add a short bio")
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    @ViewBuilder
    private var promptsBlock: some View {
        if !prompts.isEmpty {
            EditableSection(action: editActions?.onTapPrompts) {
                VStack(alignment: .leading, spacing: 12) {
                    sectionLabel("CAPABILITIES")
                    VStack(spacing: 10) {
                        ForEach(Array(prompts.enumerated()), id: \.offset) { _, prompt in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(prompt.question)
                                    .font(.caption.weight(.medium))
                                    .foregroundStyle(.secondary)
                                Text(prompt.answer)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(.primary)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(14)
                            .glassCard()
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    @ViewBuilder
    private var lookingForBlock: some View {
        if let lookingFor, !lookingFor.isEmpty {
            EditableSection(action: editActions?.onTapLookingFor) {
                VStack(alignment: .leading, spacing: 12) {
                    sectionLabel("LOOKING FOR")
                    Text(lookingFor)
                        .font(.body)
                        .foregroundStyle(.primary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(14)
                        .glassCard()
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    @ViewBuilder
    private var socialsBlock: some View {
        let hasAny = (instagramHandle?.isEmpty == false) ||
                     (twitterHandle?.isEmpty == false) ||
                     (websiteUrl?.isEmpty == false)

        if hasAny || editActions != nil {
            VStack(alignment: .leading, spacing: 12) {
                EditableSection(action: editActions?.onTapSocials) {
                    sectionLabel("ELSEWHERE")
                }

                if hasAny {
                    VStack(spacing: 12) {
                        if let ig = instagramHandle, !ig.isEmpty {
                            InstagramPreview(handle: ig)
                        }
                        if let tw = twitterHandle, !tw.isEmpty {
                            TwitterPreview(handle: tw)
                        }
                        if let web = websiteUrl, !web.isEmpty {
                            websiteRow(url: web)
                        }
                    }
                } else {
                    EditableSection(action: editActions?.onTapSocials) {
                        placeholderRow(label: "Socials", hint: "Add Instagram, X, or website")
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    private func websiteRow(url: String) -> some View {
        Button {
            let str = url.hasPrefix("http") ? url : "https://\(url)"
            if let u = URL(string: str) { UIApplication.shared.open(u) }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "globe").foregroundStyle(.secondary)
                Text(cleanDisplayURL(url))
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                Spacer()
                Image(systemName: "arrow.up.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
        }
        .buttonStyle(.plain)
        .glassBubble(cornerRadius: 18)
    }

    // MARK: - Final CTA

    private var finalCTA: some View {
        let tagline = (hireData?.ctaTagline?.isEmpty == false ? hireData?.ctaTagline : nil)
            ?? "Let's make\nsomething strange."

        return EditableSection(action: editActions?.onTapHireData) {
            VStack(spacing: 12) {
                JPSubLabel(text: "\u{2726}  一緒に作りませんか  \u{2726}", size: 10, color: Color.accentColor, opacity: 1)
                Text(tagline)
                    .font(.custom(EKKOFont.regular, size: 28))
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)

                Button {
                    startProjectTapped()
                } label: {
                    Text("BOOK A CALL  →")
                        .font(.system(size: 13, weight: .bold))
                        .tracking(1.0)
                        .foregroundStyle(.black)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(Color.accentColor, in: Capsule())
                }
                .buttonStyle(.plain)
                .padding(.top, 4)
            }
            .frame(maxWidth: .infinity)
            .padding(22)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(Color.secondary.opacity(0.06))
                    LinearGradient(
                        colors: [Color.accentColor.opacity(0.18), .clear],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.accentColor.opacity(0.45), lineWidth: 1)
            )
        }
        .padding(.horizontal, 16)
        .padding(.top, 26)
    }

    // MARK: - Helpers

    private func sectionLabel(_ text: String) -> some View {
        HStack(alignment: .center, spacing: 12) {
            Text(text)
                .font(.custom(mono, size: 11))
                .tracking(2.5)
                .foregroundStyle(.tint)
            Rectangle()
                .fill(Color.secondary.opacity(0.2))
                .frame(height: 0.5)
        }
    }

    private func placeholderRow(label: String, hint: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text(hint)
                    .font(.subheadline)
                    .foregroundStyle(.secondary.opacity(0.7))
            }
            Spacer()
            Image(systemName: "plus.circle")
                .foregroundStyle(.tint)
        }
    }

    private func cleanDisplayURL(_ url: String) -> String {
        url.replacingOccurrences(of: "https://", with: "")
           .replacingOccurrences(of: "http://", with: "")
           .replacingOccurrences(of: "www.", with: "")
           .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }
}

// MARK: - Status style
//
// Maps the stored status string to the colors and label shown in the
// header pill. Unknown / nil values default to BOOKING (the most common
// initial state for someone on the Hire template).

private struct StatusStyle {
    let label: String
    let dot: Color
    let tint: Color

    static func from(_ raw: String?) -> StatusStyle {
        switch raw?.uppercased() {
        case "LIMITED":
            return .init(label: "LIMITED",
                         dot: Color(red: 1.0, green: 0.70, blue: 0.24),
                         tint: Color(red: 1.0, green: 0.70, blue: 0.24))
        case "CLOSED":
            return .init(label: "CLOSED",
                         dot: Color(red: 1.0, green: 0.24, blue: 0.35),
                         tint: Color(red: 1.0, green: 0.24, blue: 0.35))
        default:
            return .init(label: "BOOKING",
                         dot: Color(red: 0.20, green: 0.89, blue: 0.48),
                         tint: Color.accentColor)
        }
    }
}

// MARK: - Dashed divider line
//
// A custom dashed horizontal line used between process steps. SwiftUI's
// built-in Divider doesn't support dashes; rolling a tiny Shape is the
// cleanest fix.

private struct DashedDividerLine: View {
    var body: some View {
        GeometryReader { geo in
            Path { path in
                path.move(to: CGPoint(x: 0, y: 0))
                path.addLine(to: CGPoint(x: geo.size.width, y: 0))
            }
            .stroke(
                Color.secondary.opacity(0.4),
                style: StrokeStyle(lineWidth: 0.5, dash: [4, 4])
            )
        }
        .frame(height: 0.5)
    }
}
