import { LOCALITIES } from "./site";

/**
 * SEO, AEO and GEO copy in one place: keywords, landing page intros and FAQs.
 * Keyword choices come from local search phrasing in Hyderabad (city + service + "near me" style queries).
 * Verify volumes in Google Keyword Planner (India, Hyderabad) before paid campaigns.
 */

export type Faq = { q: string; a: string };

export const BRAND = {
  name: "Tarkkash",
  slogan: "Har Hunar Ko Ek Pehchaan",
  tagline: "Good services. Closer to home.",
  city: "Hyderabad",
  region: "Telangana",
  country: "India",
  /** Approximate city centre, used for geo meta tags only. */
  geo: { lat: 17.385, lng: 78.4867 },
};

export const SITE_DESCRIPTION =
  "Find trusted local services in Hyderabad: home bakers, homemade food and tiffin services, home tutors, beauticians, cleaning, repairs, travel planners and more. Send one enquiry and Tarkkash coordinates it with a checked local provider.";

export const SITE_KEYWORDS = [
  "local services in Hyderabad",
  "home services Hyderabad",
  "trusted local service providers Hyderabad",
  "home bakers in Hyderabad",
  "tiffin service in Hyderabad",
  "home tutors in Hyderabad",
  "home business marketplace India",
  "support local businesses Hyderabad",
  "services near me Hyderabad",
  "Tarkkash",
];

