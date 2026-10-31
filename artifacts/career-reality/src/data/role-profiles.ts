export const roleOptions = [
  "Software engineer",
  "Product manager",
  "Data analyst",
  "Data scientist",
  "UX designer",
  "UI designer",
  "DevOps / SRE",
  "QA / Test engineer",
  "Cybersecurity analyst",
  "Business analyst",
  "Project manager",
  "Sales / Business development",
  "Marketing",
  "Finance / Accounting",
  "HR / People operations",
  "Customer success",
  "Operations manager",
  "Content / Copywriter",
] as const;

export type RoleName = (typeof roleOptions)[number];

type RoleProfile = {
  family: string;
  responsibility: string;
  ownership: string;
  levers: string;
  questions: string[];
};

export const roleProfiles: Record<RoleName, RoleProfile> = {
  "Software engineer": {
    family: "Engineering",
    responsibility: "Build, debug, and improve software that serves a real customer or operating need.",
    ownership: "A codebase, service, workflow, or reliability outcome—not only assigned tickets.",
    levers: "System ownership, production exposure, incident learning, and a credible path to technical judgment.",
    questions: [
      "Which system or customer outcome will this role own after six months?",
      "How much of the week is new product work versus support and maintenance?",
    ],
  },
  "Product manager": {
    family: "Product",
    responsibility: "Turn customer and business problems into decisions, priorities, and measurable product outcomes.",
    ownership: "A product surface and its trade-offs, not only meeting coordination or requirements documentation.",
    levers: "Customer access, decision rights, product metrics, and the ability to say no to low-value work.",
    questions: [
      "Which product decision can this role make without waiting for three approvals?",
      "What metric will define a good first six months?",
    ],
  },
  "Data analyst": {
    family: "Data",
    responsibility: "Translate data into decisions, operating actions, and a clearer view of what is changing.",
    ownership: "A decision loop or business metric, not only recurring reports and dashboard maintenance.",
    levers: "Data access, stakeholder proximity, automation, and whether analysis changes a decision.",
    questions: [
      "Who will act on the analysis, and how will you know it changed a decision?",
      "How much of the role is recurring reporting versus investigation?",
    ],
  },
  "Data scientist": {
    family: "Data",
    responsibility: "Use experimentation, statistics, and models to improve a product, operation, or commercial decision.",
    ownership: "A measurable model or experiment from problem framing through adoption and monitoring.",
    levers: "Production ownership, quality of data, deployment access, and decision-maker adoption.",
    questions: [
      "What makes a model useful here: deployment, adoption, revenue, or an internal demonstration?",
      "Who owns the model after the first launch?",
    ],
  },
  "UX designer": {
    family: "Design",
    responsibility: "Make user needs visible and turn them into clearer, more usable product decisions.",
    ownership: "A user journey and its evidence, not only polished screens after the roadmap is fixed.",
    levers: "User access, research influence, design-system participation, and proximity to product decisions.",
    questions: [
      "When research conflicts with a roadmap commitment, who decides what ships?",
      "Will this role own discovery as well as delivery?",
    ],
  },
  "UI designer": {
    family: "Design",
    responsibility: "Create coherent visual systems and interfaces that support usability, trust, and product outcomes.",
    ownership: "A visual system or product surface, not only production throughput for incoming requests.",
    levers: "Design-system ownership, product influence, craft quality, and feedback from real users.",
    questions: [
      "How much authority does this role have over the system it is expected to maintain?",
      "Who gives feedback on the work: a design lead, product team, or only requesters?",
    ],
  },
  "DevOps / SRE": {
    family: "Reliability",
    responsibility: "Keep software deployable, observable, secure, and resilient as teams and traffic grow.",
    ownership: "Reliability outcomes and operational systems, not just urgent incident response.",
    levers: "On-call load, incident authority, automation, and whether reliability work is funded between incidents.",
    questions: [
      "What is the on-call rotation, and which reliability decisions can the team make directly?",
      "What percentage of the role is planned platform work versus firefighting?",
    ],
  },
  "QA / Test engineer": {
    family: "Quality",
    responsibility: "Find risk early and make quality a repeatable part of how products are delivered.",
    ownership: "A quality strategy, automation surface, or release confidence—not only test volume.",
    levers: "Automation ownership, release authority, engineering partnership, and access to production feedback.",
    questions: [
      "Can this role block an unsafe release, or only report the risk after the deadline is set?",
      "What quality signal does leadership actually review?",
    ],
  },
  "Cybersecurity analyst": {
    family: "Security",
    responsibility: "Identify, explain, and reduce security risk across systems, data, and operating processes.",
    ownership: "A risk domain and its controls, with a clear path to escalation when risk is accepted.",
    levers: "System access, executive backing, tooling, and authority to make findings actionable.",
    questions: [
      "Who owns the risk when a business team does not accept the security recommendation?",
      "Will this role investigate incidents, improve controls, or mostly produce compliance evidence?",
    ],
  },
  "Business analyst": {
    family: "Business operations",
    responsibility: "Connect business problems, process detail, and evidence so teams can make better operating decisions.",
    ownership: "A business outcome or process improvement, not only requirements documentation.",
    levers: "Decision-maker access, process ownership, data fluency, and the ability to measure change.",
    questions: [
      "Which business outcome will this role be able to move, not just describe?",
      "Who owns the decision after the analysis is delivered?",
    ],
  },
  "Project manager": {
    family: "Delivery",
    responsibility: "Create clarity across scope, dependencies, risk, and execution so a funded outcome can ship.",
    ownership: "A delivery outcome and its dependency decisions, not only status reporting.",
    levers: "Decision rights, escalation authority, sponsor quality, and whether the project has real funding.",
    questions: [
      "What can this role change when a dependency misses its commitment?",
      "Which decisions belong to the project manager versus the functional leads?",
    ],
  },
  "Sales / Business development": {
    family: "Commercial",
    responsibility: "Create and convert qualified demand while building durable customer and market knowledge.",
    ownership: "A territory, segment, or revenue outcome—not only activity volume.",
    levers: "Territory quality, quota design, ramp time, lead ownership, and variable-pay rules.",
    questions: [
      "How much of the first-year target is backed by existing demand rather than self-generated pipeline?",
      "What percentage of the team hit quota in the last two quarters?",
    ],
  },
  Marketing: {
    family: "Growth",
    responsibility: "Build audience, demand, and market understanding that can be connected to a measurable business result.",
    ownership: "A funnel, audience, or channel outcome—not only campaign execution and requests.",
    levers: "Budget control, distribution, measurement quality, and proximity to customer feedback.",
    questions: [
      "Which metric and budget can this role change without waiting for a new planning cycle?",
      "How is performance separated from seasonality and channel noise?",
    ],
  },
  "Finance / Accounting": {
    family: "Finance",
    responsibility: "Make financial performance, controls, and trade-offs clearer for the people running the business.",
    ownership: "A financial process or decision context, not only recurring close cycles.",
    levers: "Systems ownership, business-partner access, control authority, and exposure to planning decisions.",
    questions: [
      "Which decision will your analysis or control change for the business?",
      "Is the role closer to reporting, controllership, planning, or commercial finance?",
    ],
  },
  "HR / People operations": {
    family: "People",
    responsibility: "Make people systems, manager behavior, and employee operations more consistent and useful.",
    ownership: "A people process and its outcomes, not only employee-request throughput.",
    levers: "Manager access, policy influence, systems ownership, and executive backing for difficult changes.",
    questions: [
      "What authority exists when a senior manager does not follow the people process?",
      "Which people metric will this role be accountable for improving?",
    ],
  },
  "Customer success": {
    family: "Customer",
    responsibility: "Help customers reach durable outcomes while turning recurring friction into product and business learning.",
    ownership: "A customer portfolio, renewal outcome, or adoption metric—not only relationship coverage.",
    levers: "Portfolio size, renewal ownership, product access, escalation paths, and variable-pay design.",
    questions: [
      "What can this role change when a customer outcome is blocked by the product?",
      "How many accounts and renewal dollars sit in a typical portfolio?",
    ],
  },
  "Operations manager": {
    family: "Operations",
    responsibility: "Improve the systems, people, and processes that keep a business or service running well.",
    ownership: "An operating metric and the constraints behind it, not only daily coordination.",
    levers: "Decision rights, process ownership, team size, data quality, and ability to fix recurring bottlenecks.",
    questions: [
      "Which operating metric and team can this role change directly?",
      "What recurring constraint is this role expected to remove?",
    ],
  },
  "Content / Copywriter": {
    family: "Content",
    responsibility: "Turn ideas and customer understanding into clear content that earns attention or moves a decision.",
    ownership: "An audience, content system, or measurable distribution outcome—not only a volume of briefs.",
    levers: "Audience feedback, distribution ownership, editorial judgment, and performance data.",
    questions: [
      "Who owns distribution and performance after the copy is delivered?",
      "How is quality judged when content does not convert immediately?",
    ],
  },
};

export const experienceGuidance = {
  "0–2 years": {
    label: "Execution foundation",
    detail: "Build reliable habits, learn the operating system, and make your work easy to review.",
  },
  "3–5 years": {
    label: "Independent ownership",
    detail: "Own a meaningful workstream, make trade-offs, and coordinate without needing constant rescue.",
  },
  "5–8 years": {
    label: "Cross-functional leverage",
    detail: "Shape priorities, unblock other people, and connect execution to a measurable business outcome.",
  },
  "9+ years": {
    label: "Strategic responsibility",
    detail: "Set direction, manage ambiguity, and make the system around the work better for other teams.",
  },
} as const;
