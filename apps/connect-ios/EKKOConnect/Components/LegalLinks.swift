import SwiftUI

/// Centralized URLs for legal documents. Resolved from the same origin
/// as the tRPC base URL so prod/dev environments work the same way.
enum LegalURLs {
    private static var origin: String {
        var base = Config.trpcBaseURL
        if base.hasSuffix("/api/trpc") {
            base = String(base.dropLast("/api/trpc".count))
        } else if base.hasSuffix("/trpc") {
            base = String(base.dropLast("/trpc".count))
        }
        return base
    }

    static var terms: URL? { URL(string: "\(origin)/terms") }
    static var privacy: URL? { URL(string: "\(origin)/privacy") }
    static var support: URL { URL(string: "https://ekkoconnect.app/support")! }
}

/// Inline agreement text with tappable Terms of Service + Privacy Policy links.
struct LegalAgreementText: View {
    var body: some View {
        (
            Text("I agree to the ")
                .foregroundStyle(.secondary)
            + Text("Terms of Service")
                .foregroundStyle(EKKOTheme.primary)
                .underline()
            + Text(" and ")
                .foregroundStyle(.secondary)
            + Text("Privacy Policy")
                .foregroundStyle(EKKOTheme.primary)
                .underline()
            + Text(". I understand there is zero tolerance for objectionable content or abusive behavior.")
                .foregroundStyle(.secondary)
        )
        .font(.caption)
        .onTapGesture {
            // Tapping opens the terms page; privacy is accessible from Settings too.
            if let url = LegalURLs.terms { UIApplication.shared.open(url) }
        }
    }
}