export type CategorySeo = {
  /** Page H1 and the main keyword target. */
  h1: string;
  title: string;
  description: string;
  keywords: string[];
  intro: string[];
  faqs: Faq[];
  /** Short noun used in sentences ("home bakers", "tutors"). */
  noun: string;
  schemaType: string;
};

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  "food-baking": {
    h1: "Home Bakers and Custom Cakes in Hyderabad",
    title: "Home Bakers in Hyderabad | Custom Birthday Cakes, Cookies and Snacks",
    description: "Order custom birthday cakes, eggless cakes, cookies, brownies and evening snacks from home bakers in Hyderabad. Kondapur, Gachibowli, Madhapur and nearby. Enquire through Tarkkash.",
    keywords: ["home bakers in Hyderabad", "custom cakes Hyderabad", "birthday cake home baker", "eggless cake Hyderabad", "homemade cookies Hyderabad", "cake order near me"],
    intro: [
      "Looking for a home baker in Hyderabad who can make the cake exactly the way you imagine it? Tarkkash lists independent home bakers who bake everything to order: birthday and anniversary cakes, eggless cakes, cookies, brownies, cupcakes and festive hampers.",
      "Pick a baker, choose a service and tell us your date, flavour and design. Tarkkash checks availability with the baker and confirms your order, so you get freshly baked treats from someone in your own neighbourhood with a clear reference ID for every request.",
    ],
    faqs: [
      { q: "How do I order a custom cake from a home baker in Hyderabad?", a: "Open a baker's profile on Tarkkash, choose the cake you want and send an enquiry with your date, flavour, size and design. Tarkkash confirms the details with the baker and gets back to you with the price and delivery or pickup options." },
      { q: "How many days in advance should I order a custom cake?", a: "Most home bakers need 2 to 3 days for a custom design cake. Simple cakes, cookies and snacks are often ready in a day. Each service on Tarkkash shows its lead time." },
      { q: "Can I get eggless cakes in Hyderabad?", a: "Yes. Many home bakers on Tarkkash offer eggless options. Look for \"Eggless available\" on the service or mention it in your enquiry." },
      { q: "Do home bakers deliver?", a: "Many offer home delivery within a few kilometres as well as pickup. Delivery options are listed on each service." },
    ],
    noun: "home bakers",
    schemaType: "Bakery",
  },
  "home-kitchen": {
    h1: "Homemade Food and Tiffin Services in Hyderabad",
    title: "Tiffin Service in Hyderabad | Homemade Meals and Monthly Plans",
    description: "Daily and monthly tiffin services and homemade meals in Hyderabad. North Indian, South Indian and regional home food delivered in Kondapur, Gachibowli, HITEC City and more.",
    keywords: ["tiffin service in Hyderabad", "homemade food delivery Hyderabad", "monthly tiffin service Gachibowli", "home food Kondapur", "lunch tiffin near me", "home cooked meals Hyderabad"],
    intro: [
      "Miss home cooked food? Tarkkash connects you with home kitchens across Hyderabad that cook fresh North Indian, South Indian and regional meals every day. Choose a daily lunch tiffin, a monthly meal plan or a bulk order for a get together.",
      "Tell us your meal preference, quantity and whether you want delivery or pickup. Tarkkash coordinates with the home cook and keeps a record of every order, so changes and pauses are easy.",
    ],
    faqs: [
      { q: "How much does a monthly tiffin service cost in Hyderabad?", a: "Home tiffins usually start around ₹100 to ₹150 per meal, with lower rates on monthly plans. Each home kitchen on Tarkkash shows its starting price per meal or per month." },
      { q: "Do tiffin services deliver to offices in HITEC City and Gachibowli?", a: "Several home kitchens on Tarkkash deliver to homes and offices in HITEC City, Gachibowli, Kondapur and Madhapur. Check the service area on each profile." },
      { q: "Can I get vegetarian or Jain meals?", a: "Yes. Mention your dietary needs in the enquiry and Tarkkash will match you with a home kitchen that can cook for them." },
    ],
    noun: "home kitchens",
    schemaType: "FoodEstablishment",
  },
  tutors: {
    h1: "Home Tutors in Hyderabad",
    title: "Home Tutors in Hyderabad | Maths, Science and English Tuition",
    description: "Find home tutors in Hyderabad for maths, science, English and primary classes. CBSE and state board tuition at home or online in Madhapur, Kondapur, Gachibowli and nearby.",
    keywords: ["home tutors in Hyderabad", "maths tuition at home Hyderabad", "CBSE tutor Kondapur", "tuition near me", "online tutor Hyderabad", "primary tuition Hyderabad"],
    intro: [
      "Tarkkash helps parents in Hyderabad find experienced home tutors for primary classes, maths, science and English, for CBSE and state board students. Choose tuition at home, at the tutor's place or online.",
      "Share your child's class, subjects and preferred timings in one enquiry. Tarkkash finds a tutor who fits and stays in touch until classes are underway.",
    ],
    faqs: [
      { q: "How do I find a good home tutor in Hyderabad?", a: "Browse tutor profiles on Tarkkash to see subjects, classes, experience and fees, then send one enquiry with your child's needs. Tarkkash coordinates a suitable tutor for you." },
      { q: "What do home tutors charge in Hyderabad?", a: "Group tuition often starts around ₹2,000 per month and one to one tuition is higher. Each tutor on Tarkkash lists a starting fee." },
      { q: "Is online tuition available?", a: "Yes. Many tutors offer online classes as well as home visits." },
    ],
    noun: "home tutors",
    schemaType: "EducationalOrganization",
  },
  "beauty-wellness": {
    h1: "Beauticians, Makeup and Mehendi Artists in Hyderabad",
    title: "Bridal Makeup and Mehendi Artists in Hyderabad | Beauty at Home",
    description: "Book bridal and party makeup artists, mehendi artists and beauty services at home in Hyderabad. Jubilee Hills, Banjara Hills, Kondapur and nearby.",
    keywords: ["bridal makeup artist Hyderabad", "mehendi artist Hyderabad", "beautician at home Hyderabad", "party makeup Hyderabad", "salon at home near me"],
    intro: [
      "From bridal makeup to festive mehendi and salon services at home, Tarkkash lists independent beauty professionals across Hyderabad who come to you.",
      "Share the occasion, date and number of people in one enquiry. Tarkkash confirms availability and pricing with the artist so your day goes to plan.",
    ],
    faqs: [
      { q: "How early should I book a bridal makeup artist in Hyderabad?", a: "For wedding season dates, book 3 to 6 weeks ahead. Party makeup can often be arranged within a few days." },
      { q: "Do makeup and mehendi artists come home?", a: "Yes. Most beauty professionals on Tarkkash offer services at your home. Travel areas are listed on each profile." },
    ],
    noun: "beauty professionals",
    schemaType: "BeautySalon",
  },
  "home-care": {
    h1: "Home Cleaning Services in Hyderabad",
    title: "Home Cleaning Services in Hyderabad | Deep Cleaning and Home Care",
    description: "Book home cleaning, deep cleaning and home care services in Hyderabad from trained local teams. Gachibowli, Kondapur, Madhapur and more.",
    keywords: ["home cleaning services Hyderabad", "deep cleaning Hyderabad", "house cleaning near me", "kitchen cleaning Hyderabad", "home care services Hyderabad"],
    intro: [
      "Need a deep clean before a festival or after moving in? Tarkkash lists local home care teams in Hyderabad for full home deep cleaning, kitchen and bathroom cleaning and regular help.",
      "Tell us the size of your home and the date. Tarkkash confirms the team, the price and what is included before anyone arrives.",
    ],
    faqs: [
      { q: "How much does deep cleaning cost in Hyderabad?", a: "Deep cleaning usually depends on the size of the home. Providers on Tarkkash list a starting price, and the final price is confirmed before the job." },
      { q: "Do cleaners bring their own equipment?", a: "Most home care teams bring their own equipment and supplies. Check the service details or ask in your enquiry." },
    ],
    noun: "home care teams",
    schemaType: "HomeAndConstructionBusiness",
  },
  repairs: {
    h1: "AC Repair, Electricians and Plumbers in Hyderabad",
    title: "AC Repair and Service in Hyderabad | Electricians and Plumbers",
    description: "Book AC service and repair, electricians and plumbers in Hyderabad. Same week visits in Kukatpally, Miyapur, KPHB and nearby, coordinated by Tarkkash.",
    keywords: ["AC repair Hyderabad", "AC service near me", "electrician in Hyderabad", "plumber in Hyderabad", "appliance repair Hyderabad"],
    intro: [
      "When the AC stops cooling or a tap will not stop dripping, Tarkkash helps you reach local repair professionals in Hyderabad for AC service, electrical work, plumbing and appliance repair.",
      "Describe the problem in one enquiry and Tarkkash arranges a visit with a nearby technician, with the visit charge confirmed upfront.",
    ],
    faqs: [
      { q: "How quickly can I get an AC service in Hyderabad?", a: "Many repair providers on Tarkkash offer visits within the same week, and often within a day or two." },
      { q: "Is there a visit charge?", a: "Some technicians charge a small visit fee that is adjusted against the repair. It is shown on the service before you enquire." },
    ],
    noun: "repair professionals",
    schemaType: "HomeAndConstructionBusiness",
  },
  "travel-tours": {
    h1: "Tour Packages and Travel Planners in Hyderabad",
    title: "Tour Packages from Hyderabad | Honeymoon, Family and Group Trips",
    description: "Plan holidays with travel planners in Hyderabad: honeymoon packages, family tours of Kerala, Goa and Kashmir, and custom itineraries across India and abroad.",
    keywords: ["tour packages from Hyderabad", "travel agent in Hyderabad", "honeymoon packages from Hyderabad", "family tour packages India", "custom itinerary planner"],
    intro: [
      "Tarkkash connects you with Hyderabad based travel planners who design honeymoon packages, family holidays and group tours across India and abroad, with flights, hotels and sightseeing sorted.",
      "Tell us where you want to go, your dates, the number of travellers and your budget. Tarkkash coordinates a personalised plan and keeps everything in one place.",
    ],
    faqs: [
      { q: "What are popular tour packages from Hyderabad?", a: "Kerala, Goa, Kashmir, Himachal and Thailand are popular choices for families and couples from Hyderabad. Travel planners on Tarkkash also build custom itineraries." },
      { q: "Can I get a custom itinerary?", a: "Yes. Choose a custom itinerary service and share your ideas. The travel planner sends a quote, usually within 24 hours." },
    ],
    noun: "travel planners",
    schemaType: "TravelAgency",
  },
  fitness: {
    h1: "Personal Trainers and Yoga Instructors in Hyderabad",
    title: "Personal Trainer at Home in Hyderabad | Yoga and Fitness Coaching",
    description: "Find personal trainers, yoga instructors and fitness coaches in Hyderabad for sessions at home, in your community or online.",
    keywords: ["personal trainer at home Hyderabad", "yoga instructor Hyderabad", "fitness coach near me", "home yoga classes Hyderabad"],
    intro: [
      "Tarkkash lists independent fitness professionals in Hyderabad: personal trainers, yoga instructors and coaches who train you at home, in your gated community or online.",
      "Share your goals and preferred timings. Tarkkash finds a trainer who fits your schedule and budget.",
    ],
    faqs: [
      { q: "How much does a personal trainer cost in Hyderabad?", a: "Home training is often priced per month for a fixed number of sessions. Each trainer on Tarkkash lists a starting price." },
      { q: "Are online sessions available?", a: "Yes. Many trainers and yoga instructors offer online sessions." },
    ],
    noun: "fitness professionals",
    schemaType: "SportsActivityLocation",
  },
  events: {
    h1: "Event Planners and Party Decorators in Hyderabad",
    title: "Event Planners in Hyderabad | Birthday Party Decoration and Celebrations",
    description: "Plan birthdays, anniversaries and small celebrations with event planners and decorators in Hyderabad. Balloon decor, themes and full party planning.",
    keywords: ["event planners Hyderabad", "birthday party decorators Hyderabad", "balloon decoration near me", "party planner Hyderabad"],
    intro: [
      "Planning a birthday, baby shower or anniversary? Tarkkash connects you with local event planners and decorators in Hyderabad for themed decor, balloon setups and complete party planning.",
      "Share the occasion, venue, date and guest count in one enquiry. Tarkkash coordinates the plan and the provider so you can enjoy the day.",
    ],
    faqs: [
      { q: "How early should I book a party decorator?", a: "One to two weeks ahead is usually enough for a home birthday. Book earlier for weekends and festival dates." },
    ],
    noun: "event planners",
    schemaType: "ProfessionalService",
  },
};

