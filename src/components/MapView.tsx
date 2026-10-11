
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Complaint } from "@/data/store";

// Fix default Leaflet marker icons.
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

interface MapViewProps {
  complaints: Complaint[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (complaint: Complaint) => void;
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

  if (
    !Number.isFinite(number) ||
    number < min ||
    number > max
  ) {
    return null;
  }

  return number;
}

function getLat(
  complaint: ComplaintWithCoordinates
): number | null {
  return getCoordinate(
    complaint.lat ?? complaint.latitude,
    -90,
    90
  );
}

function getLng(
  complaint: ComplaintWithCoordinates
): number | null {
  return getCoordinate(
    complaint.long ?? complaint.longitude,
    -180,
    180
  );
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

function createPopup(
  complaint: ComplaintWithCoordinates,
  index: number
) {
  const root = document.createElement("div");
  root.style.minWidth = "180px";

  const title = document.createElement("p");
  title.className = "font-bold text-sm";
  title.textContent =
    complaint.id || complaint._id || `Complaint ${index + 1}`;

  const description = document.createElement("p");
  description.className = "text-xs mt-1";

  const text = complaint.description || "No description available";
  description.textContent =
    text.length > 80 ? `${text.slice(0, 80)}...` : text;

  const details = document.createElement("div");
  details.className = "mt-2 flex gap-2 items-center flex-wrap";

  const status = document.createElement("span");
  status.className = "text-xs rounded px-2 py-0.5";
  status.style.backgroundColor =
    statusColors[complaint.status] || "#6b7280";
  status.style.color = "#ffffff";
  status.textContent = complaint.status || "Unknown";

  const category = document.createElement("span");
  category.className = "text-xs";
  category.textContent = complaint.category || "General";

  details.append(status, category);
  root.append(title, description, details);

  const address = complaint.address ?? complaint.location;

  if (typeof address === "string" && address.trim()) {
    const addressElement = document.createElement("p");
    addressElement.className = "text-xs mt-2";
    addressElement.textContent = address;
    root.appendChild(addressElement);
  }

  return root;
}

export default function MapView({
  complaints,
  height = "400px",
  center,
  zoom,
  onMarkerClick,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const locationRequestId = useRef(0);

  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

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

  // Initialize Leaflet once.
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

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });

    resizeObserver.observe(container);

    const timer = window.setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 200);

    return () => {
      window.clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();

      mapRef.current = null;
      markersLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // Render complaint markers.
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
      const marker = L.marker([lat, lng], {
        icon: createIcon(complaint.status),
      });

      marker.bindPopup(createPopup(complaint, index));

      marker.on("click", () => {
        onMarkerClick?.(complaint as Complaint);
      });

      marker.addTo(layer);
    });

    if (validComplaints.length === 0) {
      // Do not reset the map if the user has already located themselves.
      if (!userMarkerRef.current) {
        map.setView(defaultCenter, defaultZoom);
      }
      return;
    }

    // Keep the complaint markers visible without overriding a user's
    // current GPS view unnecessarily.
    if (!userMarkerRef.current) {
      if (validComplaints.length === 1) {
        const item = validComplaints[0];
        map.setView([item.lat, item.lng], Math.max(defaultZoom, 15));
      } else {
        const bounds = L.latLngBounds(
          validComplaints.map(
            ({ lat, lng }) => [lat, lng] as [number, number]
          )
        );

        map.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 16,
        });
      }
    }

    const timer = window.setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 200);

    return () => window.clearTimeout(timer);
  }, [complaints, defaultCenter, defaultZoom, onMarkerClick]);

  // Request a fresh high-accuracy browser location.
  
const detectMyLocation = () => {
  const map = mapRef.current;

  if (!map || !navigator.geolocation) {
    setLocationMessage(
      "Location is unavailable. Please check your browser and try again."
    );
    return;
  }

  if (!window.isSecureContext) {
    setLocationMessage(
      "Location requires HTTPS. Open the secure deployed website."
    );
    return;
  }

  // Cancel any earlier location watch.
  if (locationRequestId.current) {
    navigator.geolocation.clearWatch(locationRequestId.current);
  }

  setLocating(true);
  setGpsAccuracy(null);
  setLocationMessage(
    "Searching for a more accurate GPS reading. Keep the page open and wait..."
  );

  let bestAccuracy = Infinity;
  let finished = false;

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      console.log("GPS reading:", {
        latitude,
        longitude,
        accuracyMeters: accuracy,
      });

      // Retain the best reading received so far.
      if (accuracy < bestAccuracy) {
        bestAccuracy = accuracy;
        setGpsAccuracy(accuracy);
      }

      // Accept a reading only if it meets the chosen threshold.
      if (accuracy <= 50 && !finished) {
        finished = true;
        navigator.geolocation.clearWatch(watchId);
        locationRequestId.current = 0;
        setLocating(false);

        const point: L.LatLngExpression = [latitude, longitude];

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng(point);
        } else {
          userMarkerRef.current = L.marker(point).addTo(map);
        }

        userMarkerRef.current.bindPopup(
          `Your location<br>Accuracy: ${Math.round(accuracy)} m`
        );

        map.setView(point, 17);
        userMarkerRef.current.openPopup();

        setLocationMessage(
          `Location detected with approximately ${Math.round(accuracy)} m accuracy.`
        );
      } else if (!finished) {
        setLocationMessage(
          `Best accuracy so far: ${Math.round(bestAccuracy)} m. ` +
          "Keep GPS enabled and try outdoors."
        );
      }
    },
    (error) => {
      if (finished) return;

      finished = true;
      navigator.geolocation.clearWatch(watchId);
      locationRequestId.current = 0;
      setLocating(false);

      setLocationMessage(
        error.code === 1
          ? "Location permission denied. Allow location access in your browser."
          : error.code === 3
          ? "GPS timed out. Try again outdoors."
          : "Position unavailable. Enable your phone's Location setting and retry."
      );
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 60000,
    }
  );

  locationRequestId.current = watchId;

  // Stop watching after 60 seconds if no accurate reading arrives.
  window.setTimeout(() => {
    if (!finished) {
      finished = true;
      navigator.geolocation.clearWatch(watchId);
      locationRequestId.current = 0;
      setLocating(false);

      setLocationMessage(
        `Could not achieve 50 m accuracy. Best reading: ${
          Number.isFinite(bestAccuracy)
            ? Math.round(bestAccuracy) + " m"
            : "unavailable"
        }. Try outdoors with your phone's GPS enabled.`
      );
    }
  }, 60000);
};

  return (
    <div className="rounded-xl overflow-hidden border shadow-sm bg-white">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-800">
            CivicPlus Issue Map
          </h2>

          <button
            type="button"
            onClick={detectMyLocation}
            disabled={locating}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
          >
            {locating ? "Detecting GPS..." : "Use My Location"}
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

        {gpsAccuracy !== null && gpsAccuracy > 100 && (
          <p className="mt-1 text-xs text-amber-700">
            Reported GPS accuracy: {Math.round(gpsAccuracy)} meters.
            The map has not treated this reading as precise.
          </p>
        )}

        <div className="flex flex-wrap gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#ef4444" }}
            />
            <span>Pending ({pendingCount})</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#f59e0b" }}
            />
            <span>In Progress ({inProgressCount})</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#22c55e" }}
            />
            <span>Resolved ({resolvedCount})</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#2563eb" }}
            />
            <span>My Location</span>
          </div>
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
