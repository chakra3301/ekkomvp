// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "EKKOConnect",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "EKKOConnect", targets: ["EKKOConnect"]),
    ],
    dependencies: [
        .package(url: "https://github.com/supabase/supabase-swift.git", from: "2.0.0"),
        .package(url: "https://github.com/onevcat/Kingfisher.git", from: "7.0.0"),
        .package(url: "https://github.com/RevenueCat/purchases-ios-spm.git", from: "5.0.0"),
    ],
    targets: [
        .target(
            name: "EKKOConnect",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift"),
                .product(name: "Kingfisher", package: "Kingfisher"),
                .product(name: "RevenueCat", package: "purchases-ios-spm"),
            ],
            path: "EKKOConnect"
        ),
    ]
)
