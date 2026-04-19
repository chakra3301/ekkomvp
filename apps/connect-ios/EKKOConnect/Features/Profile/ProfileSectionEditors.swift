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
                                .strokeBorder(EKKOTheme.primary.opacity(0.55), style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
                        )
                    Image(systemName: "pencil")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(5)
                        .background(Circle().fill(EKKOTheme.primary))
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
                                            keyDraft == k ? EKKOTheme.primary : Color.secondary.opacity(0.12),
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
