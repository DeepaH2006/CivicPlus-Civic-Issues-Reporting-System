
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Complaint } from "@/data/store";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const statusColors: Record<string, string> = {
  Pending: "#ef4444",
  "In Progress": "#f59e0b",
  Resolved: "#22c55e",
};

interface SelectedLocation {
  address: string;
  latitude: number | null;
  longitude: number | null;
  source: "gps" | "manual" | "map";
  accuracy: number | null;
}

interface MapViewProps {
  complaints: Complaint[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (complaint: Complaint) => void;
  onLocationSelect?: (location: SelectedLocation) => void;
}

type ComplaintWithCoordinates = Complaint & {
  lat?: number | string | null;
  long?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  id?: string;
  _id?: string;
  address?: string;
  location?: string;
};

function getCoordinate(
  value: number | string | null | undefined,
  min: number,
  max: number
): number | null {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < min || number > max) {
    return null;
  }

  return number;
}

function getLat(c: ComplaintWithCoordinates): number | null {
  return getCoordinate(c.lat ?? c.latitude, -90, 90);
}

function getLng(c: ComplaintWithCoordinates): number | null {
  return getCoordinate(c.long ?? c.longitude, -180, 180);
}

function createIcon(status: string) {
  const color = statusColors[status] || "#6b7280";

  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function createPopup(c: ComplaintWithCoordinates, index: number) {
  const root = document.createElement("div");
  root.style.minWidth = "180px";

  const title = document.createElement("p");
  title.className = "font-bold text-sm";
  title.textContent = c.id || c._id || `Complaint ${index + 1}`;

  const description = document.createElement("p");
  description.className = "text-xs mt-1";

  const desc = c.description || "No description available";
  description.textContent =
    desc.length > 80 ? `${desc.slice(0, 80)}...` : desc;

  const details = document.createElement("div");
  details.className = "mt-2 flex gap-2 items-center flex-wrap";

  const status = document.createElement("span");
  status.className = "text-xs rounded px-2 py-0.5";
  status.style.backgroundColor = statusColors[c.status] || "#6b7280";
  status.style.color = "#fff";
  status.textContent = c.status || "Unknown";

  const category = document.createElement("span");
  category.className = "text-xs";
  category.textContent = c.category || "General";

  details.append(status, category);
  root.append(title, description, details);

  const address = c.address ?? c.location;

  if (typeof address === "string" && address.trim()) {
    const addressElement = document.createElement("p");
    addressElement.className = "text-xs mt-2";
    addressElement.textContent = address;
    root.appendChild(addressElement);
  }

  return root;
}

// Convert a typed address into map coordinates.
async function geocodeAddress(address: string) {
  const url = new URL(
    "https://nominatim.openstreetmap.org/search"
  );

  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      "Address search is temporarily unavailable. Please try again."
    );
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error(
      "Address not found. Include the street, area, city, or a nearby landmark."
    );
  }

  const latitude = Number(results[0].lat);
  const longitude = Number(results[0].lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("The address search returned invalid coordinates.");
  }

  return {
    latitude,
    longitude,
    address: results[0].display_name || address,
  };
}

