
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Complaint } from "@/data/store";

// Fix default Leaflet marker icons
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
  // Do not convert missing or empty coordinates to zero.
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

function getLat(complaint: ComplaintWithCoordinates): number | null {
  return getCoordinate(
    complaint.lat ?? complaint.latitude,
    -90,
    90
  );
}

function getLng(complaint: ComplaintWithCoordinates): number | null {
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
    html: `
      <div style="
        width:28px;
        height:28px;
        border-radius:50%;
        background:${color};
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function createPopup(complaint: ComplaintWithCoordinates, index: number) {
  // Use textContent instead of inserting user-submitted content
  // through innerHTML.
  const root = document.createElement("div");
  root.style.minWidth = "180px";

  const title = document.createElement("p");
  title.className = "font-bold text-sm";
  title.textContent =
    complaint.id || complaint._id || `Complaint ${index + 1}`;

  const description = document.createElement("p");
  description.className = "text-xs mt-1";
  description.textContent = complaint.description
    ? complaint.description.length > 80
      ? `${complaint.description.slice(0, 80)}...`
      : complaint.description
    : "No description available";

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

  // Chennai is only the fallback map location, not the user's GPS.
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

  // Initialize the map only once.
  useEffect(() => {
    const container = mapContainerRef.current;

    if (!container || mapRef.current) return;

    const initialView = initialViewRef.current;

    const map = L.map(container, {
      center: initialView.center,
      zoom: initialView.zoom,
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

    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });

    resizeObserver.observe(container);

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 200);

    return () => {
      window.clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      map.remove();

      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Render complaint markers using validated coordinates.
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

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

    // If no complaints have coordinates, show the fallback center.
    if (validComplaints.length === 0) {
      map.setView(defaultCenter, defaultZoom);
      return;
    }

    validComplaints.forEach(({ complaint, lat, lng }, index) => {
      // Leaflet expects [latitude, longitude].
      const marker = L.marker([lat, lng], {
        icon: createIcon(complaint.status),
      });

      marker.bindPopup(createPopup(complaint, index));

      marker.on("click", () => {
        onMarkerClick?.(complaint as Complaint);
      });

      marker.addTo(markersLayer);
    });

    if (validComplaints.length === 1) {
      const { lat, lng } = validComplaints[0];

      map.setView(
        [lat, lng],
        Math.max(defaultZoom, 15)
      );
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

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 200);

    return () => {
      window.clearTimeout(resizeTimer);
    };
  }, [complaints, defaultCenter, defaultZoom, onMarkerClick]);

  return (
    <div className="rounded-xl overflow-hidden border shadow-sm bg-white">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">
          Issue Map
        </h2>

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
