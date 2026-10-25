const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

/** Images are from Unsplash (free Unsplash License). Replace with vendor-owned photography before launch. */
export const HOME_IMAGES = {
  hero: [u("1578985545062-69928b1d9587"), u("1680993032090-1ef7ea9b51e5"), u("1505932794465-147d1f1b2c97"), u("1552733407-5d5c46c3bb3b")],
  support: u("1601050690597-df0568f70950"),
  vendorLogin: u("1556910103-1c02745aae4d"),
  aboutHero: u("1667849521403-d8723972f0a0"),
  vision: u("1469854523086-cc02fe5d8800"),
  contact: u("1488646953014-85cb44e25828"),
};

export const LOCALITIES = [
  "Kondapur", "Gachibowli", "Madhapur", "HITEC City", "Banjara Hills", "Jubilee Hills", "Begumpet",
  "Secunderabad", "Ameerpet", "Kukatpally", "Miyapur", "Manikonda",
];

export const FOUNDERS = [
  {
    name: "Dr. Ankita Mishra",
    role: "Co-Founder",
    title: "PhD in Marketing and Strategy",
    photo: "/images/founders/ankita-mishra.jpg", // from client deck; replace with approved high-res photo
    bio: "With over a decade of experience in business and academia, Ankita has a PhD in marketing and strategy and uses a research-backed approach to help companies understand consumer behaviour and improve their market positioning. She specialises in building customer-focused strategies that help brands clearly define their value, increase visibility, and find new ways to grow sustainably.",
    strengths: ["Consumer Behaviour", "Brand & Growth Strategy", "Research to Real Solutions"],
  },
  {
    name: "Shailesh Srivastava",
    role: "Co-Founder",
    title: "Senior Project Manager",
    photo: "/images/founders/shailesh-srivastava.jpg", // from client deck; replace with approved high-res photo
    bio: "With over 17 years of expertise in business consulting and project management, Shailesh leverages an execution-focused approach to advance the company's vision for a structured, scalable platform. His responsibilities encompass driving systematic planning, operational coordination, and the formulation of a sustainable business model.",
    strengths: ["Strategic Execution", "Operational Planning", "Scalable Business Models"],
  },
];