export default function MapView({
  complaints,
  height = "400px",
  center,
  zoom,
  onMarkerClick,
  onLocationSelect,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const gpsWatchRef = useRef<number | null>(null);
  const gpsTimerRef = useRef<number | null>(null);
  const manualAddressRef = useRef("");

  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);

  const defaultCenter = useMemo<[number, number]>(
    () => center ?? [13.0827, 80.2707],
    [center]
  );

  const defaultZoom = zoom ?? 12;

  const initialViewRef = useRef({
    center: defaultCenter,
    zoom: defaultZoom,
  });

  const pendingCount = complaints.filter(
    (c) => c.status === "Pending"
  ).length;

  const inProgressCount = complaints.filter(
    (c) => c.status === "In Progress"
  ).length;

  const resolvedCount = complaints.filter(
    (c) => c.status === "Resolved"
  ).length;

  function stopGpsWatch() {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation?.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }

    if (gpsTimerRef.current !== null) {
      window.clearTimeout(gpsTimerRef.current);
      gpsTimerRef.current = null;
    }
  }

  function publishLocation(location: SelectedLocation) {
    setSelectedLocation(location);
    onLocationSelect?.(location);
  }

  function setSelectedMarker(
    latitude: number,
    longitude: number,
    popupText: string
  ) {
    const map = mapRef.current;
    if (!map) return;

    const point: L.LatLngExpression = [latitude, longitude];

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(point);
    } else {
      userMarkerRef.current = L.marker(point).addTo(map);
    }

    const popup = document.createElement("div");
    popup.textContent = popupText;

    userMarkerRef.current.bindPopup(popup).openPopup();
    map.setView(point, 17);
  }

  // Initialize the map once.
  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container || mapRef.current) return;

    const initial = initialViewRef.current;

    const map = L.map(container, {
      center: initial.center,
      zoom: initial.zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    const layer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = layer;

    map.on("click", (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([lat, lng]);
      } else {
        userMarkerRef.current = L.marker([lat, lng]).addTo(map);
      }

      userMarkerRef.current
        .bindPopup("Selected issue location")
        .openPopup();

      setGpsAccuracy(null);
      setLocationMessage("Map location selected.");

      publishLocation({
        address: manualAddressRef.current.trim(),
        latitude: lat,
        longitude: lng,
        source: "map",
        accuracy: null,
      });
    });

    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });

    observer.observe(container);

    const timer = window.setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 200);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      stopGpsWatch();
      map.remove();

      mapRef.current = null;
      markersLayerRef.current = null;
      userMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Display complaint markers.
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;

    if (!map || !layer) return;

    layer.clearLayers();

    const validComplaints = (
      complaints as ComplaintWithCoordinates[]
    )
      .map((complaint) => ({
        complaint,
        lat: getLat(complaint),
        lng: getLng(complaint),
      }))
      .filter(
        (
          item
        ): item is {
          complaint: ComplaintWithCoordinates;
          lat: number;
          lng: number;
        } => item.lat !== null && item.lng !== null
      );

    validComplaints.forEach(({ complaint, lat, lng }, index) => {
      L.marker([lat, lng], {
        icon: createIcon(complaint.status),
      })
        .bindPopup(createPopup(complaint, index))
        .on("click", () => onMarkerClick?.(complaint as Complaint))
        .addTo(layer);
    });

    if (selectedLocation) return;

    if (validComplaints.length === 0) {
      map.setView(defaultCenter, defaultZoom);
    } else if (validComplaints.length === 1) {
      const item = validComplaints[0];
      map.setView(
        [item.lat, item.lng],
        Math.max(defaultZoom, 15)
      );
    } else {
      map.fitBounds(
        L.latLngBounds(
          validComplaints.map(
            ({ lat, lng }) => [lat, lng] as [number, number]
          )
        ),
        { padding: [40, 40], maxZoom: 16 }
      );
    }
  }, [
    complaints,
    defaultCenter,
    defaultZoom,
    onMarkerClick,
    selectedLocation,
  ]);

  // Detect the device's best available location. The browser cannot guarantee
  // perfect GPS accuracy; show the reported accuracy instead of rejecting a fix.
  function detectMyLocation() {
    if (!mapRef.current) {
      setLocationMessage("Map is loading. Please try again.");
      return;
    }

    if (!navigator.geolocation) {
      setLocationMessage(
        "Your browser does not support location detection. Enter your address manually."
      );
      return;
    }

    if (!window.isSecureContext) {
      setLocationMessage(
        "Location access requires HTTPS. Open the secure website or enter your address manually."
      );
      return;
    }

    stopGpsWatch();
    setLocating(true);
    setGpsAccuracy(null);
    setLocationMessage("Getting your device location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          setLocating(false);
          setLocationMessage(
            "Your device returned invalid coordinates. Try again or enter the address manually."
          );
          return;
        }

        setSelectedMarker(
          latitude,
          longitude,
          `Your device location. Reported accuracy: approximately ${Math.round(accuracy)} m.`
        );

        publishLocation({
          address: "",
          latitude,
          longitude,
          source: "gps",
          accuracy,
        });

        setGpsAccuracy(accuracy);
        setLocating(false);
        setLocationMessage(
          accuracy <= 100
            ? `Location selected. Reported accuracy: approximately ${Math.round(accuracy)} m.`
            : `Location selected, but accuracy is approximately ${Math.round(accuracy)} m. For a more precise result, enable device location or select the exact point on the map.`
        );
      },
      (error) => {
        setLocating(false);

        if (error.code === 1) {
          setLocationMessage(
            "Location permission denied. Allow location access for this website in your browser settings, then try again."
          );
        } else if (error.code === 2) {
          setLocationMessage(
            "Your device could not determine a location. Enable Windows/device location or enter the address manually."
          );
        } else {
          setLocationMessage(
            "The location request timed out. Try again near a window, check device location settings, or enter the address manually."
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000,
      }
    );
  }

  // Search and select the typed address without submitting
  // the parent complaint form or navigating to another page.
  async function useManualAddress() {
    const address = manualAddress.trim();

    if (!address) {
      setLocationMessage("Please enter an address.");
      return;
    }

    if (!mapRef.current) {
      setLocationMessage("Map is loading. Please try again.");
      return;
    }

    stopGpsWatch();
    setLocating(true);
    setGpsAccuracy(null);
    setLocationMessage("Searching for your address...");

    try {
      const result = await geocodeAddress(address);

      setSelectedMarker(
        result.latitude,
        result.longitude,
        result.address
      );

      publishLocation({
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude,
        source: "manual",
        accuracy: null,
      });

      setLocationMessage(
        "Address found and selected on the map."
      );
    } catch (error) {
      setLocationMessage(
        error instanceof Error
          ? error.message
          : "Unable to find this address. Please try again."
      );
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border shadow-sm bg-white">
      <div className="p-4 border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
            CivicPlus Issue Map
          </h2>

          <button
            type="button"
            onClick={detectMyLocation}
            disabled={locating}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
          >
            {locating ? "Searching..." : "Use My Location"}
          </button>
        </div>

        {locationMessage && (
          <p
            role="status"
            aria-live="polite"
            className="mt-3 text-sm text-gray-700"
          >
            {locationMessage}
          </p>
        )}

        {gpsAccuracy !== null && (
          <p className="mt-1 text-xs text-gray-600">
            Reported GPS accuracy: approximately{" "}
            {Math.round(gpsAccuracy)} m.
          </p>
        )}

        {/* Use a div rather than a nested form. */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label
            htmlFor="manual-location"
            className="block text-sm font-semibold text-gray-800 mb-1"
          >
            Enter the issue address manually
          </label>

          <p className="text-xs text-gray-600 mb-3">
            Enter a street, area, city, or nearby landmark if GPS is unavailable.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="manual-location"
              type="text"
              value={manualAddress}
              onChange={(event) => {
                setManualAddress(event.target.value);
                manualAddressRef.current = event.target.value;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void useManualAddress();
                }
              }}
              placeholder="Street, area, landmark, or address"
              maxLength={300}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={() => void useManualAddress()}
              disabled={locating}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 disabled:opacity-60"
            >
              {locating
                ? "Searching Address..."
                : "Use This Address"}
            </button>
          </div>
        </div>

        {selectedLocation && (
          <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-semibold">Selected location</p>

            <p className="mt-1">
              Source:{" "}
              {selectedLocation.source === "gps"
                ? "GPS"
                : selectedLocation.source === "map"
                ? "Map selection"
                : "Manual address"}
            </p>

            {selectedLocation.address && (
              <p className="mt-1">
                Address: {selectedLocation.address}
              </p>
            )}

            {selectedLocation.latitude !== null &&
              selectedLocation.longitude !== null && (
                <p className="mt-1 break-all">
                  Coordinates:{" "}
                  {selectedLocation.latitude.toFixed(6)},{" "}
                  {selectedLocation.longitude.toFixed(6)}
                </p>
              )}
          </div>
        )}

        <p className="mt-3 text-xs text-gray-500">
          You can also click the map to select a location. Map clicks
          provide coordinates but do not automatically identify the street address.
        </p>

        <div className="flex flex-wrap gap-4 mt-3 text-sm">
          <span>🔴 Pending ({pendingCount})</span>
          <span>🟠 In Progress ({inProgressCount})</span>
          <span>🟢 Resolved ({resolvedCount})</span>
          <span>🔵 Selected location</span>
        </div>
      </div>

      <div style={{ height, width: "100%" }}>
        <div
          ref={mapContainerRef}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}
