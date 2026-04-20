import SwiftUI

// MARK: - Section identifier
//
// One-of selector for which inline editor sheet is currently presented from
// ProfileView's edit mode. The associated value carries a binding-friendly
// payload so each sheet only sees the slice of state it cares about.

enum ProfileEditSection: Identifiable {
    case media
    case headlineHeadlineLocation // headline + location pair
    case bio
    case lookingFor
    case prompts
    case socials
    case mediaTitle(Int) // edit one MediaSlot's caption
    case audioMeta(Int)  // edit one audio MediaSlot's BPM + KEY
    case hireData        // edit the Hire-template payload
    case clientData      // edit the Client-template payload

    var id: String {
        switch self {
        case .media: return "media"
        case .headlineHeadlineLocation: return "headlineLocation"
        case .bio: return "bio"
        case .lookingFor: return "lookingFor"
        case .prompts: return "prompts"
        case .socials: return "socials"
        case .mediaTitle(let i): return "mediaTitle-\(i)"
        case .audioMeta(let i): return "audioMeta-\(i)"
        case .hireData: return "hireData"
        case .clientData: return "clientData"
        }
    }

    var title: String {
        switch self {
        case .media: return "Media"
        case .headlineHeadlineLocation: return "Headline & Location"
        case .bio: return "About"
        case .lookingFor: return "Looking For"
        case .prompts: return "Prompts"
        case .socials: return "Socials"
        case .mediaTitle: return "Caption"
        case .audioMeta: return "Track Info"
        case .hireData: return "Hire Setup"
        case .clientData: return "Hiring Setup"
        }
    }
}

// MARK: - Edit actions

/// Closures the templates call when a section is tapped. When this is `nil`,
/// the templates render in pure display mode (no edit chrome, no tap targets).
struct ProfileEditActions {
    var onTapMedia: () -> Void
    var onTapHeadlineLocation: () -> Void
    var onTapBio: () -> Void
    var onTapLookingFor: () -> Void
    var onTapPrompts: () -> Void
    var onTapSocials: () -> Void
    /// Per-slot caption editor. Optional — only Editorial uses captions.
    var onEditMediaTitle: ((Int) -> Void)? = nil
    /// Per-slot audio metadata editor (BPM + KEY). Optional — only the
    /// Music template surfaces this.
    var onEditAudioMeta: ((Int) -> Void)? = nil
    /// Edit the Hire-template payload (availability, services, clients,
    /// testimonials, process). Optional — only the Hire template uses it.
    var onTapHireData: (() -> Void)? = nil
    /// Edit the Client-template payload (company info, briefs, hires,
    /// criteria, stats, culture). Optional — only the Client template
    /// uses it.
    var onTapClientData: (() -> Void)? = nil
}

// MARK: - Editable section wrapper
//
// Adds the dashed accent border + tap behavior used in edit mode. When
// `action` is nil the content renders unchanged so the same template code
// works for both display and edit modes.

struct EditableSection<Content: View>: View {
    let action: (() -> Void)?
    let placeholder: String?
    @ViewBuilder let content: () -> Content

    init(action: (() -> Void)?,
         placeholder: String? = nil,
         @ViewBuilder content: @escaping () -> Content) {
        self.action = action
        self.placeholder = placeholder
        self.content = content
    }

    var body: some View {
        if let action {
            Button(action: action) {
                ZStack(alignment: .topTrailing) {
                    content()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .strokeBorder(Color.accentColor.opacity(0.55), style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
                        )
                    Image(systemName: "pencil")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(5)
                        .background(Circle().fill(Color.accentColor))
                        .offset(x: 4, y: -4)
                }
            }
            .buttonStyle(.plain)
        } else {
            content()
        }
    }
}

// MARK: - Generic text editor sheet
//
// Used for bio / lookingFor (multi-line) and headline / location (single-line).

struct ProfileTextEditorSheet: View {
    @Environment(\.dismiss) private var dismiss

    let title: String
    var japaneseTitle: String? = nil
    let placeholder: String
    let charLimit: Int?
    let multiline: Bool
    @Binding var text: String

    @State private var draft: String = ""

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                if multiline {
                    TextEditor(text: $draft)
                        .frame(minHeight: 160)
                        .padding(8)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    TextField(placeholder, text: $draft)
                        .padding(12)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                if let charLimit {
                    HStack {
                        Spacer()
                        Text("\(draft.count) / \(charLimit)")
                            .font(.caption)
                            .foregroundStyle(draft.count > charLimit ? .red : .secondary)
                    }
                }

                Spacer()
            }
            .padding(20)
            .modifier(MaybeFuriganaTitle(english: title, japanese: japaneseTitle))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        text = draft
                        dismiss()
                    }
                    .disabled(charLimit.map { draft.count > $0 } ?? false)
                }
            }
            .onAppear { draft = text }
        }
    }
}

// MARK: - Headline + Location combined sheet

struct ProfileHeadlineLocationSheet: View {
    @Environment(\.dismiss) private var dismiss

