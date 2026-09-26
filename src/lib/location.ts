export interface LocationInfo {
  type: "car" | "room" | "table";
  display: string;      // e.g. "Car DL 01 AB 1234", "Room 101", "Table 4"
  badge: string;        // e.g. "🚗", "R101", "T4"
  shortBadge: string;   // e.g. "🚗", "R101", "T4"
  label: string;        // e.g. "Car DL 01 AB 1234"
  actionLabel: string;  // e.g. "Mark Delivered to Car ✅"
  deliverText: string;  // e.g. "Deliver to [name] at Car DL 01 AB 1234 (2 Guests)"
  isVehicle: boolean;
  isRoom: boolean;
}

export function formatDestination(
  rawTable?: string,
  vehicleNumber?: string,
  customerName?: string,
  guestCount?: number
): LocationInfo {
  const table = (rawTable || "").trim();
  const vehicle = (vehicleNumber || "").trim();
  const name = (customerName || "").trim() || "Guest Diner";
  const guests = guestCount && guestCount > 0 ? guestCount : 1;
  const guestSuffix = `(${guests} ${guests === 1 ? "Guest" : "Guests"})`;

  // 1. Vehicle / Car-O-Bar / Drive-In
  if (
    vehicle ||
    table.toLowerCase().startsWith("car ") ||
    table.toLowerCase().includes("drive") ||
    table.toLowerCase().includes("vehic")
  ) {
    let plate = vehicle;
    if (!plate) {
      plate = table
        .replace(/^car\s*[-:]?\s*/i, "")
        .replace(/^drive[-_]?in\s*[-:]?\s*/i, "")
        .trim();
    }
    if (!plate || plate.toLowerCase() === "drive" || plate.toLowerCase() === "car") {
      plate = "DRIVE-IN";
    }
    const display = `Car ${plate.toUpperCase()}`;
    return {
      type: "car",
      display,
      badge: "🚗",
      shortBadge: "🚗",
      label: display,
      actionLabel: "Mark Delivered to Car ✅",
      deliverText: `Deliver to ${name} at ${display} ${guestSuffix}`,
      isVehicle: true,
      isRoom: false,
    };
  }

  // 2. Hotel Room
  if (
    table.toLowerCase().startsWith("room") ||
    table.toLowerCase().startsWith("r-") ||
    table.toLowerCase().includes("hotel")
  ) {
    const num =
      table.replace(/[^0-9]/g, "") ||
      table.replace(/^room\s*[-:]?\s*/i, "").trim() ||
      "101";
    const display = `Room ${num}`;
    return {
      type: "room",
      display,
      badge: `R${num}`,
      shortBadge: `R${num}`,
      label: display,
      actionLabel: "Mark Delivered to Room ✅",
      deliverText: `Deliver to ${name} at ${display} ${guestSuffix}`,
      isVehicle: false,
      isRoom: true,
    };
  }

  // 3. Fine Dine / Cafe Table
  const cleanNum = table.replace(/[^0-9]/g, "") || "1";
  const display = `Table ${cleanNum}`;
  return {
    type: "table",
    display,
    badge: `T${cleanNum}`,
    shortBadge: `T${cleanNum}`,
    label: display,
    actionLabel: "Mark Served to Table ✅",
    deliverText: `Deliver to ${name} at ${display} ${guestSuffix}`,
    isVehicle: false,
    isRoom: false,
  };
}
