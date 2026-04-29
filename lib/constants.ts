export const APP_NAME = "KajLagbe";
export const APP_TAGLINE = "Rent tools. Hire local skills. Pay only when needed.";
export const CURRENCY_SYMBOL = "৳";
export const DEFAULT_CITY = "Dhaka";
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;
export const SESSION_COOKIE_NAME = "kl_session";
export const SESSION_TTL_DAYS = 30;

export const DEFAULT_COMMISSION_PERCENTAGE = Number(
  process.env.DEFAULT_COMMISSION_PERCENTAGE ?? "15"
);

export const BANNED_KEYWORDS = [
  "weapon",
  "gun",
  "rifle",
  "pistol",
  "explosive",
  "fireworks",
  "drugs",
  "narcotic",
  "alcohol",
  "liquor",
  "gambling",
  "betting",
  "casino",
  "prescription medicine",
  "fake document",
  "fake passport",
  "fake nid",
  "spy device",
  "hidden camera",
  "adult service",
  "escort",
  "stolen",
  "hazardous chemical",
  "exam cheating",
  "question paper",
];

export const RESTRICTED_KEYWORDS = [
  "heavy machinery",
  "gas line",
  "electrical work",
  "medical equipment",
  "childcare",
  "high-value camera",
  "generator",
];

export const BD_CITIES = [
  "Dhaka",
  "Chattogram",
  "Khulna",
  "Rajshahi",
  "Sylhet",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Cumilla",
  "Narayanganj",
  "Gazipur",
];

export const DHAKA_AREAS = [
  "Mirpur",
  "Mohammadpur",
  "Dhanmondi",
  "Uttara",
  "Banani",
  "Gulshan",
  "Bashundhara",
  "Shyamoli",
  "Mohakhali",
  "Tejgaon",
  "Old Dhaka",
  "Motijheel",
  "Farmgate",
];
