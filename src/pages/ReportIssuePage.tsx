
import { useEffect, useRef, useState } from "react";
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
  const [speechError, setSpeechError] = useState("");

  const recognitionRef = useRef<any>(null);
  const speechBaseTextRef = useRef("");
  const finalTranscriptRef = useRef("");

  const [isClassifying, setIsClassifying] = useState(false);
  const [aiPrediction, setAiPrediction] =
    useState<AIPrediction | null>(null);
  const [showMismatchDialog, setShowMismatchDialog] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Stop speech recognition if the component is removed.
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

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

      if (
        prediction.confidence >= 0.7 &&
        prediction.category !== category
      ) {
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

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(reader.result as string);
    };

    reader.readAsDataURL(file);
    classifyImage(file);
  };

  // Combine existing description, confirmed speech, and live speech.
  const updateDescriptionFromSpeech = (interimText = "") => {
    const parts = [
      speechBaseTextRef.current.trim(),
      finalTranscriptRef.current.trim(),
      interimText.trim(),
    ].filter(Boolean);

    setDescription(parts.join(" "));
  };

  const toggleVoice = () => {
    // Stop an active recording.
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechError(
        "Speech recognition is unavailable. Try the latest version of Microsoft Edge."
      );
      toast.error("Speech recognition is not supported in this browser");
      return;
    }

    setSpeechError("");

    // Preserve any text already typed into the description.
    speechBaseTextRef.current = description.trim();
    finalTranscriptRef.current = "";

    const recognition = new SpeechRecognitionAPI();

    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setSpeechError("");
    };

    recognition.onresult = (event: any) => {
      let interimText = "";

      // Process only results that have changed.
      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result = event.results[i];
        const transcript = result[0]?.transcript?.trim();

        if (!transcript) continue;

        if (result.isFinal) {
          finalTranscriptRef.current = [
            finalTranscriptRef.current,
            transcript,
          ]
            .filter(Boolean)
            .join(" ");
        } else {
          interimText += `${transcript} `;
        }
      }

      // Show live words and retain confirmed phrases.
      updateDescriptionFromSpeech(interimText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);

      let message = "Voice input failed. Please try again.";

      if (event.error === "not-allowed") {
        message =
          "Microphone access is blocked. Allow microphone access in Edge settings.";
      } else if (event.error === "no-speech") {
        message =
          "No speech detected. Speak clearly and try again.";
      } else if (event.error === "network") {
        message =
          "Speech recognition network error. Check your internet connection and try again.";
      } else if (event.error === "audio-capture") {
        message =
          "No microphone was detected. Check your microphone connection.";
      } else if (event.error === "language-not-supported") {
        message =
          "This recognition language is unavailable. Try English (India).";
      } else if (event.error === "aborted") {
        // A deliberate stop or abort is not necessarily a failure.
        return;
      }

      setSpeechError(message);
      toast.error(message);
    };

    recognition.onend = () => {
      // Remove temporary words that were never confirmed.
      updateDescriptionFromSpeech();
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error("Unable to start speech recognition:", error);
      recognitionRef.current = null;
      setIsRecording(false);

      const message =
        "Could not start the microphone. Please try again.";
      setSpeechError(message);
      toast.error(message);
    }
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

  const fetchLocation = (retry = false) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        if (accuracy > 100 && !retry) {
          toast.loading("Low accuracy detected, retrying...", {
            id: "location",
          });
          fetchLocation(true);
          return;
        }

        if (accuracy > 100) {
          toast.error(
            `Still getting poor accuracy (${Math.round(
              accuracy
            )}m). Try using mobile GPS.`,
            { id: "location" }
          );
          return;
        }

        setLat(latitude);
        setLong(longitude);

        toast.success(
          `Location captured successfully (${Math.round(
            accuracy
          )}m accuracy)`,
          { id: "location" }
        );
      },
      () => {
        toast.error("Unable to fetch location", {
          id: "location",
        });
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

    toast.loading("Fetching current location...", {
      id: "location",
    });
    fetchLocation();
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

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    // Stop recognition before submitting the complaint.
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (!user) {
      toast.error("Please login first to submit a complaint");
      navigate("/login");
      return;
    }

    const finalDescription =
      category === "Others"
        ? `[${otherCategory.trim()}] ${description.trim()}`
        : description.trim();

    if (!description.trim()) {
      toast.error("Please enter a description of the issue");
      return;
    }

    const complaintData = {
      userId: user?.id || user?._id || "",
      userName: user?.name || "",
      userEmail: user?.email || "",
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
      toast.error(
        error.message || "Complaint submission failed"
      );
    }
  };

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
                  AI detected: <strong>{aiPrediction.category}</strong>{" "}
                  ({Math.round(aiPrediction.confidence * 100)}% confidence)
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Label className="text-sm font-semibold text-foreground">
                Description
              </Label>

              <div className="flex items-center gap-2">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  disabled={isRecording}
                  className="rounded-md border-none bg-secondary px-2 py-1 text-xs text-foreground"
                  aria-label="Speech recognition language"
                >
                  <option value="en-IN">English (India)</option>
                  <option value="ta-IN">தமிழ்</option>
                </select>

                <button
                  type="button"
                  onClick={toggleVoice}
                  aria-label={
                    isRecording
                      ? "Stop voice input"
                      : "Start voice input"
                  }
                  aria-pressed={isRecording}
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
              onChange={(e) => {
                setDescription(e.target.value);

                // Keep the speech base synchronized if the user edits
                // the description while not recording.
                if (!recognitionRef.current) {
                  speechBaseTextRef.current = e.target.value.trim();
                  finalTranscriptRef.current = "";
                }
              }}
              placeholder="Describe the issue in detail, or tap the microphone to speak..."
              rows={4}
              required
            />

            {isRecording && (
              <p className="mt-2 animate-pulse text-xs text-destructive">
                🎤 Listening... Speak clearly. Tap the microphone to stop.
              </p>
            )}

            {speechError && (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {speechError}
              </p>
            )}

            <p className="mt-2 text-xs text-muted-foreground">
              Check the recognized text and correct any mistakes before submitting.
            </p>
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
                capture="environment"
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

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getLocation}
              >
                <MapPin className="mr-1 h-3 w-3" /> Get GPS
              </Button>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Latitude
                </Label>
                <Input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(+e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  Longitude
                </Label>
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

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isClassifying}
          >
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
