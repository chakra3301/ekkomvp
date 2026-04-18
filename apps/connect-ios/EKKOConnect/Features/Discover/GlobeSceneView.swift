import SwiftUI
import SceneKit
import UIKit
import simd

/// The wireframe-style globe for the global Discover view.
///
/// Renders a dotted sphere (fibonacci lattice) with latitude/longitude
/// grid lines, a starfield backdrop, and neon-pulsing pins for each user.
/// The globe auto-rotates when idle and supports pan-to-rotate, pinch-to-zoom,
/// and tap-to-select on pins. Tapping a pin dispatches the selected pin up
/// to the SwiftUI layer via `onPinTap`.
struct GlobeSceneView: UIViewRepresentable {
    let pins: [GlobePin]
    let scheme: ColorScheme

    /// Discrete zoom bucket for expand-filter decisions.
    /// `close` at tight zoom → city filter; `far` when pulled back → country radius.
    enum ZoomLevel { case close, far }

    /// Fires when the user taps a pin. The second arg is the *current* zoom
    /// level — the UI uses it to decide whether tapping expands to "swipe
    /// people in this city" (close) or "swipe people in this country/region"
    /// (far).
    var onPinTap: (GlobePin, ZoomLevel) -> Void

    /// Palette for the wireframe skin — swapped when color scheme changes.
    /// Pin tints are brand colors (neon green/red/purple) and aren't themed.
    struct Palette {
        let background: UIColor
        let wire: UIColor            // dots + coastlines
        let wireEmission: UIColor    // adds a soft glow (lighter in dark, dimmer in light)
        let grid: UIColor
        let innerGlow: UIColor
        let starfieldAlpha: CGFloat  // 0 in light mode — no stars on white bg
        let bloomIntensity: CGFloat
        let bloomThreshold: CGFloat

        static let dark = Palette(
            background: .black,
            wire: UIColor(white: 1.0, alpha: 0.92),
            wireEmission: UIColor(white: 0.85, alpha: 1),
            grid: UIColor(white: 1.0, alpha: 0.28),
            innerGlow: UIColor(white: 0.04, alpha: 1),
            starfieldAlpha: 1.0,
            bloomIntensity: 1.1,
            bloomThreshold: 0.35
        )

        /// Light mode is the dark-mode palette inverted: black wireframe on
        /// a near-white background. Same alphas, same rendering geometry —
        /// just flipped luminance.
        static let light = Palette(
            background: UIColor(white: 0.99, alpha: 1),
            wire: UIColor(white: 0.0, alpha: 0.92),
            wireEmission: UIColor(white: 0.15, alpha: 1),
            grid: UIColor(white: 0.0, alpha: 0.28),
            innerGlow: UIColor(white: 0.97, alpha: 1),
            starfieldAlpha: 0.0,
            bloomIntensity: 0.35,
            bloomThreshold: 0.7
        )
    }

    static func palette(for scheme: ColorScheme) -> Palette {
        scheme == .dark ? .dark : .light
    }

    // MARK: - Tunables

    /// Globe radius in scene units. All distances are derived from this.
    static let globeRadius: CGFloat = 2.0
    static let pinRadius: CGFloat = 0.028
    static let dotCount: Int = 3200
    static let cameraMinZ: Float = 3.2  // closest (most zoomed in)
    static let cameraMaxZ: Float = 11.0 // farthest (most zoomed out)

    // MARK: - UIViewRepresentable

    func makeCoordinator() -> Coordinator {
        Coordinator(onPinTap: onPinTap)
    }

