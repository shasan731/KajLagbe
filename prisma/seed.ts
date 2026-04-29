import { PrismaClient, ListingType, ListingStatus, PriceType, RiskLevel, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Seeding database…");

  // Admin
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeThisPassword123!";
  const adminPhone = process.env.ADMIN_PHONE || "01700000000";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminName = process.env.ADMIN_NAME || "Admin";

  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      name: adminName,
      phone: adminPhone,
      email: adminEmail,
      passwordHash: await hash(adminPassword),
      role: "ADMIN",
      status: "ACTIVE",
      profile: { create: { city: "Dhaka", addressArea: "Admin HQ" } },
    },
  });
  console.log("✓ Admin:", admin.phone);

  // Providers
  const providerPasswords = await Promise.all([hash("Provider123!"), hash("Provider123!")]);
  const provider1 = await prisma.user.upsert({
    where: { phone: "01711111111" },
    update: {},
    create: {
      name: "Rahim Tools",
      phone: "01711111111",
      email: "rahim@example.com",
      passwordHash: providerPasswords[0],
      role: "PROVIDER",
      profile: { create: { city: "Dhaka", addressArea: "Mirpur" } },
    },
  });
  const provider2 = await prisma.user.upsert({
    where: { phone: "01722222222" },
    update: {},
    create: {
      name: "Karim Services",
      phone: "01722222222",
      email: "karim@example.com",
      passwordHash: providerPasswords[1],
      role: "PROVIDER",
      profile: { create: { city: "Dhaka", addressArea: "Dhanmondi" } },
    },
  });
  console.log("✓ Providers:", provider1.phone, provider2.phone);

  // Customers
  const customerPasswords = await Promise.all([hash("Customer123!"), hash("Customer123!")]);
  const customer1 = await prisma.user.upsert({
    where: { phone: "01733333333" },
    update: {},
    create: {
      name: "Sadia Customer",
      phone: "01733333333",
      email: "sadia@example.com",
      passwordHash: customerPasswords[0],
      role: "CUSTOMER",
      profile: { create: { city: "Dhaka", addressArea: "Uttara" } },
    },
  });
  const customer2 = await prisma.user.upsert({
    where: { phone: "01744444444" },
    update: {},
    create: {
      name: "Tanvir Customer",
      phone: "01744444444",
      email: "tanvir@example.com",
      passwordHash: customerPasswords[1],
      role: "CUSTOMER",
      profile: { create: { city: "Dhaka", addressArea: "Mohammadpur" } },
    },
  });
  console.log("✓ Customers:", customer1.phone, customer2.phone);

  // Categories
  const toolCategories = [
    "Power Tools",
    "Home Repair",
    "Cleaning Tools",
    "Event Equipment",
    "Photography Equipment",
    "Kitchen Event Tools",
    "Gardening Tools",
    "Moving Tools",
  ];
  const skillCategories = [
    "Electrician",
    "Plumbing",
    "Cleaning Service",
    "Cooking Service",
    "Event Service",
    "Photography",
    "Tuition",
    "Beauty Service",
    "Repair Service",
    "Moving Help",
  ];

  for (const name of toolCategories) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name,
        slug: slugify(name),
        type: ListingType.TOOL_ONLY,
      },
    });
  }
  for (const name of skillCategories) {
    await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name,
        slug: slugify(name),
        type: ListingType.SKILL_ONLY,
      },
    });
  }
  console.log("✓ Categories");

  // Sample listings
  const cat = async (slug: string) => {
    const c = await prisma.category.findUnique({ where: { slug } });
    if (!c) throw new Error(`Category ${slug} missing`);
    return c.id;
  };

  const samples: Array<{
    title: string;
    description: string;
    listingType: ListingType;
    priceType: PriceType;
    basePrice: number;
    depositAmount?: number;
    replacementValue?: number;
    riskLevel?: RiskLevel;
    locationArea: string;
    categorySlug: string;
    ownerId: string;
    images?: string[];
  }> = [
    {
      title: "Drill Machine with Operator",
      description: "Professional drill machine service with operator. Suitable for wall mounting, AC bracket installation, and other home drilling needs. Operator brings full tool kit.",
      listingType: "TOOL_WITH_OPERATOR",
      priceType: "TASK",
      basePrice: 600,
      locationArea: "Mirpur",
      categorySlug: slugify("Power Tools"),
      ownerId: provider1.id,
      images: ["https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800"],
    },
    {
      title: "Aluminium Ladder Rental — 12 ft",
      description: "Sturdy 12-foot aluminium ladder available for daily rental. Ideal for ceiling work, painting, and AC servicing. Renter is responsible for damage.",
      listingType: "TOOL_ONLY",
      priceType: "DAILY",
      basePrice: 250,
      depositAmount: 1500,
      replacementValue: 6000,
      riskLevel: "MEDIUM",
      locationArea: "Mohammadpur",
      categorySlug: slugify("Home Repair"),
      ownerId: provider1.id,
    },
    {
      title: "HD Projector Rental",
      description: "Full-HD projector with HDMI cable, suitable for events, presentations, and home cinema. Free pickup. Cleaning fee included.",
      listingType: "TOOL_ONLY",
      priceType: "DAILY",
      basePrice: 1200,
      depositAmount: 5000,
      replacementValue: 35000,
      riskLevel: "HIGH",
      locationArea: "Dhanmondi",
      categorySlug: slugify("Event Equipment"),
      ownerId: provider2.id,
    },
    {
      title: "Sound System with Technician",
      description: "1000W sound system for events, parties, and conferences. Technician sets up and operates throughout the event.",
      listingType: "TOOL_WITH_OPERATOR",
      priceType: "TASK",
      basePrice: 8000,
      locationArea: "Uttara",
      categorySlug: slugify("Event Equipment"),
      ownerId: provider2.id,
    },
    {
      title: "Home Cleaning Service — 2 BHK",
      description: "Deep cleaning service for 2-bedroom apartments. Includes kitchen, bathrooms, dusting, mopping, and balcony. 2-3 cleaners.",
      listingType: "SKILL_ONLY",
      priceType: "TASK",
      basePrice: 2500,
      locationArea: "Mirpur",
      categorySlug: slugify("Cleaning Service"),
      ownerId: provider1.id,
    },
    {
      title: "Electrician — Wiring & Repair",
      description: "Licensed electrician for home wiring, switch repair, fan installation, and breaker issues. Up-front honest pricing.",
      listingType: "SKILL_ONLY",
      priceType: "HOURLY",
      basePrice: 400,
      locationArea: "Mohammadpur",
      categorySlug: slugify("Electrician"),
      ownerId: provider2.id,
    },
    {
      title: "Plumbing Service",
      description: "Experienced plumber for leak repair, tap installation, drainage, and bathroom fittings. Carries common spares.",
      listingType: "SKILL_ONLY",
      priceType: "HOURLY",
      basePrice: 350,
      locationArea: "Dhanmondi",
      categorySlug: slugify("Plumbing"),
      ownerId: provider1.id,
    },
    {
      title: "Birthday Magic Show",
      description: "30-minute birthday magic show with interactive tricks and balloon art. Suitable for children 3-10 years old.",
      listingType: "PACKAGE",
      priceType: "PACKAGE",
      basePrice: 4500,
      locationArea: "Dhaka",
      categorySlug: slugify("Event Service"),
      ownerId: provider2.id,
    },
    {
      title: "Home Cooking Service",
      description: "Fresh home-style cooking for small gatherings. Bengali, Chinese, and continental menus. Bring your own ingredients or arranged for extra fee.",
      listingType: "SKILL_ONLY",
      priceType: "TASK",
      basePrice: 1800,
      locationArea: "Shyamoli",
      categorySlug: slugify("Cooking Service"),
      ownerId: provider1.id,
    },
    {
      title: "Moving Helper — Per Day",
      description: "Strong, careful helper for house moves and furniture rearrangement. Vehicle not included.",
      listingType: "SKILL_ONLY",
      priceType: "DAILY",
      basePrice: 1200,
      locationArea: "Mirpur",
      categorySlug: slugify("Moving Help"),
      ownerId: provider2.id,
    },
    {
      title: "DSLR Camera Rental — Canon EOS",
      description: "Canon EOS DSLR with 18-55mm and 50mm lenses. Includes battery, charger, and memory card. Great for events and travel.",
      listingType: "TOOL_ONLY",
      priceType: "DAILY",
      basePrice: 1800,
      depositAmount: 10000,
      replacementValue: 60000,
      riskLevel: "HIGH",
      locationArea: "Dhanmondi",
      categorySlug: slugify("Photography Equipment"),
      ownerId: provider2.id,
    },
    {
      title: "Carpet Cleaner with Operator",
      description: "Industrial carpet/sofa cleaning machine with operator. Removes deep stains and odours. Per-hour rate.",
      listingType: "TOOL_WITH_OPERATOR",
      priceType: "HOURLY",
      basePrice: 800,
      locationArea: "Uttara",
      categorySlug: slugify("Cleaning Tools"),
      ownerId: provider1.id,
    },
  ];

  for (const s of samples) {
    const slug = slugify(s.title) + "-" + Math.random().toString(36).slice(2, 6);
    await prisma.listing.upsert({
      where: { slug },
      update: {},
      create: {
        ownerId: s.ownerId,
        categoryId: await cat(s.categorySlug),
        listingType: s.listingType,
        status: "ACTIVE" as ListingStatus,
        title: s.title,
        slug,
        description: s.description,
        priceType: s.priceType,
        basePrice: s.basePrice,
        depositAmount: s.depositAmount ?? 0,
        replacementValue: s.replacementValue ?? 0,
        riskLevel: s.riskLevel ?? "LOW",
        locationArea: s.locationArea,
        city: "Dhaka",
        commissionPercentage: 15,
        images: s.images
          ? { createMany: { data: s.images.map((url, i) => ({ url, sortOrder: i })) } }
          : undefined,
      },
    });
  }
  console.log("✓ Sample listings:", samples.length);

  // Platform settings
  await prisma.platformSetting.upsert({
    where: { key: "DEFAULT_COMMISSION_PERCENTAGE" },
    update: { value: process.env.DEFAULT_COMMISSION_PERCENTAGE || "15" },
    create: {
      key: "DEFAULT_COMMISSION_PERCENTAGE",
      value: process.env.DEFAULT_COMMISSION_PERCENTAGE || "15",
      description: "Platform commission % applied to bookings",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
