// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "HealthTwin",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [
        .library(name: "HealthTwinCore", targets: ["HealthTwinCore"]),
        .library(name: "HealthTwinUI", targets: ["HealthTwinUI"]),
    ],
    targets: [
        .target(name: "HealthTwinCore"),
        .target(name: "HealthTwinUI", dependencies: ["HealthTwinCore"]),
        .testTarget(name: "HealthTwinCoreTests", dependencies: ["HealthTwinCore"]),
    ]
)
