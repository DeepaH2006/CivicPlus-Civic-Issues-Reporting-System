type Props = {
  category?: string;
  isHighPriority?: boolean;
};

const contactMap: Record<string, { department: string; phone: string }> = {
  "Water Issue": {
    department: "Water Supply Department",
    phone: "1800-001-100",
  },
  "Garbage": {
    department: "Sanitation Department",
    phone: "1800-002-200",
  },
  "Pothole": {
    department: "Road Maintenance Department",
    phone: "1800-003-300",
  },
  "Streetlight": {
    department: "Electrical Department",
    phone: "1800-004-400",
  },
  "Others": {
    department: "General Services Department",
    phone: "1800-005-500",
  },
};

export default function DepartmentEmergencyContact({
  category,
  isHighPriority = false,
}: Props) {
  if (!category || !contactMap[category]) return null;

  const { department, phone } = contactMap[category];

  return (
    <div
      className={`rounded-xl border p-4 mt-2 ${
        isHighPriority
          ? "border-red-500 bg-red-50"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Department Emergency Contact
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            <strong>Department:</strong> {department}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Phone:</strong> {phone}
          </p>
          {isHighPriority && (
            <p className="text-xs font-medium text-red-600 mt-2">
              High priority issue — contact highlighted
            </p>
          )}
        </div>

        <a
          href={`tel:${phone}`}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition"
        >
          📞 Call Now
        </a>
      </div>
    </div>
  );
}