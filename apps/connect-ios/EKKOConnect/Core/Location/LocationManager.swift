import Foundation
import CoreLocation

/// CoreLocation wrapper for getting user GPS coordinates + reverse geocoding to city name.
@Observable
final class LocationManager: NSObject, CLLocationManagerDelegate {
    var currentLocation: CLLocationCoordinate2D?
    var cityName: String?
    var isLocating = false
    var error: String?

    private let manager = CLLocationManager()
    private var continuation: CheckedContinuation<(latitude: Double, longitude: Double, city: String?), Error>?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
    }

    // MARK: - Get Current Location

    /// Request location permission and get current coordinates + city name.
    func getCurrentLocation() async throws -> (latitude: Double, longitude: Double, city: String?) {
        isLocating = true
        error = nil

        defer { isLocating = false }

        return try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation

            switch manager.authorizationStatus {
            case .notDetermined:
                manager.requestWhenInUseAuthorization()
            case .authorizedWhenInUse, .authorizedAlways:
                manager.requestLocation()
            case .denied, .restricted:
                continuation.resume(throwing: LocationError.permissionDenied)
                self.continuation = nil
            @unknown default:
                continuation.resume(throwing: LocationError.unknown)
                self.continuation = nil
            }
        }
    }

    // MARK: - CLLocationManagerDelegate

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            if continuation != nil {
                manager.requestLocation()
            }
        case .denied, .restricted:
            continuation?.resume(throwing: LocationError.permissionDenied)
            continuation = nil
        default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        let coord = location.coordinate
        currentLocation = coord

        // Reverse geocode
        Task {
            let city = await reverseGeocode(latitude: coord.latitude, longitude: coord.longitude)
            cityName = city
            continuation?.resume(returning: (coord.latitude, coord.longitude, city))
            continuation = nil
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        self.error = error.localizedDescription
        continuation?.resume(throwing: error)
        continuation = nil
    }

    // MARK: - Reverse Geocode (Nominatim, matching the React implementation)

    private func reverseGeocode(latitude: Double, longitude: Double) async -> String? {
        let urlString = "https://nominatim.openstreetmap.org/reverse?lat=\(latitude)&lon=\(longitude)&format=json&zoom=10"
        guard let url = URL(string: urlString) else { return nil }

        do {
            var request = URLRequest(url: url)
            request.setValue("EKKOConnect/1.0", forHTTPHeaderField: "User-Agent")
            let (data, _) = try await URLSession.shared.data(for: request)
            let json = try JSONDecoder().decode(NominatimResponse.self, from: data)
            return json.address.city ?? json.address.town ?? json.address.village ?? json.address.county
        } catch {
            return nil
        }
    }
}

// MARK: - Types

enum LocationError: LocalizedError {
    case permissionDenied
    case unknown

    var errorDescription: String? {
        switch self {
        case .permissionDenied: return "Location permission denied. Enable in Settings."
        case .unknown: return "Unable to get location"
        }
    }
}

private struct NominatimResponse: Codable {
    let address: NominatimAddress
}

private struct NominatimAddress: Codable {
    let city: String?
    let town: String?
    let village: String?
    let county: String?
}