export const localitySlug = (name: string) => name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const LOCALITY_PAGES = LOCALITIES.map((name) => ({ name, slug: localitySlug(name) }));
export const localityBySlug = (slug: string) => LOCALITY_PAGES.find((l) => l.slug === slug) ?? null;

/** Nearby areas for internal linking on locality pages. */
export const NEARBY: Record<string, string[]> = {
  Kondapur: ["Gachibowli", "HITEC City", "Madhapur", "Miyapur"],
  Gachibowli: ["Kondapur", "HITEC City", "Manikonda", "Madhapur"],
  Madhapur: ["HITEC City", "Jubilee Hills", "Kondapur", "Gachibowli"],
  "HITEC City": ["Madhapur", "Kondapur", "Gachibowli"],
  "Banjara Hills": ["Jubilee Hills", "Ameerpet", "Begumpet"],
  "Jubilee Hills": ["Banjara Hills", "Madhapur", "Ameerpet"],
  Begumpet: ["Secunderabad", "Ameerpet", "Banjara Hills"],
  Secunderabad: ["Begumpet", "Ameerpet"],
  Ameerpet: ["Begumpet", "Banjara Hills", "Kukatpally"],
  Kukatpally: ["Miyapur", "Ameerpet", "Kondapur"],
  Miyapur: ["Kukatpally", "Kondapur"],
  Manikonda: ["Gachibowli", "Kondapur"],
};