    func makeUIView(context: Context) -> SCNView {
        let view = SCNView(frame: .zero)
        let palette = Self.palette(for: scheme)
        view.backgroundColor = palette.background
        view.antialiasingMode = .multisampling4X
        view.isOpaque = true
        view.allowsCameraControl = false // we drive the camera ourselves
        view.autoenablesDefaultLighting = false
        view.rendersContinuously = true

        // Scene
        let scene = SCNScene()
        view.scene = scene

        // Camera (bloom makes neon dots glow)
        let cameraNode = SCNNode()
        let camera = SCNCamera()
        camera.zNear = 0.1
        camera.zFar = 200
        camera.fieldOfView = 40
        camera.bloomIntensity = palette.bloomIntensity
        camera.bloomThreshold = palette.bloomThreshold
        camera.bloomBlurRadius = 8.0
        cameraNode.camera = camera
        cameraNode.position = SCNVector3(0, 0, 6.5)
        scene.rootNode.addChildNode(cameraNode)
        context.coordinator.cameraNode = cameraNode
        context.coordinator.camera = camera

        // Starfield (far-away inverted sphere with point dots)
        let starfield = makeStarfield()
        scene.rootNode.addChildNode(starfield)
        context.coordinator.starfieldNode = starfield

        // Globe root — holds the sphere body + all pins so they rotate together
        let globeRoot = SCNNode()
        scene.rootNode.addChildNode(globeRoot)
        context.coordinator.globeRoot = globeRoot

        // Slight axial tilt for life
        globeRoot.eulerAngles = SCNVector3(x: -0.22, y: 0, z: 0)

        // Sphere body: dotted surface + coastlines + grid lines
        let (dottedSphere, wireMat) = makeDottedSphere(palette: palette)
        globeRoot.addChildNode(dottedSphere)
        context.coordinator.wireMaterial = wireMat

        let (grid, gridMat) = makeGridLines(palette: palette)
        globeRoot.addChildNode(grid)
        context.coordinator.gridMaterial = gridMat

        if let (coastlines, coastMat) = makeCoastlines(palette: palette) {
            globeRoot.addChildNode(coastlines)
            context.coordinator.coastMaterial = coastMat
        }

        // Soft inner glow — a slightly smaller transparent sphere for depth
        let (inner, innerMat) = makeInnerGlow(palette: palette)
        globeRoot.addChildNode(inner)
        context.coordinator.innerGlowMaterial = innerMat

        // Pins container (we rebuild on update)
        let pinContainer = SCNNode()
        pinContainer.name = "pins"
        globeRoot.addChildNode(pinContainer)
        context.coordinator.pinContainer = pinContainer

        // Idle auto-rotation
        context.coordinator.startAutoRotation()

        // Gestures
        let pan = UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handlePan(_:)))
        let pinch = UIPinchGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handlePinch(_:)))
        let tap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleTap(_:)))
        pan.maximumNumberOfTouches = 1
        view.addGestureRecognizer(pan)
        view.addGestureRecognizer(pinch)
        view.addGestureRecognizer(tap)
        context.coordinator.scnView = view

        // Seed pins
        context.coordinator.updatePins(pins)

        return view
    }

    func updateUIView(_ uiView: SCNView, context: Context) {
        context.coordinator.onPinTap = onPinTap
        context.coordinator.updatePins(pins)
        context.coordinator.applyPalette(Self.palette(for: scheme), to: uiView)
    }

    // MARK: - Geometry builders

    /// A dotted sphere drawn as a single point-primitive geometry, for performance.
    /// Points are evenly distributed using the fibonacci (golden-angle) lattice.
    private func makeDottedSphere(palette: Palette) -> (SCNNode, SCNMaterial) {
        let n = Self.dotCount
        let r = Float(Self.globeRadius)
        let golden: Float = .pi * (3 - sqrtf(5))

        var verts: [SCNVector3] = []
        verts.reserveCapacity(n)
        for i in 0..<n {
            let y = 1.0 - (Float(i) / Float(max(n - 1, 1))) * 2.0
            let radius = sqrtf(max(0, 1 - y * y))
            let theta = Float(i) * golden
            let x = cosf(theta) * radius
            let z = sinf(theta) * radius
            verts.append(SCNVector3(x * r, y * r, z * r))
        }

        let source = SCNGeometrySource(vertices: verts)
        let indices: [Int32] = (0..<Int32(n)).map { $0 }
        let data = Data(bytes: indices, count: indices.count * MemoryLayout<Int32>.size)
        let element = SCNGeometryElement(
            data: data,
            primitiveType: .point,
            primitiveCount: n,
            bytesPerIndex: MemoryLayout<Int32>.size
        )
        element.pointSize = 2.2
        element.minimumPointScreenSpaceRadius = 1.0
        element.maximumPointScreenSpaceRadius = 3.0

        let geom = SCNGeometry(sources: [source], elements: [element])
        let mat = SCNMaterial()
        mat.diffuse.contents = palette.wire
        mat.emission.contents = palette.wireEmission
        mat.lightingModel = .constant
        mat.writesToDepthBuffer = true
        geom.materials = [mat]

        return (SCNNode(geometry: geom), mat)
    }

    /// Thin latitude / longitude wireframe lines.
    private func makeGridLines(palette: Palette) -> (SCNNode, SCNMaterial) {
        let r = Float(Self.globeRadius) * 1.001
        let container = SCNNode()

        let lineMat = SCNMaterial()
        lineMat.diffuse.contents = palette.grid
        lineMat.emission.contents = palette.grid
        lineMat.lightingModel = .constant

        func lineGeometry(from points: [SCNVector3]) -> SCNGeometry {
            let source = SCNGeometrySource(vertices: points)
            var indices: [Int32] = []
            for i in 0..<(points.count - 1) {
                indices.append(Int32(i))
                indices.append(Int32(i + 1))
            }
            let data = Data(bytes: indices, count: indices.count * MemoryLayout<Int32>.size)
            let element = SCNGeometryElement(
                data: data,
                primitiveType: .line,
                primitiveCount: indices.count / 2,
                bytesPerIndex: MemoryLayout<Int32>.size
            )
            let g = SCNGeometry(sources: [source], elements: [element])
            g.materials = [lineMat]
            return g
        }

        // Meridians (constant longitude)
        let meridianCount = 12
        for i in 0..<meridianCount {
            let lon = Float(i) / Float(meridianCount) * .pi * 2
            var pts: [SCNVector3] = []
            let segs = 96
            for s in 0...segs {
                let lat = -Float.pi / 2 + .pi * Float(s) / Float(segs)
                let x = r * cosf(lat) * cosf(lon)
                let y = r * sinf(lat)
                let z = -r * cosf(lat) * sinf(lon)
                pts.append(SCNVector3(x, y, z))
            }
            container.addChildNode(SCNNode(geometry: lineGeometry(from: pts)))
        }

        // Parallels (constant latitude)
        let parallels: [Float] = [-60, -30, 0, 30, 60].map { $0 * .pi / 180 }
        for lat in parallels {
            var pts: [SCNVector3] = []
            let segs = 128
            for s in 0...segs {
                let lon = Float(s) / Float(segs) * .pi * 2
                let x = r * cosf(lat) * cosf(lon)
                let y = r * sinf(lat)
                let z = -r * cosf(lat) * sinf(lon)
                pts.append(SCNVector3(x, y, z))
            }
            container.addChildNode(SCNNode(geometry: lineGeometry(from: pts)))
        }

        return (container, lineMat)
    }

    /// Parses the bundled Natural Earth coastline GeoJSON and renders every
    /// LineString / MultiLineString as thin glowing arcs hugging the globe.
    /// Returns nil if the file is missing or fails to parse — the globe stays
    /// usable with just dots + grid.
    private func makeCoastlines(palette: Palette) -> (SCNNode, SCNMaterial)? {
        guard let url = Bundle.main.url(forResource: "coastlines", withExtension: "geojson"),
              let data = try? Data(contentsOf: url),
              let collection = try? JSONDecoder().decode(GeoJSONFeatureCollection.self, from: data) else {
            #if DEBUG
            print("[GlobeSceneView] coastlines.geojson missing or unreadable")
            #endif
            return nil
        }

        let r = Float(Self.globeRadius) * 1.003

        let lineMat = SCNMaterial()
        lineMat.diffuse.contents = palette.wire
        lineMat.emission.contents = palette.wireEmission
        lineMat.lightingModel = .constant
        lineMat.writesToDepthBuffer = false

        let container = SCNNode()

        for feature in collection.features {
            for line in feature.geometry.lineStrings {
                // Convert [lon, lat] pairs into 3D points on the sphere.
                // For long segments between adjacent points (rare in 110m but
                // possible near dateline crossings), slerp subdivisions so the
                // line follows the surface rather than cutting a chord.
                var pts: [SCNVector3] = []
                pts.reserveCapacity(line.count)
                for i in 0..<line.count {
                    let (lonA, latA) = (line[i][0], line[i][1])
                    let aVec = Self.latLonToVector(lat: Float(latA), lon: Float(lonA), radius: r)
                    if i == 0 {
                        pts.append(aVec)
                        continue
                    }
                    let (lonB, latB) = (line[i - 1][0], line[i - 1][1])
                    let bVec = Self.latLonToVector(lat: Float(latB), lon: Float(lonB), radius: r)
                    let dot = max(-1, min(1, aVec.x * bVec.x + aVec.y * bVec.y + aVec.z * bVec.z) / (r * r))
                    let angle = acosf(dot)
                    let stepAngle: Float = 0.05 // ~2.9°
                    let steps = max(1, Int(angle / stepAngle))
                    if steps > 1 {
                        for s in 1...steps {
                            let t = Float(s) / Float(steps)
                            pts.append(Self.slerp(bVec, aVec, t: t, radius: r))
                        }
                    } else {
                        pts.append(aVec)
                    }
                }
                if pts.count < 2 { continue }

                let source = SCNGeometrySource(vertices: pts)
                var indices: [Int32] = []
                indices.reserveCapacity((pts.count - 1) * 2)
                for i in 0..<(pts.count - 1) {
                    indices.append(Int32(i))
                    indices.append(Int32(i + 1))
                }
                let data = Data(bytes: indices, count: indices.count * MemoryLayout<Int32>.size)
                let element = SCNGeometryElement(
                    data: data,
                    primitiveType: .line,
                    primitiveCount: indices.count / 2,
                    bytesPerIndex: MemoryLayout<Int32>.size
                )
                let g = SCNGeometry(sources: [source], elements: [element])
                g.materials = [lineMat]
                container.addChildNode(SCNNode(geometry: g))
            }
        }

        return (container, lineMat)
    }

    // MARK: - Math helpers

    static func latLonToVector(lat: Float, lon: Float, radius: Float) -> SCNVector3 {
        let latRad = lat * .pi / 180
        let lonRad = lon * .pi / 180
        let x = radius * cosf(latRad) * cosf(lonRad)
        let y = radius * sinf(latRad)
        let z = -radius * cosf(latRad) * sinf(lonRad)
        return SCNVector3(x, y, z)
    }

    /// Spherical linear interpolation between two points on the globe surface.
    static func slerp(_ a: SCNVector3, _ b: SCNVector3, t: Float, radius: Float) -> SCNVector3 {
        let dot = max(-1, min(1, (a.x * b.x + a.y * b.y + a.z * b.z) / (radius * radius)))
        let omega = acosf(dot)
        if omega < 0.0001 {
            return SCNVector3(
                a.x + (b.x - a.x) * t,
                a.y + (b.y - a.y) * t,
                a.z + (b.z - a.z) * t
            )
        }
        let s = sinf(omega)
        let w1 = sinf((1 - t) * omega) / s
        let w2 = sinf(t * omega) / s
        return SCNVector3(
            a.x * w1 + b.x * w2,
            a.y * w1 + b.y * w2,
            a.z * w1 + b.z * w2
        )
    }

    /// Translucent inner sphere for a subtle atmospheric depth effect.
    private func makeInnerGlow(palette: Palette) -> (SCNNode, SCNMaterial) {
        let sphere = SCNSphere(radius: Self.globeRadius * 0.985)
        sphere.segmentCount = 48
        let mat = SCNMaterial()
        mat.diffuse.contents = palette.innerGlow
        mat.lightingModel = .constant
        mat.isDoubleSided = false
        mat.writesToDepthBuffer = true
        sphere.materials = [mat]
        let node = SCNNode(geometry: sphere)
        return (node, mat)
    }

    /// Starfield: a giant inverted sphere rendered as small white points.
    private func makeStarfield() -> SCNNode {
        let n = 900
        let r: Float = 60
        var verts: [SCNVector3] = []
        verts.reserveCapacity(n)
        var rng = SystemRandomNumberGenerator()
        for _ in 0..<n {
            // Uniform sphere random via normal trick
            let u1 = Float.random(in: 0..<1, using: &rng)
            let u2 = Float.random(in: 0..<1, using: &rng)
            let z = 1 - 2 * u1
            let phi = 2 * Float.pi * u2
            let rr = sqrtf(max(0, 1 - z * z))
            let x = rr * cosf(phi)
            let y = rr * sinf(phi)
            verts.append(SCNVector3(x * r, y * r, z * r))
        }

        let source = SCNGeometrySource(vertices: verts)
        let indices: [Int32] = (0..<Int32(n)).map { $0 }
        let data = Data(bytes: indices, count: indices.count * MemoryLayout<Int32>.size)
        let element = SCNGeometryElement(
            data: data,
            primitiveType: .point,
            primitiveCount: n,
            bytesPerIndex: MemoryLayout<Int32>.size
        )
        element.pointSize = 1.2
        element.minimumPointScreenSpaceRadius = 0.5
        element.maximumPointScreenSpaceRadius = 2.2

        let g = SCNGeometry(sources: [source], elements: [element])
        let mat = SCNMaterial()
        mat.diffuse.contents = UIColor(white: 0.95, alpha: 1)
        mat.emission.contents = UIColor(white: 0.5, alpha: 1)
        mat.lightingModel = .constant
        mat.writesToDepthBuffer = false
        g.materials = [mat]

        let node = SCNNode(geometry: g)
        return node
    }

    // MARK: - Coordinator

    final class Coordinator: NSObject {
        var onPinTap: (GlobePin, ZoomLevel) -> Void
        weak var scnView: SCNView?
        weak var globeRoot: SCNNode?
        weak var cameraNode: SCNNode?
        weak var pinContainer: SCNNode?
        weak var camera: SCNCamera?
        weak var starfieldNode: SCNNode?

        /// Strong refs to the actual materials used by each wireframe layer.
        /// Held strongly (not weak) because SceneKit's `firstMaterial` getter
        /// and `enumerateChildNodes` can return stale copies — keeping our
        /// own ref guarantees the material we update is the same one every
        /// geometry on that layer is rendering with.
        var wireMaterial: SCNMaterial?
        var gridMaterial: SCNMaterial?
        var coastMaterial: SCNMaterial?
        var innerGlowMaterial: SCNMaterial?

        private var lastAppliedPaletteKey: String?

        private var currentPins: [GlobePin] = []
        private var pinNodesById: [String: SCNNode] = [:]

        /// Rotation state
        private var rotationY: Float = 0
        private var rotationX: Float = -0.22
        private var panLastTranslation: CGPoint = .zero
        private var autoRotationTimer: CADisplayLink?
        private var isInteracting = false
        private var resumeAutoRotateAt: CFTimeInterval = 0
        private var lastFrameTime: CFTimeInterval = 0

        /// Zoom state
        private var cameraZ: Float = 6.5
        private var pinchStartZ: Float = 6.5

        init(onPinTap: @escaping (GlobePin, ZoomLevel) -> Void) {
            self.onPinTap = onPinTap
        }

        /// Threshold: below this camera-Z → city (close); above → country (far).
        /// Pinned near the middle of the min/max range so there's clear
        /// tactile feedback when crossing the boundary.
        private static let zoomBoundary: Float = 6.8

        var zoomLevel: ZoomLevel {
            cameraZ > Self.zoomBoundary ? .far : .close
        }

        /// Recolor the wireframe skin + background when the color scheme
        /// changes. Safe to call every updateUIView — it no-ops when the
        /// palette key hasn't changed.
        func applyPalette(_ palette: Palette, to view: SCNView) {
            let key = palette.background.description + "|" + palette.wire.description
            guard lastAppliedPaletteKey != key else { return }
            lastAppliedPaletteKey = key

            view.backgroundColor = palette.background
            wireMaterial?.diffuse.contents = palette.wire
            wireMaterial?.emission.contents = palette.wireEmission
            coastMaterial?.diffuse.contents = palette.wire
            coastMaterial?.emission.contents = palette.wireEmission
            gridMaterial?.diffuse.contents = palette.grid
            gridMaterial?.emission.contents = palette.grid
            innerGlowMaterial?.diffuse.contents = palette.innerGlow

            starfieldNode?.isHidden = palette.starfieldAlpha == 0
            camera?.bloomIntensity = palette.bloomIntensity
            camera?.bloomThreshold = palette.bloomThreshold
        }

        deinit {
            autoRotationTimer?.invalidate()
        }

        func startAutoRotation() {
            autoRotationTimer?.invalidate()
            let link = CADisplayLink(target: self, selector: #selector(tick))
            link.preferredFramesPerSecond = 60
            link.add(to: .main, forMode: .common)
            autoRotationTimer = link
        }

        @objc private func tick(_ link: CADisplayLink) {
            let now = link.timestamp
            let dt = lastFrameTime == 0 ? 1.0 / 60.0 : (now - lastFrameTime)
            lastFrameTime = now

            // Auto-rotate when not interacting (after a short idle delay post-gesture)
            if !isInteracting && now >= resumeAutoRotateAt {
                rotationY += Float(dt) * 0.06 // rad/sec — slow planet-like spin
            }

            globeRoot?.eulerAngles = SCNVector3(x: rotationX, y: rotationY, z: 0)
        }

        // MARK: Gestures

        @objc func handlePan(_ gesture: UIPanGestureRecognizer) {
            guard let view = scnView else { return }
            switch gesture.state {
            case .began:
                isInteracting = true
                panLastTranslation = .zero
            case .changed:
                let t = gesture.translation(in: view)
                let dx = Float(t.x - panLastTranslation.x)
                let dy = Float(t.y - panLastTranslation.y)
                panLastTranslation = t

                // Rotation sensitivity scales with zoom — zoomed in = finer control
                let zoomFactor = cameraZ / GlobeSceneView.cameraMaxZ
                let sensitivity: Float = 0.005 * (0.4 + zoomFactor * 0.8)

                rotationY += dx * sensitivity
                rotationX += dy * sensitivity
                // Clamp vertical tilt so we don't flip
                rotationX = max(-1.25, min(1.25, rotationX))
            case .ended, .cancelled, .failed:
                isInteracting = false
                resumeAutoRotateAt = CACurrentMediaTime() + 2.0
            default: break
            }
        }

        @objc func handlePinch(_ gesture: UIPinchGestureRecognizer) {
            switch gesture.state {
            case .began:
                isInteracting = true
                pinchStartZ = cameraZ
            case .changed:
                let newZ = pinchStartZ / Float(gesture.scale)
                cameraZ = max(GlobeSceneView.cameraMinZ, min(GlobeSceneView.cameraMaxZ, newZ))
                cameraNode?.position = SCNVector3(0, 0, cameraZ)
            case .ended, .cancelled, .failed:
                isInteracting = false
                resumeAutoRotateAt = CACurrentMediaTime() + 2.0
            default: break
            }
        }

        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let view = scnView else { return }
            let loc = gesture.location(in: view)
            let options: [SCNHitTestOption: Any] = [
                .searchMode: SCNHitTestSearchMode.all.rawValue,
                .ignoreHiddenNodes: true,
                .backFaceCulling: true,
            ]
            let results = view.hitTest(loc, options: options)

            // Walk up the hit chain to find a pin node (tagged with userId in name)
            for hit in results {
                var node: SCNNode? = hit.node
                while let n = node {
                    if let name = n.name, name.hasPrefix("pin:") {
                        let userId = String(name.dropFirst(4))
                        if let pin = currentPins.first(where: { $0.userId == userId }) {
                            // Pause auto-rotate briefly so the user can read the card
                            isInteracting = false
                            resumeAutoRotateAt = CACurrentMediaTime() + 4.0
                            onPinTap(pin, zoomLevel)
                            return
                        }
                    }
                    node = n.parent
                }
            }
        }

        // MARK: Pin management

        func updatePins(_ pins: [GlobePin]) {
            currentPins = pins
            guard let container = pinContainer else { return }

            // Diff: add new pins, remove stale ones.
            let newIds = Set(pins.map { $0.userId })
            for (id, node) in pinNodesById where !newIds.contains(id) {
                node.removeFromParentNode()
                pinNodesById.removeValue(forKey: id)
            }
            for pin in pins where pinNodesById[pin.userId] == nil {
                let node = Self.makePinNode(pin: pin, globeRadius: GlobeSceneView.globeRadius, pinRadius: GlobeSceneView.pinRadius)
                container.addChildNode(node)
                pinNodesById[pin.userId] = node
            }
        }

        /// Current camera distance from origin — lets SwiftUI read zoom state.
        var currentCameraZ: Float { cameraZ }

        static func makePinNode(pin: GlobePin, globeRadius: CGFloat, pinRadius: CGFloat) -> SCNNode {
            // Position on the sphere surface (slightly above, so pins stand on the skin)
            let r = Float(globeRadius) * 1.004
            let lat = Float(pin.lat) * .pi / 180
            let lon = Float(pin.lon) * .pi / 180
            let x = r * cosf(lat) * cosf(lon)
            let y = r * sinf(lat)
            let z = -r * cosf(lat) * sinf(lon)

            // Wrapper node so pulse scaling doesn't fight with position
            let wrapper = SCNNode()
            wrapper.name = "pin:\(pin.userId)"
            wrapper.position = SCNVector3(x, y, z)

            let color: UIColor
            switch pin.tint {
            case .creative: color = UIColor(red: 0.20, green: 1.0, blue: 0.55, alpha: 1)    // neon green
            case .client:   color = UIColor(red: 1.0,  green: 0.25, blue: 0.35, alpha: 1)   // neon red
            case .infinite: color = UIColor(red: 0.73, green: 0.38, blue: 1.0,  alpha: 1)   // neon purple
            }

            // Core dot
            let core = SCNSphere(radius: pinRadius)
            core.segmentCount = 14
            let mat = SCNMaterial()
            mat.diffuse.contents = color
            mat.emission.contents = color
            mat.lightingModel = .constant
            core.materials = [mat]
            let coreNode = SCNNode(geometry: core)
            wrapper.addChildNode(coreNode)

            // Halo — larger translucent sphere that pulses
            let halo = SCNSphere(radius: pinRadius * 2.2)
            halo.segmentCount = 14
            let haloMat = SCNMaterial()
            haloMat.diffuse.contents = color.withAlphaComponent(0.0)
            haloMat.emission.contents = color.withAlphaComponent(0.55)
            haloMat.lightingModel = .constant
            haloMat.writesToDepthBuffer = false
            haloMat.blendMode = .add
            halo.materials = [haloMat]
            let haloNode = SCNNode(geometry: halo)
            haloNode.opacity = 0.5
            wrapper.addChildNode(haloNode)

            // Pulse: stagger start per-pin via userId hash so they don't all blink in sync
            let phase = Double(abs(pin.userId.hashValue % 1000)) / 1000.0
            let pulseOut = SCNAction.group([
                SCNAction.scale(to: 1.8, duration: 1.2),
                SCNAction.fadeOpacity(to: 0.0, duration: 1.2),
            ])
            pulseOut.timingMode = .easeOut
            let reset = SCNAction.group([
                SCNAction.scale(to: 1.0, duration: 0.0),
                SCNAction.fadeOpacity(to: 0.55, duration: 0.0),
            ])
            let sequence = SCNAction.sequence([
                SCNAction.wait(duration: phase * 1.5),
                SCNAction.repeatForever(SCNAction.sequence([pulseOut, reset, SCNAction.wait(duration: 0.3)])),
            ])
            haloNode.runAction(sequence)

            // Core breathing pulse (subtler)
            let breathe = SCNAction.repeatForever(SCNAction.sequence([
                SCNAction.scale(to: 1.25, duration: 0.9),
                SCNAction.scale(to: 1.0,  duration: 0.9),
            ]))
            coreNode.runAction(breathe)

            return wrapper
        }
    }
}

// MARK: - GeoJSON Decoding

/// Minimal GeoJSON decoder — just enough to pull LineString / MultiLineString
/// coordinates from the bundled Natural Earth coastline feature collection.
/// Point / Polygon etc. are ignored.
private struct GeoJSONFeatureCollection: Decodable {
    let features: [GeoJSONFeature]
}

private struct GeoJSONFeature: Decodable {
    let geometry: GeoJSONGeometry
}

/// `coordinates` differs in nesting based on `type`, so we decode manually.
/// After decoding we expose a normalized `lineStrings: [[[Double]]]` shape
/// where each inner `[Double]` is `[lon, lat]`.
private struct GeoJSONGeometry: Decodable {
    let lineStrings: [[[Double]]]

    private enum CodingKeys: String, CodingKey {
        case type
        case coordinates
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "LineString":
            // coordinates: [[lon, lat], ...]
            let coords = try container.decode([[Double]].self, forKey: .coordinates)
            self.lineStrings = [coords]
        case "MultiLineString":
            // coordinates: [[[lon, lat], ...], ...]
            let coords = try container.decode([[[Double]]].self, forKey: .coordinates)
            self.lineStrings = coords
        default:
            self.lineStrings = []
        }
    }
}
