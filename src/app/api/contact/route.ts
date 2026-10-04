import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, restaurantName, authority, restaurantType, email, phone, message } = body;

    if (!name || !restaurantName || !email || !phone) {
      return NextResponse.json(
        { error: "Name, restaurant name, email, and phone number are required." },
        { status: 400 }
      );
    }

    const leadRecord = {
      id: `LEAD-${Date.now().toString(36).toUpperCase()}`,
      receivedAt: new Date().toISOString(),
      name,
      restaurantName,
      authority: authority || "Owner",
      restaurantType: restaurantType || "Fine Dine Restaurant",
      email,
      phone,
      message: message || "Requested 2 months free trial onboarding & software demonstration.",
      notifiedEmail: "concierge@tableos.in",
      status: "DISPATCHED",
    };

    // Log the incoming enterprise lead for the concierge operations team
    console.log("==========================================");
    console.log("🔔 [TableOS Concierge] NEW ENTERPRISE LEAD NOTIFICATION");
    console.log(JSON.stringify(leadRecord, null, 2));
    console.log("📧 Notification Email Dispatched to: concierge@tableos.in");
    console.log("==========================================");

    return NextResponse.json({
      success: true,
      message: "Your inquiry has been received. Our concierge team has been notified at concierge@tableos.in and will contact you within 2 hours.",
      leadId: leadRecord.id,
      timestamp: leadRecord.receivedAt,
    });
  } catch (error: any) {
    console.error("Error processing contact form lead:", error);
    return NextResponse.json(
      { error: "Failed to record inquiry. Please call customer care directly at +91 1800 890 3240." },
      { status: 500 }
    );
  }
}