export const HOME_FAQS: Faq[] = [
  { q: "What is Tarkkash?", a: "Tarkkash is a local services platform in Hyderabad. It helps you discover trusted independent providers such as home bakers, home kitchens, tutors, beauticians, cleaners, repair technicians and travel planners, and it coordinates every enquiry for you." },
  { q: "How does Tarkkash work?", a: "Find a provider, choose a service and send one enquiry. You get a reference ID instantly. Tarkkash confirms the details, assigns the provider and follows up until the service is delivered." },
  { q: "Is Tarkkash free for customers?", a: "Yes. Browsing and sending enquiries is free. You pay the provider's price for the service. An optional Tarkkash Assist add on with a small fee is shown before you send an enquiry." },
  { q: "Are providers on Tarkkash verified?", a: "Every listing is reviewed before it goes live. The verified badge appears only after Tarkkash completes identity, service area and quality checks for that provider." },
  { q: "Which areas of Hyderabad does Tarkkash cover?", a: `Tarkkash currently lists providers across Hyderabad, including ${LOCALITIES.slice(0, 8).join(", ")} and nearby areas.` },
  { q: "How can I list my home business on Tarkkash?", a: "Create an account and apply from the List your service page. Tarkkash reviews your details, you add services and photos, and once approved you start receiving coordinated enquiries." },
];

export const HOW_FAQS: Faq[] = [
  HOME_FAQS[1]!,
  { q: "Will providers get my phone number?", a: "Only the provider who accepts your order sees your contact details. They are never published or sold." },
  { q: "What happens if a provider is not available?", a: "Tarkkash returns the enquiry to its queue and assigns another suitable provider, then keeps you updated." },
  { q: "How do I track my enquiry?", a: "Every enquiry has a reference ID. Sign in to your account to see its status and order progress." },
  HOME_FAQS[5]!,
];

export const ABOUT_FACTS: { k: string; v: string }[] = [
  { k: "What it is", v: "A local services platform that connects customers with trusted independent providers and coordinates every enquiry." },
  { k: "Where", v: "Hyderabad, Telangana, India, starting with the city's western and central neighbourhoods." },
  { k: "Services", v: "Home baking, home kitchens and tiffins, tutoring, beauty, home care, repairs, travel, fitness and events." },
  { k: "Cost to customers", v: "Free to browse and enquire. Customers pay the provider's price. Optional Tarkkash Assist is shown upfront." },
  { k: "Founders", v: "Dr. Ankita Mishra and Shailesh Srivastava." },
  { k: "Mission", v: "Har Hunar Ko Ek Pehchaan: every skill deserves recognition." },
];