    @Binding var headline: String
    @Binding var location: String

    @State private var headlineDraft: String = ""
    @State private var locationDraft: String = ""

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Headline")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)
                    TextField("e.g. Graphic Designer & Illustrator", text: $headlineDraft)
                        .padding(12)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("Location")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)
                    TextField("e.g. Los Angeles, CA", text: $locationDraft)
                        .padding(12)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                Spacer()
            }
            .padding(20)
            .furiganaTitle("Headline & Location", JPLabels.sections.headlineLocation)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        headline = headlineDraft
                        location = locationDraft
                        dismiss()
                    }
                }
            }
            .onAppear {
                headlineDraft = headline
                locationDraft = location
            }
        }
    }
}

// MARK: - Socials sheet

struct ProfileSocialsSheet: View {
    @Environment(\.dismiss) private var dismiss

    @Binding var instagramHandle: String
    @Binding var twitterHandle: String
    @Binding var websiteUrl: String

    @State private var instagramDraft = ""
    @State private var twitterDraft = ""
    @State private var websiteDraft = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    socialRow(icon: "camera", prefix: "@", placeholder: "instagram", text: $instagramDraft)
                    socialRow(icon: "at",     prefix: "@", placeholder: "twitter",   text: $twitterDraft)
                    socialRow(icon: "globe",  prefix: nil, placeholder: "https://your-website.com", text: $websiteDraft, keyboard: .URL)
                }
                .padding(20)
            }
            .furiganaTitle("Socials", JPLabels.sections.socials)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        instagramHandle = instagramDraft
                        twitterHandle = twitterDraft
                        websiteUrl = websiteDraft
                        dismiss()
                    }
                }
            }
            .onAppear {
                instagramDraft = instagramHandle
                twitterDraft = twitterHandle
                websiteDraft = websiteUrl
            }
        }
    }

    @ViewBuilder
    private func socialRow(icon: String, prefix: String?, placeholder: String, text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
            if let prefix {
                Text(prefix).foregroundStyle(.secondary)
            }
            TextField(placeholder, text: text)
                .keyboardType(keyboard)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
        }
        .padding(12)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Media sheet (wraps existing MediaSlotGrid)

struct ProfileMediaSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var mediaSlots: [MediaSlot]
    let userId: String

    var body: some View {
        NavigationStack {
            ScrollView {
                MediaSlotGrid(slots: $mediaSlots, userId: userId)
                    .padding(16)
            }
            .furiganaTitle("Media", JPLabels.sections.media)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Prompts sheet (wraps existing PromptEditor)

struct ProfilePromptsSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var prompts: [PromptEntry]

    var body: some View {
        NavigationStack {
            ScrollView {
                PromptEditor(prompts: $prompts)
                    .padding(16)
            }
            .furiganaTitle("Prompts", JPLabels.sections.prompts)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Audio metadata sheet (BPM + KEY)
//
// Used by the Music template to let the user fill in the BPM and musical
// key of an audio slot. Connect doesn't analyse audio at upload, so these
// values are user-entered and stored on the MediaSlot JSON.

struct ProfileAudioMetaSheet: View {
    @Environment(\.dismiss) private var dismiss

    @Binding var bpm: Int?
    @Binding var key: String?

    @State private var bpmDraft: String = ""
    @State private var keyDraft: String = ""

    /// Common keys, surfaced as quick chips so users don't have to type
    /// them in. They can still type a custom value (e.g. DJ Camelot keys
    /// like "8A") in the field directly.
    private let suggestedKeys = [
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
        "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm",
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("BPM")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)
                        TextField("e.g. 128", text: $bpmDraft)
                            .keyboardType(.numberPad)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Key")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)
                        TextField("e.g. Am", text: $keyDraft)
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 12))

                        // Quick-pick chips for the common 24.
                        Text("Suggestions")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(.top, 4)
                        LazyVGrid(
                            columns: Array(repeating: GridItem(.flexible(), spacing: 6), count: 6),
                            spacing: 6
                        ) {
                            ForEach(suggestedKeys, id: \.self) { k in
                                Button {
                                    keyDraft = k
                                } label: {
                                    Text(k)
                                        .font(.caption.monospaced())
                                        .foregroundStyle(keyDraft == k ? Color.white : .primary)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 8)
                                        .background(
                                            keyDraft == k ? Color.accentColor : Color.secondary.opacity(0.12),
                                            in: Capsule()
                                        )
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    Spacer(minLength: 0)
                }
                .padding(20)
            }
            .navigationTitle("Track Info")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        bpm = Int(bpmDraft.trimmingCharacters(in: .whitespaces))
                        let k = keyDraft.trimmingCharacters(in: .whitespaces)
                        key = k.isEmpty ? nil : k
                        dismiss()
                    }
                }
            }
            .onAppear {
                bpmDraft = bpm.map { String($0) } ?? ""
                keyDraft = key ?? ""
            }
        }
    }
}

