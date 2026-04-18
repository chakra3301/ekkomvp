import SwiftUI

/// Modal shown when the user can upgrade to the INFINITE tier.
struct UpgradeModal: View {
    @Binding var isPresented: Bool
    @Environment(PurchaseManager.self) private var purchaseManager
    @State private var animatePhase: CGFloat = 0

    var body: some View {
        ZStack {
            // Animated multicolor gradient background (semi-transparent so
            // the system material behind shows through, giving a glass feel)
            animatedGradientBackground
                .ignoresSafeArea()

            VStack(spacing: 24) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "infinity")
                        .font(.system(size: 56, weight: .bold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.white, Color.white.opacity(0.8)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .shadow(color: .black.opacity(0.2), radius: 8, y: 2)

                    Text("EKKO Infinite")
                        .font(.title.bold())
                        .foregroundStyle(.white)

                    Text("Unlock the full Connect experience")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.8))
                }
                .padding(.top, 40)

                // Benefits
                VStack(alignment: .leading, spacing: 14) {
                    benefitRow(icon: "heart.fill", title: "Unlimited Likes", description: "Like as many profiles as you want")
                    benefitRow(icon: "eye.fill", title: "See Who Likes You", description: "Reveal everyone already interested")
                    benefitRow(icon: "globe", title: "Global Search", description: "Find creatives worldwide — no distance limit")
                    benefitRow(icon: "photo.stack", title: "12 Media Slots", description: "Showcase more of your work")
                    benefitRow(icon: "arrow.up.circle.fill", title: "Priority in Discovery", description: "Appear at the top of the stack")
                    benefitRow(icon: "infinity", title: "Infinite Badge", description: "Stand out with the Infinite badge")
                }
                .padding(20)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    ZStack {
                        Color.clear.background(.ultraThinMaterial)
                        Color.white.opacity(0.1)
                    }
                )
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(Color.white.opacity(0.25), lineWidth: 0.5)
                )
                .padding(.horizontal, 20)

                Spacer()

                // Price + CTA
                VStack(spacing: 12) {
                    // Price + duration shown together so App Review sees the
                    // auto-renewal period disclosure clearly.
                    priceLine

                    // Animated gradient CTA button
                    Button {
                        Task {
                            let success = await purchaseManager.purchaseInfinite()
                            if success { isPresented = false }
                        }
                    } label: {
                        Group {
                            if purchaseManager.isPurchasing {
                                ProgressView().tint(.white)
                            } else {
                                Text("Upgrade Now")
                                    .font(.system(size: 17, weight: .bold))
                                    .foregroundStyle(.white)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 54)
                        .background(animatedButtonGradient)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .stroke(Color.white.opacity(0.35), lineWidth: 0.8)
                        )
                        .shadow(color: Color.purple.opacity(0.4), radius: 16, y: 8)
                    }
                    .buttonStyle(.plain)
                    .disabled(purchaseManager.isPurchasing)
                    .padding(.horizontal, 24)

                    Button("Restore Purchases") {
                        Task { await purchaseManager.restorePurchases() }
                    }
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.7))

                    if let error = purchaseManager.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.red.opacity(0.5))
                            .clipShape(Capsule())
                    }

                    // Required by App Review Guideline 3.1.2(a): auto-renewal
                    // disclosure + functional Terms/Privacy links on the
                    // purchase screen.
                    legalDisclosure
                }
                .padding(.bottom, 36)
            }
        }
        .onAppear {
            // Kick off the gradient animation
            withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
                animatePhase = 1
            }
        }
    }

    // MARK: - Price + Legal Disclosure

    @ViewBuilder
    private var priceLine: some View {
        // Prefer the live-resolved StoreKit price (locale-correct) and fall
        // back to the static tier config if offerings haven't loaded yet.
        let price: String = {
            if let p = purchaseManager.offerings?.current?.availablePackages.first?.storeProduct.localizedPriceString {
                return p
            }
            return connectTiers[.INFINITE]?.price ?? ""
        }()

        VStack(spacing: 2) {
            Text("\(price) / month")
                .font(.headline)
                .foregroundStyle(.white.opacity(0.95))
            Text("Auto-renewing subscription")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
        }
    }

    private var legalDisclosure: some View {
        VStack(spacing: 8) {
            Text("Payment will be charged to your Apple ID at confirmation. Subscriptions renew automatically unless canceled at least 24 hours before the end of the current period. Manage or cancel anytime in your App Store account settings.")
                .font(.system(size: 11))
                .foregroundStyle(.white.opacity(0.6))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)

            HStack(spacing: 16) {
                Button("Terms of Service") {
                    if let url = LegalURLs.terms { UIApplication.shared.open(url) }
                }
                Text("·")
                    .foregroundStyle(.white.opacity(0.4))
                Button("Privacy Policy") {
                    if let url = LegalURLs.privacy { UIApplication.shared.open(url) }
                }
            }
            .font(.system(size: 11, weight: .medium))
            .foregroundStyle(.white.opacity(0.85))
        }
        .padding(.top, 6)
    }

    // MARK: - Animated Gradient Background

    private var animatedGradientBackground: some View {
        ZStack {
            // Base dark layer so colors pop and text stays readable
            Color.black.opacity(0.35)

            // Drifting radial blobs — purple/pink/blue/cyan
            GeometryReader { geo in
                let w = geo.size.width
                let h = geo.size.height

                blob(
                    color: Color(red: 0.50, green: 0.18, blue: 0.80),
                    x: animatePhase < 0.5 ? 0.25 : 0.75,
                    y: 0.25,
                    size: max(w, h) * 0.9
                )
                blob(
                    color: Color(red: 0.96, green: 0.30, blue: 0.55),
                    x: 0.85,
                    y: animatePhase < 0.5 ? 0.2 : 0.7,
                    size: max(w, h) * 0.8
                )
                blob(
                    color: EKKOTheme.primary,
                    x: animatePhase < 0.5 ? 0.15 : 0.85,
                    y: 0.8,
                    size: max(w, h) * 0.85
                )
                blob(
                    color: Color.cyan,
                    x: 0.5,
                    y: animatePhase < 0.5 ? 0.9 : 0.3,
                    size: max(w, h) * 0.7
                )
            }
            .blur(radius: 80)
        }
    }

    @ViewBuilder
    private func blob(color: Color, x: CGFloat, y: CGFloat, size: CGFloat) -> some View {
        GeometryReader { geo in
            Circle()
                .fill(
                    RadialGradient(
                        colors: [color.opacity(0.9), color.opacity(0)],
                        center: .center,
                        startRadius: 0,
                        endRadius: size / 2
                    )
                )
                .frame(width: size, height: size)
                .position(x: geo.size.width * x, y: geo.size.height * y)
                .animation(.easeInOut(duration: 8).repeatForever(autoreverses: true), value: x)
                .animation(.easeInOut(duration: 8).repeatForever(autoreverses: true), value: y)
        }
    }

    // MARK: - Animated Button Gradient

    private var animatedButtonGradient: some View {
        // Shifts a 3-stop gradient horizontally, wrapping around
        let offset = animatePhase
        return LinearGradient(
            stops: [
                .init(color: Color(red: 0.50, green: 0.18, blue: 0.80), location: 0.0 + offset * 0.0),
                .init(color: Color(red: 0.96, green: 0.30, blue: 0.55), location: 0.33),
                .init(color: EKKOTheme.primary, location: 0.66),
                .init(color: Color.cyan, location: 1.0),
            ],
            startPoint: UnitPoint(x: -1 + offset * 2, y: 0.5),
            endPoint: UnitPoint(x: 1 + offset * 2, y: 0.5)
        )
    }

    // MARK: - Benefit Row

    @ViewBuilder
    private func benefitRow(icon: String, title: String, description: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.white)
                .frame(width: 36, height: 36)
                .background(Color.white.opacity(0.15))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.75))
            }
        }
    }
}
