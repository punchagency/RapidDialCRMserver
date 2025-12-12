import { storage } from "../storage";
import { type InsertProspect, type InsertFieldRep } from "../db/schema";

// Import all mock contacts from frontend
export async function seedAllMockData() {
  // Field Reps (same as before)
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

  // Map specialties to territories
  const specialtyToTerritory: Record<string, string> = {
    Chiropractor: "South Florida",
    Dental: "Central Florida",
    Medical: "North Florida",
    "Physical Therapy": "South Florida",
    Dermatology: "Central Florida",
    Orthopedic: "North Florida",
    Pediatric: "South Florida",
    Cardiology: "Central Florida",
    Neurology: "North Florida",
    Ophthalmology: "South Florida",
  };

  // Map Prospect interface to InsertProspect
  const mockProspectsData = [
    {
      name: "100% Chiropractic - Davie",
      phone: "(954) 743-4133",
      address: "8570 Stirling Rd Suite 103, Building B, Hollywood, FL 33024",
      zip: "33024",
      city: "Hollywood",
      title: "Chiropractor",
    },
    {
      name: "163rd Chiropractic Clinic",
      phone: "(305) 945-6631",
      address: "18250 NW 2nd Ave",
      zip: "33169",
      city: "Miami",
      title: "Chiropractor",
    },
    {
      name: "Dr. Lorin Chasar, DC",
      phone: "(954) 990-5368",
      address: "4800 W Commercial Blvd, Tamarac, FL 33319",
      zip: "33319",
      city: "Tamarac",
      title: "Chiropractor",
    },
    {
      name: "Robert Whitney II, CH",
      phone: "(954) 458-9898",
      address: "1001 N Federal Hwy Ste 202, Hallandale Beach, FL 33009",
      zip: "33009",
      city: "Hallandale Beach",
      title: "Chiropractor",
    },
    {
      name: "5725 NW 186th Street Operations",
      phone: "(305) 623-1640",
      address: "5725 NW 36th St",
      zip: "33166",
      city: "Virginia Gardens",
      title: "Chiropractor",
    },
    {
      name: "7 Days Chiropractors Clinic",
      phone: "(786) 633-2980",
      address: "9695 NW 79th Ave",
      zip: "33016",
      city: "Hialeah Gardens",
      title: "Chiropractor",
    },
    {
      name: "7 Days Recovery Chiropractors",
      phone: "(786) 633-2991",
      address: "3588 NW 72nd Ave",
      zip: "33122",
      city: "Miami",
      title: "Chiropractor",
    },
    {
      name: "Dr. Howard Brass, DC",
      phone: "(305) 758-1888",
      address: "10071 NW 7th Ave, Miami, FL 33150",
      zip: "33150",
      city: "Miami",
      title: "Chiropractor",
    },
    {
      name: "7th Ave Medical Plaza",
      phone: "(305) 403-7777",
      address: "10071 NW 7th Ave",
      zip: "33150",
      city: "Miami",
      title: "Chiropractor",
    },
    {
      name: "911 Injured Now, Inc.",
      phone: "(305) 846-6833",
      address: "3785 NW 82nd Ave Ste 315",
      zip: "33166",
      city: "Doral",
      title: "Chiropractor",
    },
    {
      name: "Dr. Nicholas Ruggiero, DC",
      phone: "(954) 753-3910",
      address: "3001 Coral Hills Dr Ste 170, Coral Springs, FL 33065",
      zip: "33065",
      city: "Coral Springs",
      title: "Chiropractor",
    },
    {
      name: "A Back & Neck Center",
      phone: "(305) 442-0499",
      address: "220 Miracle Mile # 200, Coral Gables, FL 33134",
      zip: "33134",
      city: "Coral Gables",
      title: "Chiropractor",
    },
    {
      name: "A Better Way of Life Wellness Institute",
      phone: "(954) 587-7711",
      address: "797 S State Rd 7, Plantation, FL 33317",
      zip: "33317",
      city: "Plantation",
      title: "Chiropractor",
    },
    {
      name: "A C Rehabilitation Center",
      phone: "(305) 267-5859",
      address: "5847 W Flagler St",
      zip: "33144",
      city: "Miami",
      title: "Chiropractor",
    },
    {
      name: "Dr. Derek Goetz, DC",
      phone: "(954) 922-1270",
      address: "1531 N Federal Hwy, Hollywood, FL 33020",
      zip: "33020",
      city: "Hollywood",
      title: "Chiropractor",
    },
    {
      name: "AICA Homestead",
      phone: "(305) 647-6306",
      address: "33550 S Dixie Hwy #132, Florida City, FL 33034",
      zip: "33034",
      city: "Homestead",
      title: "Chiropractor",
    },
    {
      name: "ASR Sports Medicine Miami Beach",
      phone: "(305) 984-1155",
      address: "1825 West Ave #7, Miami Beach, FL 33139",
      zip: "33139",
      city: "Coral Gables",
      title: "Chiropractor",
    },
    {
      name: "Dr. Robert Leon, DC",
      phone: "(954) 510-2273",
      address: "1823 N University Dr, Coral Springs, FL 33071",
      zip: "33071",
      city: "Coral Springs",
      title: "Chiropractor",
    },
    {
      name: "AZUR Family Wellness",
      phone: "(305) 298-1250",
      address: "12821 SW 88th St, Miami",
      zip: "33173",
      city: "Miami",
      title: "Chiropractor",
    },
    {
      name: "Dr. Aaron Applebaum, DC",
      phone: "(305) 674-7777",
      address: "1200 Brickell Ave",
      zip: "33131",
      city: "Miami",
      title: "Chiropractor",
    },
  ];

  try {
    // Check if we already have data
    const existing = await storage.listAllProspects();
    if (existing.length > 8) {
      console.log("Database already has comprehensive seed data, skipping...");
      return;
    }

    // Create field reps
    for (const rep of fieldReps) {
      await storage.createFieldRep(rep);
    }
    console.log(`Created ${fieldReps.length} field reps`);

    // Create prospects
    for (const prospect of mockProspectsData) {
      const specialty = prospect.title || "Chiropractor";
      const territory = specialtyToTerritory[specialty] || "South Florida";

      const insertProspect: InsertProspect = {
        businessName: prospect.name,
        phoneNumber: prospect.phone,
        addressStreet: prospect.address.split(",")[0],
        addressCity: prospect.city,
        addressState: "FL",
        addressZip: prospect.zip,
        specialty,
        territory,
        priorityScore: 50 + Math.floor(Math.random() * 150),
      };

      await storage.createProspect(insertProspect);
    }

    console.log(`Created ${mockProspectsData.length} prospects from mock data`);
  } catch (error) {
    console.error("Error seeding mock data:", error);
  }
}
