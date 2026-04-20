import SwiftUI
import Kingfisher

/// Hiring-side variant of the Connect profile (template = "CLIENT").
/// Renders Variant 11 from the design handoff: the user IS the company —
/// brand hero, open briefs, past hires, hiring criteria, track record,
/// and culture. Backed by `ConnectProfile.clientData` (single JSON column).
///
/// Like the Hire template, every section degrades to a placeholder when
/// empty so the layout reads cleanly on a brand-new Client profile.
struct ConnectProfileClientView: View {
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
    var clientData: ClientData?
    var editActions: ProfileEditActions? = nil

    private let mono = "Menlo"

    private var data: ClientData {
        clientData ?? ClientData()
    }

    private var briefs: [ClientBrief] { data.briefs ?? [] }
    private var pastHires: [ClientPastHire] { data.pastHires ?? [] }
    private var lookingForList: [String] { data.lookingFor ?? [] }
    private var culture: [String] { data.culture ?? [] }
    private var stats: ClientStats { data.stats ?? ClientStats() }

    private var companyName: String {
        let raw = data.company?.trimmingCharacters(in: .whitespaces)
        return (raw?.isEmpty == false ? raw : nil) ?? displayName
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            heroCard
            companyMetaRow
            ctaRow
            briefsBlock
            lookingForBlock
            pastHiresBlock
            trackRecordBlock
            cultureBlock
            finalPitch
            Spacer(minLength: 32)
        }
    }

    // MARK: - Hero card

    private var heroCard: some View {
        EditableSection(action: editActions?.onTapClientData) {
            ZStack(alignment: .bottomLeading) {
                heroBackground
                heroOverlay
                heroChips
                heroNameBlock
            }
            .frame(maxWidth: .infinity)
            .aspectRatio(16.0 / 10.0, contentMode: .fit)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Color.secondary.opacity(0.25), lineWidth: 0.5)
            )
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
    }

    @ViewBuilder
    private var heroBackground: some View {
        // Use the first media slot as the brand cover when present;
        // otherwise paint an accent gradient so the card never reads as
        // empty.
        if let coverUrl = mediaSlots.sorted(by: { $0.sortOrder < $1.sortOrder }).first(where: { !$0.isAudio && !$0.isModel })?.url,
           let url = URL(string: coverUrl) {
            KFImage(url)
                .resizable()
                .scaledToFill()
        } else {
            LinearGradient(
                colors: [
                    Color.accentColor.opacity(0.6),
                    Color.accentColor.opacity(0.15),
                    .black.opacity(0.4),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    private var heroOverlay: some View {
        LinearGradient(
            colors: [
                .black.opacity(0.3),
                .clear,
                .black.opacity(0.85),
            ],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    private var heroChips: some View {
        VStack {
            HStack {
                hiringPill
                Spacer()
                if data.verified == true {
                    verifiedPill
                }
            }
            .padding(12)
            Spacer()
        }
    }

    private var hiringPill: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(Color.accentColor)
                .frame(width: 6, height: 6)
                .shadow(color: Color.accentColor.opacity(0.7), radius: 4)
            Text(briefs.isEmpty ? "HIRING" : "HIRING \u{B7} \(briefs.count) OPEN")
                .font(.custom(mono, size: 9))
                .tracking(2.0)
                .foregroundStyle(Color.accentColor)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(.black.opacity(0.5), in: Capsule())
        .overlay(Capsule().stroke(Color.accentColor.opacity(0.6), lineWidth: 0.5))
    }

    private var verifiedPill: some View {
        HStack(spacing: 4) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(Color.accentColor)
            Text("VERIFIED CLIENT")
                .font(.custom(mono, size: 9))
                .tracking(1.5)
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(.black.opacity(0.5), in: Capsule())
    }

    private var heroNameBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            if let jp = data.jpName, !jp.isEmpty {
                Text("\u{2726}  \(jp)  \u{2726}")
                    .font(.custom(JPFont.family, size: 10))
                    .tracking(2.5)
                    .foregroundStyle(Color.accentColor)
            }
            Text(companyName)
                .font(.custom(EKKOFont.regular, size: 34))
                .foregroundStyle(.white)
                .lineLimit(2)
                .minimumScaleFactor(0.6)
                .shadow(color: Color.accentColor.opacity(0.5), radius: 12)
            if let tagline = data.tagline, !tagline.isEmpty {
                Text(tagline)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.8))
                    .lineLimit(2)
            } else if let headline, !headline.isEmpty {
                Text(headline)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.8))
                    .lineLimit(2)
            }
        }
        .padding(16)
    }

    // MARK: - Company meta row

    private var companyMetaRow: some View {
        HStack(spacing: 0) {
            metaCell("SIZE",     data.size ?? "—")
            metaDivider
            metaCell("FOUNDED",  data.founded ?? "—")
            metaDivider
            metaCell("REPLY",    stats.response ?? "—")
        }
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(Color.secondary.opacity(0.06))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(Color.secondary.opacity(0.18), lineWidth: 0.5)
        )
        .padding(.horizontal, 16)
        .padding(.top, 10)
    }

    private func metaCell(_ key: String, _ value: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.custom(EKKOFont.regular, size: 18))
                .foregroundStyle(.primary)
            Text(key)
                .font(.custom(mono, size: 8))
                .tracking(2.0)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
    }

    private var metaDivider: some View {
        Rectangle()
            .fill(Color.secondary.opacity(0.18))
            .frame(width: 0.5, height: 32)
    }

    // MARK: - CTA row

    private var ctaRow: some View {
        HStack(spacing: 8) {
            Button {
                applyTapped()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 13, weight: .semibold))
                    Text(applyLabel)
                        .font(.system(size: 14, weight: .semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .foregroundStyle(.black)
            }
            .buttonStyle(.plain)

            secondaryIconButton(systemName: "star")
            if let site = data.website, !site.isEmpty {
                secondaryIconButton(systemName: "arrow.up.right") {
                    let str = site.hasPrefix("http") ? site : "https://\(site)"
                    if let u = URL(string: str) { UIApplication.shared.open(u) }
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 10)
    }

    private var applyLabel: String {
        let name = (data.company?.split(separator: " ").first).map(String.init)?.uppercased() ?? "US"
        return "Apply to \(name)"
    }

    private func secondaryIconButton(systemName: String, action: (() -> Void)? = nil) -> some View {
        Button {
            if let action {
                action()
            } else if let onTap = editActions?.onTapClientData {
                onTap()
            }
        } label: {
            Image(systemName: systemName)
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

    private func applyTapped() {
        if let onTap = editActions?.onTapClientData {
            onTap()
        }
        // No real apply flow on the user's own profile — in display mode
        // this would open an apply sheet on someone else's profile, but
        // here it's a no-op.
    }

    // MARK: - Open briefs

    @ViewBuilder
    private var briefsBlock: some View {
        if !briefs.isEmpty {
            EditableSection(action: editActions?.onTapClientData) {
                VStack(alignment: .leading, spacing: 12) {
                    sectionLabel("OPEN BRIEFS \u{B7} \(briefs.count)")
                    VStack(spacing: 10) {
                        ForEach(Array(briefs.enumerated()), id: \.offset) { _, b in
                            briefCard(b)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        } else if editActions?.onTapClientData != nil {
            EditableSection(action: editActions?.onTapClientData) {
                placeholderRow(label: "Open briefs", hint: "Add a role or project")
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    private func briefCard(_ b: ClientBrief) -> some View {
        let isUrgent = (b.priority?.lowercased() == "urgent")

        return ZStack(alignment: .topTrailing) {
            VStack(alignment: .leading, spacing: 10) {
                Text("\((b.type ?? "open").uppercased()) \u{B7} STARTS \((b.starts ?? "—").uppercased())")
                    .font(.custom(mono, size: 9))
                    .tracking(2.0)
                    .foregroundStyle(Color.accentColor)
                    .padding(.trailing, isUrgent ? 70 : 0)

                Text(b.title)
                    .font(.custom(EKKOFont.regular, size: 19))
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.trailing, isUrgent ? 70 : 0)

                if let tags = b.tags, !tags.isEmpty {
                    HStack(spacing: 4) {
                        ForEach(Array(tags.enumerated()), id: \.offset) { _, t in
                            Text(t)
                                .font(.custom(mono, size: 9))
                                .tracking(0.6)
                                .foregroundStyle(Color.accentColor)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 3)
                                .background(Color.accentColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
                        }
                    }
                }

                DashedDividerLine()
                    .frame(height: 0.5)

                HStack(alignment: .bottom, spacing: 12) {
                    briefMetaCell("BUDGET",   b.budget ?? "—")
                    briefMetaCell("TIMELINE", b.timeline ?? "—")
                    Spacer()
                    if let n = b.applicants {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("\(n)")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(.primary)
                            Text("applied")
                                .font(.custom(mono, size: 9))
                                .tracking(0.8)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Color.secondary.opacity(0.06))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(isUrgent ? Color.accentColor : Color.secondary.opacity(0.18),
                            lineWidth: isUrgent ? 1 : 0.5)
            )

            if isUrgent {
                Text("\u{25CF} URGENT")
                    .font(.custom(mono, size: 8))
                    .tracking(2.0)
                    .foregroundStyle(.black)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 3)
                    .background(Color.accentColor)
                    .clipShape(
                        UnevenRoundedRectangle(
                            cornerRadii: .init(topLeading: 0, bottomLeading: 8, bottomTrailing: 0, topTrailing: 12),
                            style: .continuous
                        )
                    )
            }
        }
    }

    private func briefMetaCell(_ key: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(key)
                .font(.custom(mono, size: 8))
                .tracking(2.0)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)
        }
    }

    // MARK: - What we look for

    @ViewBuilder
    private var lookingForBlock: some View {
        if !lookingForList.isEmpty {
            EditableSection(action: editActions?.onTapClientData) {
                VStack(alignment: .leading, spacing: 12) {
                    sectionLabel("WHAT WE LOOK FOR")
                    VStack(spacing: 0) {
                        ForEach(Array(lookingForList.enumerated()), id: \.offset) { idx, line in
                            lookingForRow(idx: idx, line: line)
                            if idx < lookingForList.count - 1 {
                                DashedDividerLine().frame(height: 0.5)
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    private func lookingForRow(idx: Int, line: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(String(format: "0%d", idx + 1))
                .font(.custom(mono, size: 11))
                .tracking(0.8)
                .foregroundStyle(Color.accentColor)
                .frame(width: 28, alignment: .leading)
            Text(line)
                .font(.subheadline)
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 10)
    }

    // MARK: - Past hires

    @ViewBuilder
    private var pastHiresBlock: some View {
        if !pastHires.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                EditableSection(action: editActions?.onTapClientData) {
                    sectionLabel("WE'VE HIRED \u{B7} \(pastHires.count)+")
                }
                .padding(.horizontal, 20)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Array(pastHires.enumerated()), id: \.offset) { _, h in
                            pastHireCard(h)
                        }
                    }
                    .padding(.horizontal, 20)
                }
            }
            .padding(.top, 22)
        }
    }

    private func pastHireCard(_ h: ClientPastHire) -> some View {
        let ringColor = (h.color.flatMap { Color(hex: $0) }) ?? Color.accentColor
        let initial = h.name.first.map { String($0).uppercased() } ?? "?"

        return VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(
                        AngularGradient(
                            colors: [ringColor, ringColor.opacity(0.2), ringColor],
                            center: .center
                        )
                    )
                    .frame(width: 50, height: 50)
                Circle()
                    .fill(Color(.systemBackground))
                    .frame(width: 42, height: 42)
                Text(initial)
                    .font(.custom(mono, size: 14).weight(.bold))
                    .foregroundStyle(ringColor)
            }
            Text(h.name)
                .font(.custom(mono, size: 10))
                .foregroundStyle(.primary)
                .lineLimit(1)
            if let role = h.role, !role.isEmpty {
                Text(role.uppercased())
                    .font(.custom(mono, size: 8))
                    .tracking(2.0)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(width: 110)
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(Color.secondary.opacity(0.06))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(Color.secondary.opacity(0.18), lineWidth: 0.5)
        )
    }

    // MARK: - Track record

    @ViewBuilder
    private var trackRecordBlock: some View {
        let cells: [(String, String)] = [
            ("HIRES",    stats.hires.map { "\($0)" } ?? "—"),
            ("AVG TIME", stats.avgDays ?? "—"),
            ("REPLIES",  stats.response ?? "—"),
            ("REPEAT",   stats.repeatRate ?? "—"),
        ]
        let hasAny = cells.contains { $0.1 != "—" }

        if hasAny || editActions?.onTapClientData != nil {
            EditableSection(action: editActions?.onTapClientData) {
                VStack(alignment: .leading, spacing: 12) {
                    sectionLabel("TRACK RECORD")
                    HStack(spacing: 0) {
                        ForEach(Array(cells.enumerated()), id: \.offset) { idx, cell in
                            trackCell(key: cell.0, value: cell.1)
                            if idx < cells.count - 1 {
                                Rectangle()
                                    .fill(Color.secondary.opacity(0.18))
                                    .frame(width: 0.5, height: 36)
                            }
                        }
                    }
                    .background(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(Color.secondary.opacity(0.06))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .stroke(Color.secondary.opacity(0.18), lineWidth: 0.5)
                    )
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    private func trackCell(key: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.custom(EKKOFont.regular, size: 20))
                .foregroundStyle(.primary)
            Text(key)
                .font(.custom(mono, size: 8))
                .tracking(2.0)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
    }

    // MARK: - Culture

    @ViewBuilder
    private var cultureBlock: some View {
        if !culture.isEmpty {
            EditableSection(action: editActions?.onTapClientData) {
                VStack(alignment: .leading, spacing: 10) {
                    sectionLabel("CULTURE")
                    FlowLayout(spacing: 5) {
                        ForEach(Array(culture.enumerated()), id: \.offset) { _, c in
                            Text(c)
                                .font(.caption.weight(.medium))
                                .foregroundStyle(Color.accentColor)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(
                                    Capsule().stroke(Color.accentColor.opacity(0.5), lineWidth: 0.5)
                                )
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    // MARK: - Final pitch

    private var finalPitch: some View {
        let tagline = (data.ctaTagline?.isEmpty == false ? data.ctaTagline : nil)
            ?? "Think you'd fit?\nSend us one piece."

        return EditableSection(action: editActions?.onTapClientData) {
            VStack(spacing: 12) {
                JPSubLabel(text: "\u{2726}  君の番だ  \u{2726}", size: 10, color: Color.accentColor, opacity: 1)
                Text(tagline)
                    .font(.custom(EKKOFont.regular, size: 26))
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)

                Button {
                    applyTapped()
                } label: {
                    Text("APPLY NOW  →")
                        .font(.system(size: 13, weight: .bold))
                        .tracking(1.0)
                        .foregroundStyle(.black)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(Color.accentColor, in: Capsule())
                }
                .buttonStyle(.plain)
                .padding(.top, 4)

                if let avg = stats.avgDays, !avg.isEmpty {
                    Text("avg. response in \(avg)")
                        .font(.custom(mono, size: 9))
                        .tracking(1.5)
                        .foregroundStyle(.secondary)
                }
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
                .foregroundStyle(Color.accentColor)
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
                .foregroundStyle(Color.accentColor)
        }
    }
}

// MARK: - Dashed divider line
//
// Local copy of the same helper used by the Hire view. SwiftUI's Divider
// has no dashed mode; rolling a tiny Path is the cleanest fix and keeping
// it private avoids cross-file coupling.

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

// MARK: - Flow layout
//
// Wraps culture chips onto multiple rows. SwiftUI doesn't ship a flow
// layout — the explicit Layout protocol implementation is small and
// avoids dragging in a third-party dependency.

private struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        let rows = computeRows(width: width, subviews: subviews)
        let height = rows.reduce(CGFloat(0)) { $0 + $1.height + spacing } - spacing
        return CGSize(width: width.isFinite ? width : 0, height: max(0, height))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = computeRows(width: bounds.width, subviews: subviews)
        var y = bounds.minY
        for row in rows {
            var x = bounds.minX
            for item in row.items {
                let size = subviews[item.index].sizeThatFits(.unspecified)
                subviews[item.index].place(
                    at: CGPoint(x: x, y: y + (row.height - size.height) / 2),
                    proposal: ProposedViewSize(size)
                )
                x += size.width + spacing
            }
            y += row.height + spacing
        }
    }

    private struct Row {
        var items: [(index: Int, width: CGFloat)] = []
        var height: CGFloat = 0
        var width: CGFloat = 0
    }

    private func computeRows(width: CGFloat, subviews: Subviews) -> [Row] {
        var rows: [Row] = [Row()]
        for index in subviews.indices {
            let size = subviews[index].sizeThatFits(.unspecified)
            let needed = (rows[rows.count - 1].items.isEmpty ? 0 : spacing) + size.width
            if rows[rows.count - 1].width + needed > width, !rows[rows.count - 1].items.isEmpty {
                rows.append(Row())
            }
            let extra = rows[rows.count - 1].items.isEmpty ? 0 : spacing
            rows[rows.count - 1].items.append((index, size.width))
            rows[rows.count - 1].width += extra + size.width
            rows[rows.count - 1].height = max(rows[rows.count - 1].height, size.height)
        }
        return rows
    }
}
