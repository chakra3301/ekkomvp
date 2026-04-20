import SwiftUI

/// Modal shown when the user can upgrade to the INFINITE tier.
struct UpgradeModal: View {
    @Binding var isPresented: Bool
    @Environment(PurchaseManager.self) private var purchaseManager
    @State private var animatePhase: CGFloat = 0
    @State private var showSuccess = false

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
                            if success { triggerSuccessBeat() }
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

            // Celebration overlay — lives on top of the modal body, only
            // visible after a successful purchase. Auto-dismisses the whole
            // modal so the user lands back in the app with a win, not a
            // silently-closed sheet.
            if showSuccess {
                successOverlay
                    .transition(.opacity)
            }
        }
        .onAppear {
            // Kick off the gradient animation
            withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
                animatePhase = 1
            }
        }
    }

    // MARK: - Success Celebration

    private func triggerSuccessBeat() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        withAnimation(.spring(response: 0.55, dampingFraction: 0.6)) {
            showSuccess = true
        }
        // Second haptic when the stars finish flying — adds a "landed" feel.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) {
            UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.4) {
            isPresented = false
        }
    }

    private var successOverlay: some View {
        ZStack {
            // Deep-magenta veil so the celebration reads as its own moment
            // rather than "modal on top of modal."
            Color.black.opacity(0.55).ignoresSafeArea()

            RadialGradient(
                colors: [
                    Color(red: 0.85, green: 0.0, blue: 1.0).opacity(0.55),
                    Color.clear,
                ],
                center: .center,
                startRadius: 20,
                endRadius: 320
            )
            .ignoresSafeArea()

            // 12 star sprites flying outward on a circle. Each one fades and
            // scales up slightly as it travels — reads as a burst.
            ForEach(0..<12, id: \.self) { i in
                let angle = Double(i) / 12.0 * 2 * .pi
                Image(uiImage: EKKOStarSprite.image(size: 96, variant: .detailed))
                    .resizable()
                    .frame(width: 72, height: 72)
                    .foregroundStyle(.white)
                    .offset(
                        x: showSuccess ? cos(angle) * 220 : 0,
                        y: showSuccess ? sin(angle) * 220 : 0
                    )
                    .scaleEffect(showSuccess ? 1.1 : 0.3)
                    .opacity(showSuccess ? 0.0 : 1.0)
                    .rotationEffect(.degrees(Double(i) * 27))
                    .animation(
                        .easeOut(duration: 1.2).delay(Double(i) * 0.02),
                        value: showSuccess
                    )
            }

            VStack(spacing: 14) {
                Image(systemName: "infinity")
                    .font(.system(size: 96, weight: .bold))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.white, Color(red: 1.0, green: 0.75, blue: 1.0)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .shadow(color: Color(red: 1.0, green: 0.3, blue: 1.0).opacity(0.8), radius: 24)
                    .scaleEffect(showSuccess ? 1.0 : 0.3)

                Text("Infinite unlocked")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(.white)
                    .shadow(color: .black.opacity(0.4), radius: 8)

                Text("Welcome to the full Connect ✦")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.85))
            }
            .opacity(showSuccess ? 1 : 0)
            .animation(.easeOut(duration: 0.6).delay(0.1), value: showSuccess)
        }
        .allowsHitTesting(false)
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
                    color: Color.accentColor,
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
                .init(color: Color.accentColor, location: 0.66),
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
