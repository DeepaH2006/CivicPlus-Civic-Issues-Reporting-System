import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useComplaints } from "@/contexts/ComplaintContext";
import { Category, Priority } from "@/data/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  MicOff,
  MapPin,
  Upload,
  AlertTriangle,
  Camera,
  Loader2,
  Brain,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import EmergencyButton from "@/components/EmergencyButton";
import MapView from "@/components/MapView";
import CategoryMismatchDialog from "@/components/CategoryMismatchDialog";
import DepartmentEmergencyContact from "@/components/DepartmentEmergencyContact";
import { toast } from "sonner";

const CATEGORIES: Category[] = [
  "Garbage",
  "Pothole",
  "Streetlight",
  "Water Issue",
  "Others",
];

interface AIPrediction {
  category: Category;
  confidence: number;
  reason: string;
}

export default function ReportIssuePage() {
  const { user } = useAuth();
  const { addComplaint } = useComplaints();
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category>("Garbage");
  const [otherCategory, setOtherCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("Normal");
  const [imagePreview, setImagePreview] = useState("");
  const [lat, setLat] = useState(13.0827);
  const [long, setLong] = useState(80.2707);
  const [isRecording, setIsRecording] = useState(false);
  const [lang, setLang] = useState("en-IN");
  const recognitionRef = useRef<any>(null);

  const [isClassifying, setIsClassifying] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<AIPrediction | null>(null);
  const [showMismatchDialog, setShowMismatchDialog] = useState(false);

  const classifyImage = async (file: File) => {
    setIsClassifying(true);
    setAiPrediction(null);

    try {
      const fileName = file.name.toLowerCase();

      let detectedCategory: Category = "Others";
      let confidence = 0.75;
      let reason = "Keyword-based demo classifier";

      if (
        fileName.includes("pothole") ||
        fileName.includes("road") ||
        fileName.includes("hole")
      ) {
        detectedCategory = "Pothole";
        confidence = 0.9;
        reason = "Filename suggests road or pothole issue";
      } else if (
        fileName.includes("garbage") ||
        fileName.includes("trash") ||
        fileName.includes("waste") ||
        fileName.includes("dustbin")
      ) {
        detectedCategory = "Garbage";
        confidence = 0.9;
        reason = "Filename suggests garbage issue";
      } else if (
        fileName.includes("water") ||
        fileName.includes("leak") ||
        fileName.includes("pipe")
      ) {
        detectedCategory = "Water Issue";
        confidence = 0.88;
        reason = "Filename suggests water issue";
      } else if (
        fileName.includes("streetlight") ||
        fileName.includes("street-light") ||
        fileName.includes("light") ||
        fileName.includes("lamp")
      ) {
        detectedCategory = "Streetlight";
        confidence = 0.88;
        reason = "Filename suggests streetlight issue";
      }

      const prediction: AIPrediction = {
        category: detectedCategory,
        confidence,
        reason,
      };

      setAiPrediction(prediction);

      if (prediction.confidence >= 0.7 && prediction.category !== category) {
        setShowMismatchDialog(true);
        toast.warning(
          `Possible mismatch: selected "${category}", detected "${prediction.category}"`
        );
      } else if (prediction.category === category) {
        toast.success(
          `AI matched category: ${prediction.category} (${Math.round(
            prediction.confidence * 100
          )}%)`
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Image classification failed");
    } finally {
      setIsClassifying(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    classifyImage(file);
  };

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : `http://${window.location.hostname}:5000`;

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!user) {
    toast.error("Please login first to submit a complaint");
    navigate("/login");
    return;
  }

  const finalDescription =
    category === "Others"
      ? `[${otherCategory.trim()}] ${description.trim()}`
      : description.trim();

  const complaintData = {
    userId: user?.id,
    userName: user?.name,
    category,
    description: finalDescription,
    imageUrl:
      imagePreview ||
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400",
    latitude: lat,
    longitude: long,
    priority,
    status: "Pending",
  };

  console.log("Submitting to:", `${API_BASE}/complaint`);
  console.log("Payload:", complaintData);

  try {
    const response = await fetch(`${API_BASE}/complaint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(complaintData),
    });

    const data = await response.json();
    console.log("Response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Submission failed");
    }

    if (data?.complaint) {
      addComplaint(data.complaint);
    }

    toast.success("Complaint submitted successfully!");
    navigate("/dashboard");
  } catch (error: any) {
    console.error("Submit error:", error);
    toast.error("Server not reachable");
  }
};
<button
  type="button"
  onClick={async () => {
    try {
      const res = await fetch("http://localhost:5000/");
      const text = await res.text();
      console.log("Backend test:", text);
      alert(text);
    } catch (err) {
      console.error("Backend test failed:", err);
      alert("Cannot reach backend");
    }
  }}
>
  Test Backend
</button>
/*
const getLocation = () => {
  if (!navigator.geolocation) {
    toast.error("Geolocation is not supported by this browser");
    return;
  }

  toast.loading("Fetching your location...", { id: "location" });

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);
      console.log("Accuracy in meters:", accuracy);

      setLat(latitude);
      setLong(longitude);

      if (accuracy <= 50) {
        toast.success(`Accurate location captured (${Math.round(accuracy)}m)`, {
          id: "location",
        });
      } else {
        toast.success(
          `Location captured, but accuracy is low (${Math.round(accuracy)}m). Try moving outdoors or enabling GPS.`,
          { id: "location" }
        );
      }
    },
    (err) => {
      console.error("Geolocation error:", err);

      let message = "Unable to fetch location";

      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = "Location permission denied. Please allow location access.";
          break;
        case err.POSITION_UNAVAILABLE:
          message = "Location unavailable. Turn on GPS / device location.";
          break;
        case err.TIMEOUT:
          message = "Location request timed out. Please try again.";
          break;
        default:
          message = "Failed to get location.";
      }

      toast.error(message, { id: "location" });
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
};
*/
const fetchLocation = (retry = false) => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;

      if (accuracy > 100 && !retry) {
        toast.loading("Low accuracy detected, retrying...", { id: "location" });
        fetchLocation(true);
        return;
      }

      if (accuracy > 100) {
        toast.error(
          `Still getting poor accuracy (${Math.round(accuracy)}m). Try using mobile GPS.`,
          { id: "location" }
        );
        return;
      }

      setLat(latitude);
      setLong(longitude);
      toast.success(
        `Location captured successfully (${Math.round(accuracy)}m accuracy)`,
        { id: "location" }
      );
    },
    (err) => {
      toast.error("Unable to fetch location", { id: "location" });
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    }
  );
};

const getLocation = () => {
  if (!navigator.geolocation) {
    toast.error("Geolocation not supported");
    return;
  }

  toast.loading("Fetching current location...", { id: "location" });
  fetchLocation();
};
/*
const getLocation = () => {
  if (!navigator.geolocation) {
    toast.error("Geolocation is not supported by this browser");
    return;
  }

  toast.loading("Fetching current location...", { id: "location" });

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);
      console.log("Accuracy:", accuracy);

      // Reject very poor accuracy
      if (accuracy > 100) {
        toast.error(
          `Location is too inaccurate (${Math.round(
            accuracy
          )}m). Please move outdoors and try again.`,
          { id: "location" }
        );
        return;
      }

      setLat(latitude);
      setLong(longitude);

      toast.success(
        `Location captured successfully (${Math.round(accuracy)}m accuracy)`,
        { id: "location" }
      );
    },
    (err) => {
      console.error("Geolocation error:", err);

      let message = "Unable to fetch location";
      if (err.code === 1) {
        message = "Location permission denied. Please allow location access.";
      } else if (err.code === 2) {
        message = "Location unavailable. Please turn on GPS or device location.";
      } else if (err.code === 3) {
        message = "Location request timed out. Please try again.";
      }

      toast.error(message, { id: "location" });
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    }
  );
};*/
/*const getLocation = () => {
  if (!navigator.geolocation) {
    toast.error("Geolocation is not supported by this browser");
    return;
  }

  toast.loading("Getting accurate location...", { id: "location" });

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);
      console.log("Accuracy:", accuracy);

      setLat(latitude);
      setLong(longitude);

      if (accuracy <= 30) {
        toast.success(`Accurate location captured (${Math.round(accuracy)}m)`, {
          id: "location",
        });
        navigator.geolocation.clearWatch(watchId);
      }
    },
    (err) => {
      console.error("Geolocation error:", err);
      toast.error("Unable to get location. Check permission and GPS.", {
        id: "location",
      });
      navigator.geolocation.clearWatch(watchId);
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    }
  );

  setTimeout(() => {
    navigator.geolocation.clearWatch(watchId);
  }, 20000);
};*/
/*
  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLong(pos.coords.longitude);
        toast.success("Accurate location captured");
      },
      (err) => {
        console.error(err);
        toast.error("Unable to get accurate location. Please allow permission.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };*/

  const toggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      null;

    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Voice input failed");
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleAcceptSuggestion = () => {
    if (aiPrediction) {
      setCategory(aiPrediction.category);
      toast.success(`Category changed to "${aiPrediction.category}"`);
    }
    setShowMismatchDialog(false);
  };

  const handleKeepSelection = () => {
    toast.info("Keeping your original category selection.");
    setShowMismatchDialog(false);
  };

  const previewComplaint = [
    {
      id: "NEW",
      userId: "",
      userName: "",
      category,
      description: "Your report location",
      imageUrl: "",
      lat,
      long,
      status: "Pending" as const,
      priority,
      department: "",
      createdAt: "",
      history: [],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-6 font-heading text-2xl font-bold text-foreground">
          Report an Issue
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border bg-card p-4">
            <Label className="mb-3 block text-sm font-semibold text-foreground">
              Category
            </Label>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    category === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {c === "Garbage" && "🗑️ "}
                  {c === "Pothole" && "🕳️ "}
                  {c === "Streetlight" && "💡 "}
                  {c === "Water Issue" && "💧 "}
                  {c === "Others" && "📋 "}
                  {c}
                </button>
              ))}
            </div>

            {category === "Others" && (
              <Input
                className="mt-3"
                placeholder="Specify the issue type"
                value={otherCategory}
                onChange={(e) => setOtherCategory(e.target.value)}
                required
              />
            )}

            {aiPrediction && aiPrediction.confidence >= 0.7 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-2 text-xs">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-foreground">
                  AI detected: <strong>{aiPrediction.category}</strong> (
                  {Math.round(aiPrediction.confidence * 100)}% confidence)
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">
                Description
              </Label>

              <div className="flex items-center gap-2">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="rounded-md border-none bg-secondary px-2 py-1 text-xs text-foreground"
                >
                  <option value="en-IN">English</option>
                  <option value="ta-IN">தமிழ்</option>
                </select>

                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`rounded-full p-2 transition-colors ${
                    isRecording
                      ? "animate-pulse bg-destructive text-destructive-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              required
            />

            {isRecording && (
              <p className="mt-2 animate-pulse text-xs text-destructive">
                🎤 Listening... Speak now
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4">
            <Label className="mb-3 block text-sm font-semibold text-foreground">
              Photo Evidence
            </Label>

            <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:bg-secondary/50">
              {isClassifying && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-background/80">
                  <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    🤖 AI analyzing image...
                  </p>
                </div>
              )}

              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 w-full rounded-lg object-cover"
                />
              ) : (
                <>
                  <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Tap to upload image
                  </p>
                </>
              )}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <Label className="mb-3 block text-sm font-semibold text-foreground">
              Priority
            </Label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPriority("Normal")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  priority === "Normal"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                Normal
              </button>

              <button
                type="button"
                onClick={() => setPriority("High")}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  priority === "High"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <AlertTriangle className="h-3 w-3" /> High
              </button>
            </div>
          </div>

          <DepartmentEmergencyContact
            category={category}
            isHighPriority={priority === "High"}
          />

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">
                Location
              </Label>

              <Button type="button" variant="outline" size="sm" onClick={getLocation}>
                <MapPin className="mr-1 h-3 w-3" /> Get GPS
              </Button>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(+e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={long}
                  onChange={(e) => setLong(+e.target.value)}
                />
              </div>
            </div>

            <MapView
              complaints={previewComplaint}
              height="200px"
              center={[lat, long]}
              zoom={15}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isClassifying}>
            {isClassifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Image...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit Complaint
              </>
            )}
          </Button>
        </form>
      </div>

      <EmergencyButton />

      <CategoryMismatchDialog
        open={showMismatchDialog}
        onOpenChange={setShowMismatchDialog}
        userCategory={category}
        predictedCategory={aiPrediction?.category || "Others"}
        confidence={aiPrediction?.confidence || 0}
        reason={aiPrediction?.reason || ""}
        onAcceptSuggestion={handleAcceptSuggestion}
        onKeepSelection={handleKeepSelection}
      />
    </div>
  );
}