// MARK: - Hire data sheet
//
// Single sheet that edits the entire HireData payload (availability,
// services, clients, testimonials, process, closing tagline). Each
// subsection is its own collapsible group so the form stays manageable
// even when fully populated.

struct ProfileHireSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var hireData: HireData?

    @State private var draft: HireData = HireData()

    var body: some View {
        NavigationStack {
            Form {
                availabilitySection
                servicesSection
                clientsSection
                testimonialsSection
                processSection
                taglineSection
            }
            .navigationTitle("Hire Setup")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        hireData = sanitized(draft)
                        dismiss()
                    }
                }
            }
            .onAppear { draft = hireData ?? HireData() }
        }
    }

    // MARK: - Availability

    private var availabilitySection: some View {
        Section {
            Picker("Status", selection: Binding(
                get: { (draft.availability?.status ?? "BOOKING").uppercased() },
                set: { v in mutateAvailability { $0.status = v } }
            )) {
                Text("Booking").tag("BOOKING")
                Text("Limited").tag("LIMITED")
                Text("Closed").tag("CLOSED")
            }
            availabilityField("Next opening", placeholder: "e.g. MAY 12",
                              get: { $0.next },
                              set: { v, av in av.next = v })
            availabilityField("Capacity", placeholder: "e.g. 2 slots",
                              get: { $0.capacity },
                              set: { v, av in av.capacity = v })
            availabilityField("Timezone", placeholder: "e.g. PST",
                              get: { $0.timezone },
                              set: { v, av in av.timezone = v })
            availabilityField("Reply time", placeholder: "e.g. < 24h",
                              get: { $0.replyTime },
                              set: { v, av in av.replyTime = v })
            availabilityField("Contact email", placeholder: "you@studio.com",
                              keyboard: .emailAddress, autocap: false,
                              get: { $0.contactEmail },
                              set: { v, av in av.contactEmail = v })
        } header: {
            Text("Availability")
        } footer: {
            Text("Shown in the header pill and grid. Only Status is required.")
                .font(.caption)
        }
    }

    private func availabilityField(_ label: String,
                                   placeholder: String,
                                   keyboard: UIKeyboardType = .default,
                                   autocap: Bool = true,
                                   get: @escaping (HireAvailability) -> String?,
                                   set: @escaping (String, inout HireAvailability) -> Void) -> some View {
        let binding = Binding<String>(
            get: { get(draft.availability ?? HireAvailability()) ?? "" },
            set: { v in
                let trimmed = v.trimmingCharacters(in: .whitespaces)
                mutateAvailability { av in set(trimmed.isEmpty ? "" : v, &av) }
            }
        )
        return HStack {
            Text(label)
                .foregroundStyle(.secondary)
            Spacer()
            TextField(placeholder, text: binding)
                .keyboardType(keyboard)
                .textInputAutocapitalization(autocap ? .sentences : .never)
                .autocorrectionDisabled(!autocap)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: 220)
        }
    }

    private func mutateAvailability(_ apply: (inout HireAvailability) -> Void) {
        var av = draft.availability ?? HireAvailability()
        apply(&av)
        draft.availability = av
    }

    // MARK: - Services

    private var servicesSection: some View {
        Section {
            ForEach(Array((draft.services ?? []).enumerated()), id: \.offset) { idx, _ in
                serviceEditor(at: idx)
            }
            .onDelete { indexSet in
                var arr = draft.services ?? []
                arr.remove(atOffsets: indexSet)
                draft.services = arr
            }
            .onMove { from, to in
                var arr = draft.services ?? []
                arr.move(fromOffsets: from, toOffset: to)
                draft.services = arr
            }

            Button {
                var arr = draft.services ?? []
                arr.append(HireService(name: "New Service"))
                draft.services = arr
            } label: {
                Label("Add service", systemImage: "plus.circle")
            }
        } header: {
            HStack {
                Text("Services / Rate Card")
                Spacer()
                if !(draft.services ?? []).isEmpty {
                    EditButton().font(.caption)
                }
            }
        } footer: {
            Text("Up to 12. Mark one as “flagship” or “popular” via the tag field.")
                .font(.caption)
        }
    }

    private func serviceEditor(at idx: Int) -> some View {
        let nameBinding = serviceBinding(idx, get: { $0.name },          set: { v, s in s.name = v })
        let fromBinding = serviceBinding(idx, get: { $0.from ?? "" },    set: { v, s in s.from = v.isEmpty ? nil : v })
        let unitBinding = serviceBinding(idx, get: { $0.unit ?? "" },    set: { v, s in s.unit = v.isEmpty ? nil : v })
        let leadBinding = serviceBinding(idx, get: { $0.lead ?? "" },    set: { v, s in s.lead = v.isEmpty ? nil : v })
        let tagBinding  = serviceBinding(idx, get: { $0.tag  ?? "" },    set: { v, s in s.tag  = v.isEmpty ? nil : v })

        return DisclosureGroup {
            TextField("Name", text: nameBinding)
            TextField("Price (e.g. $8k)", text: fromBinding)
            TextField("Unit (e.g. / project)", text: unitBinding)
            TextField("Lead time (e.g. 3 wks)", text: leadBinding)
            TextField("Tag (e.g. flagship)", text: tagBinding)
                .textInputAutocapitalization(.never)
        } label: {
            HStack {
                Text(nameBinding.wrappedValue.isEmpty ? "New Service" : nameBinding.wrappedValue)
                    .foregroundStyle(.primary)
                Spacer()
                if !fromBinding.wrappedValue.isEmpty {
                    Text(fromBinding.wrappedValue)
                        .font(.caption.monospaced())
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private func serviceBinding(_ idx: Int,
                                get: @escaping (HireService) -> String,
                                set: @escaping (String, inout HireService) -> Void) -> Binding<String> {
        Binding<String>(
            get: {
                let arr = draft.services ?? []
                return arr.indices.contains(idx) ? get(arr[idx]) : ""
            },
            set: { v in
                var arr = draft.services ?? []
                guard arr.indices.contains(idx) else { return }
                set(v, &arr[idx])
                draft.services = arr
            }
        )
    }

    // MARK: - Clients

    private var clientsSection: some View {
        Section {
            ForEach(Array((draft.clients ?? []).enumerated()), id: \.offset) { idx, _ in
                let binding = Binding<String>(
                    get: {
                        let arr = draft.clients ?? []
                        return arr.indices.contains(idx) ? arr[idx] : ""
                    },
                    set: { v in
                        var arr = draft.clients ?? []
                        guard arr.indices.contains(idx) else { return }
                        arr[idx] = v
                        draft.clients = arr
                    }
                )
                TextField("Client name", text: binding)
            }
            .onDelete { indexSet in
                var arr = draft.clients ?? []
                arr.remove(atOffsets: indexSet)
                draft.clients = arr
            }

            Button {
                var arr = draft.clients ?? []
                arr.append("")
                draft.clients = arr
            } label: {
                Label("Add client", systemImage: "plus.circle")
            }
        } header: {
            Text("Trusted by")
        } footer: {
            Text("Up to 20. Empty rows are dropped on save.")
                .font(.caption)
        }
    }

    // MARK: - Testimonials

    private var testimonialsSection: some View {
        Section {
            ForEach(Array((draft.testimonials ?? []).enumerated()), id: \.offset) { idx, _ in
                testimonialEditor(at: idx)
            }
            .onDelete { indexSet in
                var arr = draft.testimonials ?? []
                arr.remove(atOffsets: indexSet)
                draft.testimonials = arr
            }

            Button {
                var arr = draft.testimonials ?? []
                arr.append(HireTestimonial(by: "", role: nil, quote: ""))
                draft.testimonials = arr
            } label: {
                Label("Add testimonial", systemImage: "plus.circle")
            }
        } header: {
            Text("Kind words")
        }
    }

    private func testimonialEditor(at idx: Int) -> some View {
        let byBinding    = testimonialBinding(idx, get: { $0.by },         set: { v, t in t.by = v })
        let roleBinding  = testimonialBinding(idx, get: { $0.role ?? "" }, set: { v, t in t.role = v.isEmpty ? nil : v })
        let quoteBinding = testimonialBinding(idx, get: { $0.quote },      set: { v, t in t.quote = v })

        return DisclosureGroup {
            TextField("Name", text: byBinding)
            TextField("Role / company", text: roleBinding)
            TextField("Quote", text: quoteBinding, axis: .vertical)
                .lineLimit(2...6)
        } label: {
            VStack(alignment: .leading, spacing: 2) {
                Text(byBinding.wrappedValue.isEmpty ? "Testimonial" : byBinding.wrappedValue)
                    .foregroundStyle(.primary)
                if !quoteBinding.wrappedValue.isEmpty {
                    Text(quoteBinding.wrappedValue)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
        }
    }

    private func testimonialBinding(_ idx: Int,
                                    get: @escaping (HireTestimonial) -> String,
                                    set: @escaping (String, inout HireTestimonial) -> Void) -> Binding<String> {
        Binding<String>(
            get: {
                let arr = draft.testimonials ?? []
                return arr.indices.contains(idx) ? get(arr[idx]) : ""
            },
            set: { v in
                var arr = draft.testimonials ?? []
                guard arr.indices.contains(idx) else { return }
                set(v, &arr[idx])
                draft.testimonials = arr
            }
        )
    }

    // MARK: - Process

    private var processSection: some View {
        Section {
            ForEach(Array((draft.process ?? []).enumerated()), id: \.offset) { idx, _ in
                processEditor(at: idx)
            }
            .onDelete { indexSet in
                var arr = draft.process ?? []
                arr.remove(atOffsets: indexSet)
                draft.process = arr
            }
            .onMove { from, to in
                var arr = draft.process ?? []
                arr.move(fromOffsets: from, toOffset: to)
                draft.process = arr
            }

            Button {
                var arr = draft.process ?? []
                arr.append(HireProcessStep(title: "STEP", detail: nil, length: nil))
                draft.process = arr
            } label: {
                Label("Add step", systemImage: "plus.circle")
            }
        } header: {
            HStack {
                Text("How we work")
                Spacer()
                if !(draft.process ?? []).isEmpty {
                    EditButton().font(.caption)
                }
            }
        }
    }

    private func processEditor(at idx: Int) -> some View {
        let titleBinding  = processBinding(idx, get: { $0.title },         set: { v, p in p.title = v })
        let detailBinding = processBinding(idx, get: { $0.detail ?? "" },  set: { v, p in p.detail = v.isEmpty ? nil : v })
        let lenBinding    = processBinding(idx, get: { $0.length ?? "" }, set: { v, p in p.length = v.isEmpty ? nil : v })

        return DisclosureGroup {
            TextField("Title (e.g. DISCOVERY)", text: titleBinding)
                .textInputAutocapitalization(.characters)
            TextField("Detail", text: detailBinding, axis: .vertical)
                .lineLimit(1...3)
            TextField("Length (e.g. 3 days)", text: lenBinding)
        } label: {
            HStack {
                Text(String(format: "%02d", idx + 1))
                    .font(.caption.monospaced())
                    .foregroundStyle(.secondary)
                Text(titleBinding.wrappedValue.isEmpty ? "Step" : titleBinding.wrappedValue)
                    .foregroundStyle(.primary)
                Spacer()
            }
        }
    }

    private func processBinding(_ idx: Int,
                                get: @escaping (HireProcessStep) -> String,
                                set: @escaping (String, inout HireProcessStep) -> Void) -> Binding<String> {
        Binding<String>(
            get: {
                let arr = draft.process ?? []
                return arr.indices.contains(idx) ? get(arr[idx]) : ""
            },
            set: { v in
                var arr = draft.process ?? []
                guard arr.indices.contains(idx) else { return }
                set(v, &arr[idx])
                draft.process = arr
            }
        )
    }

    // MARK: - Tagline

    private var taglineSection: some View {
        Section {
            TextField("Let's make something strange.",
                      text: Binding(get: { draft.ctaTagline ?? "" },
                                    set: { draft.ctaTagline = $0.isEmpty ? nil : $0 }),
                      axis: .vertical)
                .lineLimit(1...3)
        } header: {
            Text("Closing tagline")
        } footer: {
            Text("Shown in the final “Book a call” card. Optional.")
                .font(.caption)
        }
    }

    // MARK: - Sanitization
    //
    // Drop empty client rows and testimonials/services missing required
    // fields so they don't write back as junk. Returns nil for an entirely
    // empty payload so the column can clear.

    private func sanitized(_ d: HireData) -> HireData? {
        var out = d

        if var clients = out.clients {
            clients = clients
                .map { $0.trimmingCharacters(in: .whitespaces) }
                .filter { !$0.isEmpty }
            out.clients = clients.isEmpty ? nil : clients
        }

        if var services = out.services {
            services = services.filter {
                !$0.name.trimmingCharacters(in: .whitespaces).isEmpty
            }
            out.services = services.isEmpty ? nil : services
        }

        if var testimonials = out.testimonials {
            testimonials = testimonials.filter {
                !$0.by.trimmingCharacters(in: .whitespaces).isEmpty &&
                !$0.quote.trimmingCharacters(in: .whitespaces).isEmpty
            }
            out.testimonials = testimonials.isEmpty ? nil : testimonials
        }

        if var process = out.process {
            process = process.filter {
                !$0.title.trimmingCharacters(in: .whitespaces).isEmpty
            }
            out.process = process.isEmpty ? nil : process
        }

        if let av = out.availability,
           av.status == nil, av.next == nil, av.capacity == nil,
           av.timezone == nil, av.replyTime == nil, av.contactEmail == nil {
            out.availability = nil
        }

        if let tag = out.ctaTagline?.trimmingCharacters(in: .whitespaces), tag.isEmpty {
            out.ctaTagline = nil
        }

        // Wholly empty payload — return nil so the JSON column can clear.
        if out.availability == nil, out.services == nil, out.clients == nil,
           out.testimonials == nil, out.process == nil, out.ctaTagline == nil {
            return nil
        }
        return out
    }
}

// MARK: - Client data sheet
//
// Single sheet that edits the entire ClientData payload (company info,
// briefs, past hires, hiring criteria, stats, culture, tagline). Same
// shape as ProfileHireSheet so the two stay easy to compare.

struct ProfileClientSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var clientData: ClientData?

    @State private var draft: ClientData = ClientData()

    var body: some View {
        NavigationStack {
            Form {
                companySection
                briefsSection
                lookingForSection
                pastHiresSection
                statsSection
                cultureSection
                taglineSection
            }
            .navigationTitle("Hiring Setup")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        clientData = sanitized(draft)
                        dismiss()
                    }
                }
            }
            .onAppear { draft = clientData ?? ClientData() }
        }
    }

    // MARK: - Company

    private var companySection: some View {
        Section {
            TextField("Company name",
                      text: stringBinding({ draft.company ?? "" }, { draft.company = $0.isEmpty ? nil : $0 }))
            TextField("日本語 name (optional)",
                      text: stringBinding({ draft.jpName ?? "" }, { draft.jpName = $0.isEmpty ? nil : $0 }))
            TextField("Tagline",
                      text: stringBinding({ draft.tagline ?? "" }, { draft.tagline = $0.isEmpty ? nil : $0 }),
                      axis: .vertical)
                .lineLimit(1...3)
            TextField("Size (e.g. 14 ppl)",
                      text: stringBinding({ draft.size ?? "" }, { draft.size = $0.isEmpty ? nil : $0 }))
            TextField("Founded (e.g. 2021)",
                      text: stringBinding({ draft.founded ?? "" }, { draft.founded = $0.isEmpty ? nil : $0 }))
                .keyboardType(.numbersAndPunctuation)
            TextField("Website",
                      text: stringBinding({ draft.website ?? "" }, { draft.website = $0.isEmpty ? nil : $0 }))
                .keyboardType(.URL)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
            Toggle("Verified client", isOn: Binding(
                get: { draft.verified ?? false },
                set: { draft.verified = $0 ? true : nil }
            ))
        } header: {
            Text("Company")
        } footer: {
            Text("Shown in the brand hero card. Verified is decorative — actual verification flows live elsewhere.")
                .font(.caption)
        }
    }

    // MARK: - Briefs

    private var briefsSection: some View {
        Section {
            ForEach(Array((draft.briefs ?? []).enumerated()), id: \.offset) { idx, _ in
                briefEditor(at: idx)
            }
            .onDelete { indexSet in
                var arr = draft.briefs ?? []
                arr.remove(atOffsets: indexSet)
                draft.briefs = arr
            }
            .onMove { from, to in
                var arr = draft.briefs ?? []
                arr.move(fromOffsets: from, toOffset: to)
                draft.briefs = arr
            }

            Button {
                var arr = draft.briefs ?? []
                arr.append(ClientBrief(title: "New Brief"))
                draft.briefs = arr
            } label: {
                Label("Add brief", systemImage: "plus.circle")
            }
        } header: {
            HStack {
                Text("Open briefs")
                Spacer()
                if !(draft.briefs ?? []).isEmpty {
                    EditButton().font(.caption)
                }
            }
        } footer: {
            Text("Up to 20 briefs. Mark one as urgent to highlight it.")
                .font(.caption)
        }
    }

    private func briefEditor(at idx: Int) -> some View {
        let titleBinding    = briefBinding(idx, get: { $0.title },          set: { v, b in b.title = v })
        let typeBinding     = briefBinding(idx, get: { $0.type ?? "" },     set: { v, b in b.type = v.isEmpty ? nil : v })
        let budgetBinding   = briefBinding(idx, get: { $0.budget ?? "" },   set: { v, b in b.budget = v.isEmpty ? nil : v })
        let timelineBinding = briefBinding(idx, get: { $0.timeline ?? "" }, set: { v, b in b.timeline = v.isEmpty ? nil : v })
        let startsBinding   = briefBinding(idx, get: { $0.starts ?? "" },   set: { v, b in b.starts = v.isEmpty ? nil : v })
        let tagsBinding     = briefBinding(idx, get: { ($0.tags ?? []).joined(separator: ", ") },
                                                set: { v, b in
                                                    let parts = v.split(separator: ",")
                                                        .map { $0.trimmingCharacters(in: .whitespaces) }
                                                        .filter { !$0.isEmpty }
                                                    b.tags = parts.isEmpty ? nil : parts
                                                })
        let urgentBinding   = Binding<Bool>(
            get: {
                let arr = draft.briefs ?? []
                guard arr.indices.contains(idx) else { return false }
                return arr[idx].priority?.lowercased() == "urgent"
            },
            set: { v in
                var arr = draft.briefs ?? []
                guard arr.indices.contains(idx) else { return }
                arr[idx].priority = v ? "urgent" : nil
                draft.briefs = arr
            }
        )
        let applicantsBinding = Binding<String>(
            get: {
                let arr = draft.briefs ?? []
                guard arr.indices.contains(idx) else { return "" }
                return arr[idx].applicants.map { String($0) } ?? ""
            },
            set: { v in
                var arr = draft.briefs ?? []
                guard arr.indices.contains(idx) else { return }
                arr[idx].applicants = Int(v.trimmingCharacters(in: .whitespaces))
                draft.briefs = arr
            }
        )

        return DisclosureGroup {
            TextField("Title", text: titleBinding)
            TextField("Type (e.g. contract / project)", text: typeBinding)
            TextField("Budget (e.g. $14k—$22k)", text: budgetBinding)
            TextField("Timeline (e.g. 6 weeks)", text: timelineBinding)
            TextField("Starts (e.g. MAY 05 / ROLLING)", text: startsBinding)
            TextField("Tags (comma-separated)", text: tagsBinding)
                .textInputAutocapitalization(.never)
            Toggle("Urgent", isOn: urgentBinding)
            TextField("Applicants count (optional)", text: applicantsBinding)
                .keyboardType(.numberPad)
        } label: {
            HStack {
                Text(titleBinding.wrappedValue.isEmpty ? "New Brief" : titleBinding.wrappedValue)
                    .foregroundStyle(.primary)
                Spacer()
                if urgentBinding.wrappedValue {
                    Text("URGENT")
                        .font(.caption2.bold())
                        .foregroundStyle(.black)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 3))
                }
            }
        }
    }

    private func briefBinding(_ idx: Int,
                              get: @escaping (ClientBrief) -> String,
                              set: @escaping (String, inout ClientBrief) -> Void) -> Binding<String> {
        Binding<String>(
            get: {
                let arr = draft.briefs ?? []
                return arr.indices.contains(idx) ? get(arr[idx]) : ""
            },
            set: { v in
                var arr = draft.briefs ?? []
                guard arr.indices.contains(idx) else { return }
                set(v, &arr[idx])
                draft.briefs = arr
            }
        )
    }

    // MARK: - Looking for

    private var lookingForSection: some View {
        Section {
            ForEach(Array((draft.lookingFor ?? []).enumerated()), id: \.offset) { idx, _ in
                let binding = Binding<String>(
                    get: {
                        let arr = draft.lookingFor ?? []
                        return arr.indices.contains(idx) ? arr[idx] : ""
                    },
                    set: { v in
                        var arr = draft.lookingFor ?? []
                        guard arr.indices.contains(idx) else { return }
                        arr[idx] = v
                        draft.lookingFor = arr
                    }
                )
                TextField("Criterion", text: binding, axis: .vertical)
                    .lineLimit(1...3)
            }
            .onDelete { indexSet in
                var arr = draft.lookingFor ?? []
                arr.remove(atOffsets: indexSet)
                draft.lookingFor = arr
            }

            Button {
                var arr = draft.lookingFor ?? []
                arr.append("")
                draft.lookingFor = arr
            } label: {
                Label("Add criterion", systemImage: "plus.circle")
            }
        } header: {
            Text("What we look for")
        } footer: {
            Text("Up to 10 lines. One short statement per row.")
                .font(.caption)
        }
    }

    // MARK: - Past hires

    private var pastHiresSection: some View {
        Section {
            ForEach(Array((draft.pastHires ?? []).enumerated()), id: \.offset) { idx, _ in
                pastHireEditor(at: idx)
            }
            .onDelete { indexSet in
                var arr = draft.pastHires ?? []
                arr.remove(atOffsets: indexSet)
                draft.pastHires = arr
            }

            Button {
                var arr = draft.pastHires ?? []
                arr.append(ClientPastHire(name: "", role: nil, color: nil))
                draft.pastHires = arr
            } label: {
                Label("Add past hire", systemImage: "plus.circle")
            }
        } header: {
            Text("We've hired")
        }
    }

    private func pastHireEditor(at idx: Int) -> some View {
        let nameBinding = pastHireBinding(idx, get: { $0.name },          set: { v, h in h.name = v })
        let roleBinding = pastHireBinding(idx, get: { $0.role ?? "" },    set: { v, h in h.role = v.isEmpty ? nil : v })
        let colorBinding = pastHireBinding(idx, get: { $0.color ?? "" },  set: { v, h in h.color = v.isEmpty ? nil : v })

        return DisclosureGroup {
            TextField("Name (e.g. mona.jpg)", text: nameBinding)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
            TextField("Role (e.g. AD / Motion)", text: roleBinding)
            TextField("Accent (hex, e.g. #FF3D9A)", text: colorBinding)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
        } label: {
            HStack {
                Text(nameBinding.wrappedValue.isEmpty ? "New hire" : nameBinding.wrappedValue)
                    .foregroundStyle(.primary)
                Spacer()
                if !roleBinding.wrappedValue.isEmpty {
                    Text(roleBinding.wrappedValue.uppercased())
                        .font(.caption.monospaced())
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private func pastHireBinding(_ idx: Int,
                                 get: @escaping (ClientPastHire) -> String,
                                 set: @escaping (String, inout ClientPastHire) -> Void) -> Binding<String> {
        Binding<String>(
            get: {
                let arr = draft.pastHires ?? []
                return arr.indices.contains(idx) ? get(arr[idx]) : ""
            },
            set: { v in
                var arr = draft.pastHires ?? []
                guard arr.indices.contains(idx) else { return }
                set(v, &arr[idx])
                draft.pastHires = arr
            }
        )
    }

    // MARK: - Stats

    private var statsSection: some View {
        Section {
            statField("Total hires", placeholder: "e.g. 34", keyboard: .numberPad,
                      get: { draft.stats?.hires.map { String($0) } ?? "" },
                      set: { v in mutateStats { $0.hires = Int(v.trimmingCharacters(in: .whitespaces)) } })
            statField("Avg time to reply", placeholder: "e.g. 9d",
                      get: { draft.stats?.avgDays ?? "" },
                      set: { v in mutateStats { $0.avgDays = v.isEmpty ? nil : v } })
            statField("Reply rate", placeholder: "e.g. 100%",
                      get: { draft.stats?.response ?? "" },
                      set: { v in mutateStats { $0.response = v.isEmpty ? nil : v } })
            statField("Repeat hires", placeholder: "e.g. 68%",
                      get: { draft.stats?.repeatRate ?? "" },
                      set: { v in mutateStats { $0.repeatRate = v.isEmpty ? nil : v } })
        } header: {
            Text("Track record")
        }
    }

    private func statField(_ label: String,
                           placeholder: String,
                           keyboard: UIKeyboardType = .default,
                           get: @escaping () -> String,
                           set: @escaping (String) -> Void) -> some View {
        HStack {
            Text(label).foregroundStyle(.secondary)
            Spacer()
            TextField(placeholder, text: Binding(get: get, set: set))
                .keyboardType(keyboard)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: 180)
        }
    }

    private func mutateStats(_ apply: (inout ClientStats) -> Void) {
        var s = draft.stats ?? ClientStats()
        apply(&s)
        draft.stats = s
    }

    // MARK: - Culture

    private var cultureSection: some View {
        Section {
            ForEach(Array((draft.culture ?? []).enumerated()), id: \.offset) { idx, _ in
                let binding = Binding<String>(
                    get: {
                        let arr = draft.culture ?? []
                        return arr.indices.contains(idx) ? arr[idx] : ""
                    },
                    set: { v in
                        var arr = draft.culture ?? []
                        guard arr.indices.contains(idx) else { return }
                        arr[idx] = v
                        draft.culture = arr
                    }
                )
                TextField("e.g. Async-first", text: binding)
            }
            .onDelete { indexSet in
                var arr = draft.culture ?? []
                arr.remove(atOffsets: indexSet)
                draft.culture = arr
            }

            Button {
                var arr = draft.culture ?? []
                arr.append("")
                draft.culture = arr
            } label: {
                Label("Add chip", systemImage: "plus.circle")
            }
        } header: {
            Text("Culture")
        } footer: {
            Text("Short single-word or two-word chips. Up to 20.")
                .font(.caption)
        }
    }

    // MARK: - Tagline

    private var taglineSection: some View {
        Section {
            TextField("Think you'd fit? Send us one piece.",
                      text: stringBinding({ draft.ctaTagline ?? "" }, { draft.ctaTagline = $0.isEmpty ? nil : $0 }),
                      axis: .vertical)
                .lineLimit(1...3)
        } header: {
            Text("Closing pitch")
        } footer: {
            Text("Shown in the final “Apply now” card. Optional.")
                .font(.caption)
        }
    }

    // MARK: - Helpers

    private func stringBinding(_ get: @escaping () -> String,
                               _ set: @escaping (String) -> Void) -> Binding<String> {
        Binding(get: get, set: set)
    }

    /// Drop empty rows / unset stats so the saved payload doesn't carry
    /// junk. Returns nil for a wholly empty payload so the column clears.
    private func sanitized(_ d: ClientData) -> ClientData? {
        var out = d

        if let arr = out.lookingFor {
            let cleaned = arr
                .map { $0.trimmingCharacters(in: .whitespaces) }
                .filter { !$0.isEmpty }
            out.lookingFor = cleaned.isEmpty ? nil : cleaned
        }

        if let arr = out.culture {
            let cleaned = arr
                .map { $0.trimmingCharacters(in: .whitespaces) }
                .filter { !$0.isEmpty }
            out.culture = cleaned.isEmpty ? nil : cleaned
        }

        if let arr = out.briefs {
            let cleaned = arr.filter {
                !$0.title.trimmingCharacters(in: .whitespaces).isEmpty
            }
            out.briefs = cleaned.isEmpty ? nil : cleaned
        }

        if let arr = out.pastHires {
            let cleaned = arr.filter {
                !$0.name.trimmingCharacters(in: .whitespaces).isEmpty
            }
            out.pastHires = cleaned.isEmpty ? nil : cleaned
        }

        if let s = out.stats,
           s.hires == nil, (s.avgDays?.isEmpty ?? true),
           (s.response?.isEmpty ?? true), (s.repeatRate?.isEmpty ?? true) {
            out.stats = nil
        }

        if let tag = out.ctaTagline?.trimmingCharacters(in: .whitespaces), tag.isEmpty {
            out.ctaTagline = nil
        }

        if let comp = out.company?.trimmingCharacters(in: .whitespaces), comp.isEmpty {
            out.company = nil
        }

        // Wholly empty? clear the column.
        if out.company == nil, out.jpName == nil, out.tagline == nil,
           out.size == nil, out.founded == nil, out.website == nil,
           out.verified == nil, out.briefs == nil, out.pastHires == nil,
           out.lookingFor == nil, out.stats == nil, out.culture == nil,
           out.ctaTagline == nil {
            return nil
        }
        return out
    }
}
