/*
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Complaint } from "@/data/store";

// Fix default marker icons
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

function createIcon(status: string) {
  const color = statusColors[status] || "#6b7280";

  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

interface MapViewProps {
  complaints: Complaint[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (complaint: Complaint) => void;
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

  const defaultCenter = useMemo<[number, number]>(
    () => center || [13.05, 80.26],
    [center]
  );

  const defaultZoom = zoom ?? 12;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [defaultCenter, defaultZoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    const handleResize = () => {
      mapRef.current?.invalidateSize();
    };

    window.addEventListener("resize", handleResize);

    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 200);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const validComplaints = complaints.filter((complaint) => {
      const lat = Number(complaint.lat);
      const lng = Number(complaint.long);

      return (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      );
    });

    if (validComplaints.length === 0) {
      map.setView(defaultCenter, defaultZoom);
      return;
    }

    validComplaints.forEach((complaint, index) => {
      const lat = Number(complaint.lat);
      const lng = Number(complaint.long);

      const marker = L.marker([lat, lng], {
        icon: createIcon(complaint.status),
      });

      const popupRoot = document.createElement("div");
      popupRoot.className = "min-w-[180px]";

      const complaintTitle =
        (complaint as any).id ||
        (complaint as any)._id ||
        `Complaint ${index + 1}`;

      const description = complaint.description
        ? complaint.description.length > 80
          ? `${complaint.description.slice(0, 80)}...`
          : complaint.description
        : "No description available";

      popupRoot.innerHTML = `
        <p class="font-bold text-sm">${complaintTitle}</p>
        <p class="text-xs mt-1">${description}</p>
        <div class="mt-2 flex gap-2 items-center flex-wrap">
          <span class="text-xs rounded px-2 py-0.5 bg-secondary text-secondary-foreground">${complaint.status || "Unknown"}</span>
          <span class="text-xs">${complaint.category || "General"}</span>
        </div>
      `;

      marker.bindPopup(popupRoot);
      marker.on("click", () => onMarkerClick?.(complaint));
      marker.addTo(markersLayer);
    });

    if (validComplaints.length === 1) {
      map.setView(
        [Number(validComplaints[0].lat), Number(validComplaints[0].long)],
        Math.max(defaultZoom, 15)
      );
    } else {
      const bounds = L.latLngBounds(
        validComplaints.map((c) => [Number(c.lat), Number(c.long)] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [complaints, defaultCenter, defaultZoom, onMarkerClick]);

  return (
    <div
      className="rounded-xl overflow-hidden border shadow-sm"
      style={{ height }}
    >
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}*/
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Complaint } from "@/data/store";

// Fix default marker icons
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

function createIcon(status: string) {
  const color = statusColors[status] || "#6b7280";

  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

interface MapViewProps {
  complaints: Complaint[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (complaint: Complaint) => void;
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

  const defaultCenter = useMemo<[number, number]>(
    () => center || [13.0827, 80.2707],
    [center]
  );

  const defaultZoom = zoom ?? 12;

  const getLat = (complaint: any) =>
    Number(complaint.lat ?? complaint.latitude);

  const getLng = (complaint: any) =>
    Number(complaint.long ?? complaint.longitude);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [defaultCenter, defaultZoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    const handleResize = () => {
      mapRef.current?.invalidateSize();
    };

    window.addEventListener("resize", handleResize);

    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 200);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const pendingCount = complaints.filter((c: any) => c.status === "Pending").length;
  const inProgressCount = complaints.filter((c: any) => c.status === "In Progress").length;
  const resolvedCount = complaints.filter((c: any) => c.status === "Resolved").length;

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const validComplaints = complaints.filter((complaint: any) => {
      const lat = getLat(complaint);
      const lng = getLng(complaint);

      return (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      );
    });

    if (validComplaints.length === 0) {
      map.setView(defaultCenter, defaultZoom);
      return;
    }

    validComplaints.forEach((complaint: any, index) => {
      const lat = getLat(complaint);
      const lng = getLng(complaint);

      const marker = L.marker([lat, lng], {
        icon: createIcon(complaint.status),
      });

      const popupRoot = document.createElement("div");
      popupRoot.className = "min-w-[180px]";

      const complaintTitle =
        complaint.id || complaint._id || `Complaint ${index + 1}`;

      const description = complaint.description
        ? complaint.description.length > 80
          ? `${complaint.description.slice(0, 80)}...`
          : complaint.description
        : "No description available";

      popupRoot.innerHTML = `
        <p class="font-bold text-sm">${complaintTitle}</p>
        <p class="text-xs mt-1">${description}</p>
        <div class="mt-2 flex gap-2 items-center flex-wrap">
          <span class="text-xs rounded px-2 py-0.5 bg-secondary text-secondary-foreground">
            ${complaint.status || "Unknown"}
          </span>
          <span class="text-xs">${complaint.category || "General"}</span>
        </div>
      `;

      marker.bindPopup(popupRoot);
      marker.on("click", () => onMarkerClick?.(complaint));
      marker.addTo(markersLayer);
    });

    if (validComplaints.length === 1) {
      map.setView([getLat(validComplaints[0]), getLng(validComplaints[0])], Math.max(defaultZoom, 15));
    } else {
      const bounds = L.latLngBounds(
        validComplaints.map((c: any) => [getLat(c), getLng(c)] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [complaints, defaultCenter, defaultZoom, onMarkerClick]);

  return (
    <div className="rounded-xl border shadow-sm bg-white">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Issue Map</h2>

        <div className="flex flex-wrap gap-4 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#ef4444" }}
            ></span>
            <span>Pending ({pendingCount})</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#f59e0b" }}
            ></span>
            <span>In Progress ({inProgressCount})</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#22c55e" }}
            ></span>
            <span>Resolved ({resolvedCount})</span>
          </div>
        </div>
      </div>

      <div style={{ height }}>
        <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}