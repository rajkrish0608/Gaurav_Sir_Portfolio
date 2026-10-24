// ─── Portfolio Content Data ───────────────────────────────────────────────────
export const DATA = {
  name: { first: "GAURAV", last: "SAINI", full: "Gaurav Saini", initials: "GS" },
  role: "IT Operations & Product Leader",
  tagline: [
    "AI & IoT Expert  ·  Agentic AI Architect",
    "Mobile Development  ·  Java & React Native",
    "Building intelligent systems that scale globally.",
  ],
  manifesto: `I build smart systems that automate the complex, scale the ambitious,\nand transform how enterprises operate. From agentic AI workflows to IoT-driven\necosystems — every line of code moves a business forward.\nBuild smart. Automate boldly. Drive measurable growth.`,
  stats: [
    { label: "Years Experience", value: 13, suffix: "+" },
    { label: "Projects Delivered", value: 50, suffix: "+" },
    { label: "Global Clients", value: 30, suffix: "+" },
  ],
  projects: [
    {
      num: "01", cat: "IoT / Mobile", name: "Oorja Wheel",
      desc: "Cross-platform IoT app for real-time control of smart interior décor devices.",
      chips: ["React Native", "IoT", "BLE", "Node.js"],
      github: "https://github.com/", visual: "gauge",
    },
    {
      num: "02", cat: "Logistics / Mobile", name: "RAPIDX",
      desc: "Full-stack logistics & trucking platform with real-time fleet coordination.",
      chips: ["React Native", "Maps API", "Firebase", "Java"],
      github: "https://github.com/", visual: "heatmap",
    },
    {
      num: "03", cat: "Agentic AI / SaaS", name: "Vehiclean ERP",
      desc: "AI-powered doorstep car-washing platform with ERP and sales automation.",
      chips: ["Agentic AI", "React", "Python", "PostgreSQL"],
      github: "https://github.com/", visual: "chat",
    },
  ],
  journey: [
    { year: "2024", title: "Founder & CEO", org: "CodeCafe Lab IT Solution",
      desc: "End-to-end IT services for global startups — web, app, AI & branding." },
    { year: "2023", title: "Product Manager", org: "Vehismart Clean Pvt Ltd",
      desc: "Led mobile product lifecycle using React Native; managed full delivery." },
    { year: "2015", title: "Dotnet Developer", org: "National Informatics Centre",
      desc: "Built scalable public-sector apps supporting digital service delivery." },
  ],
  skills: [
    "Agentic AI","React Native","Java","Node.js","Python",
    "IoT Systems","ERP Design","React","TypeScript","PostgreSQL",
    "Firebase","WordPress","Shopify","Product Strategy","Team Leadership","Automation",
  ],
  coding: [
    { platform: "Projects", value: 50, suffix: "+", color: "red" },
    { platform: "Clients", value: 30, suffix: "+", color: "black" },
    { platform: "Years", value: 13, suffix: "+", color: "red" },
    { platform: "Products", value: 20, suffix: "★", color: "black" },
  ],
  certifications: [
    { title: "Agentic AI Systems", issuer: "Deeplearning.AI", year: "2024" },
    { title: "React Native Expert", issuer: "Udemy", year: "2022" },
    { title: "IoT Architecture", issuer: "Coursera", year: "2021" },
    { title: "Product Management", issuer: "PMI", year: "2020" },
    { title: "Cloud DevOps", issuer: "Google", year: "2023" },
    { title: "Java Enterprise", issuer: "Oracle", year: "2019" },
  ],
  contact: {
    email: "gaurav@codecafelab.in", emailName: "gaurav", emailDomain: "@codecafelab.in",
    github: "https://github.com/", linkedin: "https://linkedin.com/in/gaurav-saini",
    resume: "./resume.pdf", site: "codecafelab.in",
  },
  footer: { year: "2026", copy: "© 2026 GAURAV SAINI · CODECAFE LAB" },
} as const;

export const SCENE_LABELS = ["Hello","About","Work","Journey","Toolkit","Awards","Contact"];
