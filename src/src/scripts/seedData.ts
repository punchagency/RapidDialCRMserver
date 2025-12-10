import { storage } from "../storage";
import { type InsertProspect, type InsertFieldRep } from "../db/schema";

export async function seedDatabase() {
  // Seed Field Reps
  const fieldReps: InsertFieldRep[] = [
    {
      name: "James Martinez",
      territory: "South Florida",
      homeZipCode: "33316",
      homeLat: "26.1552" as any,
      homeLng: "-80.1913" as any,
    },
    {
      name: "Sarah Johnson",
      territory: "Central Florida",
      homeZipCode: "32801",
      homeLat: "28.5383" as any,
      homeLng: "-81.3771" as any,
    },
    {
      name: "Michael Chen",
      territory: "North Florida",
      homeZipCode: "32202",
      homeLat: "30.3282" as any,
      homeLng: "-81.6557" as any,
    },
  ];

  // Seed Prospects
  const prospects: InsertProspect[] = [
    {
      businessName: "100% Chiropractic - Davie",
      phoneNumber: "(954) 555-0101",
      addressStreet: "1234 W Davie Blvd",
      addressCity: "Davie",
      addressState: "FL",
      addressZip: "33324",
      addressLat: "26.0597" as any,
      addressLng: "-80.2544" as any,
      specialty: "Chiropractor",
      territory: "South Florida",
    },
    {
      businessName: "161st Dental Associates",
      phoneNumber: "(305) 555-0102",
      addressStreet: "8765 NW 161st St",
      addressCity: "Miami Lakes",
      addressState: "FL",
      addressZip: "33016",
      addressLat: "25.9213" as any,
      addressLng: "-80.2879" as any,
      specialty: "Dental",
      territory: "South Florida",
    },
    {
      businessName: "Medical Associates of Miami",
      phoneNumber: "(305) 555-0103",
      addressStreet: "9999 Biscayne Blvd",
      addressCity: "Miami",
      addressState: "FL",
      addressZip: "33138",
      addressLat: "25.8381" as any,
      addressLng: "-80.1938" as any,
      specialty: "Medical",
      territory: "South Florida",
    },
    {
      businessName: "Sports Medicine & PT",
      phoneNumber: "(407) 555-0104",
      addressStreet: "500 Main St",
      addressCity: "Orlando",
      addressState: "FL",
      addressZip: "32801",
      addressLat: "28.5421" as any,
      addressLng: "-81.3723" as any,
      specialty: "Physical Therapy",
      territory: "Central Florida",
    },
    {
      businessName: "Orlando Dermatology",
      phoneNumber: "(407) 555-0105",
      addressStreet: "1000 Orange Ave",
      addressCity: "Orlando",
      addressState: "FL",
      addressZip: "32806",
      addressLat: "28.5240" as any,
      addressLng: "-81.3850" as any,
      specialty: "Dermatology",
      territory: "Central Florida",
    },
    {
      businessName: "Jacksonville Pain Clinic",
      phoneNumber: "(904) 555-0106",
      addressStreet: "2000 San Marco Ave",
      addressCity: "Jacksonville",
      addressState: "FL",
      addressZip: "32207",
      addressLat: "30.3246" as any,
      addressLng: "-81.6256" as any,
      specialty: "Medical",
      territory: "North Florida",
    },
    {
      businessName: "Riverside Chiropractic",
      phoneNumber: "(904) 555-0107",
      addressStreet: "3000 Riverside Ave",
      addressCity: "Jacksonville",
      addressState: "FL",
      addressZip: "32205",
      addressLat: "30.3341" as any,
      addressLng: "-81.6545" as any,
      specialty: "Chiropractor",
      territory: "North Florida",
    },
    {
      businessName: "Bay Dental Care",
      phoneNumber: "(813) 555-0108",
      addressStreet: "4000 Bay Dr",
      addressCity: "Tampa",
      addressState: "FL",
      addressZip: "33602",
      addressLat: "27.9506" as any,
      addressLng: "-82.4580" as any,
      specialty: "Dental",
      territory: "South Florida",
    },
  ];

  try {
    // Check if data already exists
    const existingProspects = await storage.listProspectsByTerritory(
      "South Florida"
    );
    if (existingProspects.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    // Create field reps
    for (const rep of fieldReps) {
      await storage.createFieldRep(rep);
    }
    console.log(`Seeded ${fieldReps.length} field reps`);

    // Create prospects
    for (const prospect of prospects) {
      const created = await storage.createProspect(prospect);
      // Calculate and set priority score
      await storage.updateProspect(created.id, {
        priorityScore: 100 + Math.floor(Math.random() * 100),
      });
    }
    console.log(`Seeded ${prospects.length} prospects`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
