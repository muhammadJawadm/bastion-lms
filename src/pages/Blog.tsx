/**
 * Blog / Resources Page — Bastion Risk & Safety Group
 * Design: Dark navy header, white card grid, color-coded category tags
 * Matches site design system: Barlow Condensed display, Inter body, #0F1C2E / #00A3FF palette
 */

import { useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Article Data ────────────────────────────────────────────────────────────

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: "OSHA Updates" | "Construction" | "Maritime" | "General Industry" | "Training Tips" | "Company News";
  date: string;
  readTime: string;
  featured?: boolean;
  content: string; // HTML string
}

const ARTICLES: Article[] = [
  {
    id: "1",
    slug: "top-10-osha-violations-california-construction",
    title: "Top 10 OSHA Violations on California Construction Sites",
    excerpt:
      "Fall protection tops the list year after year, but the full picture is more complex. Here are the 10 most cited OSHA violations on California construction sites and what you can do to avoid them.",
    category: "Construction",
    date: "May 20, 2026",
    readTime: "6 min read",
    featured: true,
    content: `
      <p>Every year, Cal/OSHA and federal OSHA publish their lists of the most frequently cited violations across all industries. For California construction, the same hazards appear year after year, and the penalties are getting steeper. In 2025, OSHA increased its maximum penalty for serious violations to <strong>$16,550 per violation</strong>, with willful or repeat violations reaching <strong>$165,514</strong>.</p>

      <p>Here are the 10 most cited OSHA violations on California construction sites and what contractors need to do to stay compliant.</p>

      <h2>1. Fall Protection: General Requirements (29 CFR 1926.501 / Cal/OSHA Title 8 §1670)</h2>
      <p>Fall protection has been the #1 cited OSHA violation in construction for over a decade. Unprotected edges, missing guardrails, and failure to provide personal fall arrest systems (PFAS) for workers at heights of 6 feet or more are the most common triggers. Cal/OSHA's requirements are stricter than federal OSHA in several areas, including specific requirements for residential construction and roofing work.</p>
      <p><strong>What to do:</strong> Conduct a fall hazard assessment before work begins. Ensure all workers at heights of 6 feet or more are protected by guardrails, safety nets, or personal fall arrest systems. Document your fall protection plan in writing.</p>

      <h2>2. Scaffolding (29 CFR 1926.451 / Cal/OSHA Title 8 §1637)</h2>
      <p>Scaffolding violations are consistently in the top five. Common issues include improper planking, missing guardrails, inadequate footing, and failure to have a competent person supervise scaffold erection and dismantling.</p>
      <p><strong>What to do:</strong> Designate a competent person for all scaffold work. Inspect scaffolds before each work shift. Ensure planking is rated for the load and extends at least 6 inches beyond supports.</p>

      <h2>3. Ladders (29 CFR 1926.1053 / Cal/OSHA Title 8 §1675)</h2>
      <p>Ladder violations are the third most cited category in construction. Top issues include using ladders with broken rungs, failing to extend ladders 3 feet above the landing, and not securing ladders at the top and bottom.</p>
      <p><strong>What to do:</strong> Inspect ladders before each use. Ensure extension ladders extend at least 3 feet above the upper landing surface. Train workers on proper ladder use and angle (4:1 ratio).</p>

      <h2>4. Hazard Communication (29 CFR 1910.1200 / Cal/OSHA Title 8 §5194)</h2>
      <p>Also known as HazCom or the "Right to Know" standard, this regulation requires employers to maintain Safety Data Sheets (SDS) for all hazardous chemicals, label containers properly, and train workers on chemical hazards. Missing or outdated SDS binders are a frequent citation trigger.</p>
      <p><strong>What to do:</strong> Maintain a current SDS binder on the jobsite. Ensure all chemical containers are properly labeled. Conduct annual HazCom training for all workers who may be exposed to hazardous chemicals.</p>

      <h2>5. Excavation and Trenching (29 CFR 1926.652 / Cal/OSHA Title 8 §1541)</h2>
      <p>Trenching and excavation fatalities are among the most preventable in construction. Cave-ins kill workers quickly. A cubic yard of soil weighs approximately 3,000 pounds. Citations typically involve failure to slope, shore, or shield excavations deeper than 5 feet, and failure to have a competent person inspect the excavation daily.</p>
      <p><strong>What to do:</strong> Designate a competent person for all excavation work. Classify soil before work begins. Use sloping, shoring, or trench boxes for excavations 5 feet or deeper. Never allow workers in an unprotected trench.</p>

      <h2>6. Eye and Face Protection (29 CFR 1926.102 / Cal/OSHA Title 8 §1516)</h2>
      <p>Failure to provide or enforce the use of appropriate eye and face protection during grinding, cutting, welding, and chemical handling is a consistent citation. This is often cited alongside other PPE violations.</p>
      <p><strong>What to do:</strong> Conduct a PPE hazard assessment. Provide appropriate eye protection for each task. Enforce PPE use through supervision and disciplinary procedures.</p>

      <h2>7. Respiratory Protection (29 CFR 1910.134 / Cal/OSHA Title 8 §5144)</h2>
      <p>Silica dust exposure is a growing enforcement priority in California. Employers who fail to implement engineering controls, provide respirators, or conduct medical evaluations for workers exposed to silica, lead, or other airborne hazards face significant citations.</p>
      <p><strong>What to do:</strong> Implement a written Respiratory Protection Program. Conduct exposure assessments. Provide NIOSH-approved respirators and conduct annual fit testing. Ensure medical evaluations are completed before workers wear tight-fitting respirators.</p>

      <h2>8. Electrical: Wiring Methods (29 CFR 1926.405 / Cal/OSHA Title 8 §2500)</h2>
      <p>Temporary electrical wiring on construction sites is frequently cited. Common violations include damaged extension cords, missing ground fault circuit interrupter (GFCI) protection, and improper use of flexible cords as permanent wiring.</p>
      <p><strong>What to do:</strong> Use GFCI protection for all 120-volt, single-phase, 15- and 20-ampere receptacle outlets on construction sites. Inspect extension cords daily and remove damaged cords from service immediately.</p>

      <h2>9. Head Protection (29 CFR 1926.100 / Cal/OSHA Title 8 §1514)</h2>
      <p>Hard hat violations are common, particularly on sites where workers are near overhead work or operating equipment. Workers who modify hard hats (drilling holes, wearing them backward when not designed for it) or use damaged hard hats are a frequent citation trigger.</p>
      <p><strong>What to do:</strong> Enforce hard hat requirements in all areas where there is a risk of head injury. Replace hard hats that show signs of damage, penetration, or that have been subjected to a severe impact.</p>

      <h2>10. Heat Illness Prevention (Cal/OSHA Title 8 §3395)</h2>
      <p>This is a California-specific standard with no direct federal equivalent. Cal/OSHA's Heat Illness Prevention regulation requires employers to provide water, shade, and rest breaks when temperatures reach 80°F, and to implement a written Heat Illness Prevention Plan. High-heat procedures are required when temperatures reach 95°F. This standard is aggressively enforced in Southern California, particularly during summer months.</p>
      <p><strong>What to do:</strong> Develop a written Heat Illness Prevention Plan. Provide one quart of water per worker per hour. Ensure shade is available and accessible. Train supervisors and workers on heat illness recognition and first aid. Implement a new worker acclimatization program.</p>

      <h2>The Bottom Line</h2>
      <p>Most of these violations are preventable with proper training, written programs, and consistent supervision. An OSHA 10 or OSHA 30 course covers the majority of these hazards in detail, giving your workers and supervisors the knowledge to recognize and correct hazards before an inspector does.</p>
      <p>Bastion Risk & Safety Group provides OSHA Outreach Training and site safety audits for construction employers throughout San Diego and Los Angeles. <a href="/contact">Contact us</a> to schedule training or request a site safety assessment.</p>
    `,
  },
  {
    id: "2",
    slug: "top-10-osha-violations-california-maritime",
    title: "Top 10 OSHA Violations on California Maritime Worksites",
    excerpt:
      "Maritime work, including shipyard employment, marine terminals, and longshoring, carries unique hazards governed by specialized OSHA standards. Here are the most cited violations and what port and shipyard employers need to know.",
    category: "Maritime",
    date: "May 15, 2026",
    readTime: "6 min read",
    content: `
      <p>Maritime workers face hazards that are distinct from construction and general industry. OSHA's maritime standards, covering shipyard employment (29 CFR Part 1915), marine terminals (29 CFR Part 1917), and longshoring (29 CFR Part 1918), are enforced by federal OSHA and, in California, by Cal/OSHA as well. The following are the most frequently cited violations in maritime operations, based on OSHA's FY2025 enforcement data.</p>

      <h2>1. Confined Space Entry (29 CFR 1915.12 / 1915.16)</h2>
      <p>Confined space violations are the leading citation category in shipyard employment. Vessel tanks, voids, double bottoms, and enclosed compartments are permit-required confined spaces that require atmospheric testing, ventilation, entry permits, and trained attendants. Failure to test for oxygen deficiency, flammable gases, and toxic vapors before entry is a frequent fatality trigger.</p>
      <p><strong>What to do:</strong> Establish a written Permit-Required Confined Space program. Train entry supervisors, authorized entrants, and attendants. Test atmospheres before and during entry. Never enter a confined space without a permit and a trained attendant outside.</p>

      <h2>2. Fall Protection (29 CFR 1915.159 / 1917.45 / 1918.85)</h2>
      <p>Falls from gangways, vessel decks, staging, and dock structures are a leading cause of maritime fatalities. OSHA's maritime standards have specific fall protection requirements that differ from construction standards, including requirements for gangway safety nets and vessel boarding.</p>
      <p><strong>What to do:</strong> Provide fall protection for workers at heights of 4 feet or more in marine terminals and longshoring operations. Inspect gangways and staging before each shift. Ensure personal fall arrest systems are properly fitted and inspected.</p>

      <h2>3. Electrical Safety: Shipyard (29 CFR 1915.181)</h2>
      <p>Electrical hazards in shipyard environments are compounded by the presence of water, metal surfaces, and confined spaces. Citations commonly involve failure to use ground fault circuit interrupters (GFCIs), improper use of extension cords, and failure to implement lockout/tagout procedures.</p>
      <p><strong>What to do:</strong> Use GFCI protection for all portable electrical equipment in shipyard environments. Implement a written Lockout/Tagout (LOTO) program. Inspect electrical cords and equipment daily.</p>

      <h2>4. Hot Work / Fire Prevention (29 CFR 1915.51 / 1915.52)</h2>
      <p>Welding, cutting, and burning operations aboard vessels or in shipyards require fire watches, gas-free certification, and proper ventilation. Citations involve failure to designate fire watches, inadequate fire extinguisher placement, and failure to test for flammable vapors before hot work in or near tanks.</p>
      <p><strong>What to do:</strong> Obtain a hot work permit before any welding or burning operations. Assign a trained fire watch for at least 30 minutes after hot work is complete. Test for flammable vapors in adjacent spaces before and during hot work.</p>

      <h2>5. Personal Protective Equipment (29 CFR 1915.152 / 1917.94 / 1918.101)</h2>
      <p>PPE violations in maritime operations include failure to provide or enforce the use of hard hats, safety footwear, eye protection, and hearing protection in designated areas. Longshoring operations have specific PPE requirements for cargo handling and crane operations.</p>
      <p><strong>What to do:</strong> Conduct a PPE hazard assessment for each work area. Provide task-specific PPE and enforce its use through supervision. Document PPE training for all workers.</p>

      <h2>6. Hazardous Materials / Hazard Communication (29 CFR 1915.99 / 1910.1200)</h2>
      <p>Maritime workers are frequently exposed to paints, coatings, solvents, and cleaning agents. Failure to maintain Safety Data Sheets, properly label containers, and train workers on chemical hazards is a consistent citation category.</p>
      <p><strong>What to do:</strong> Maintain a current SDS binder accessible to all workers. Ensure all chemical containers are labeled with the product name and hazard warnings. Conduct annual HazCom training.</p>

      <h2>7. Crane and Rigging Safety (29 CFR 1917.50 / 1918.55)</h2>
      <p>Marine terminal and longshoring operations rely heavily on cranes, forklifts, and rigging equipment. Citations involve failure to inspect rigging before use, overloading equipment, and failure to maintain crane inspection records. Dropped loads are a leading cause of maritime fatalities.</p>
      <p><strong>What to do:</strong> Inspect all rigging equipment before each use. Ensure crane operators are qualified and that annual crane inspections are documented. Establish and enforce load limits for all lifting equipment.</p>

      <h2>8. Housekeeping and Walking/Working Surfaces (29 CFR 1917.25 / 1918.91)</h2>
      <p>Slip, trip, and fall hazards on dock surfaces, vessel decks, and in cargo holds are a consistent citation category. Wet surfaces, loose cargo, and poor lighting contribute to these hazards.</p>
      <p><strong>What to do:</strong> Maintain clear walkways and work areas. Address spills and wet surfaces immediately. Ensure adequate lighting in all work areas, including cargo holds and vessel compartments.</p>

      <h2>9. Respiratory Protection (29 CFR 1910.134 / 1915.154)</h2>
      <p>Shipyard workers are exposed to lead paint dust, asbestos, welding fumes, and solvent vapors. Failure to implement a written Respiratory Protection Program, conduct exposure assessments, and provide appropriate respirators is a frequent citation.</p>
      <p><strong>What to do:</strong> Conduct air monitoring to assess worker exposure to airborne hazards. Implement a written Respiratory Protection Program. Provide NIOSH-approved respirators and conduct annual fit testing and medical evaluations.</p>

      <h2>10. First Aid and Emergency Response (29 CFR 1917.26 / 1918.97)</h2>
      <p>Marine terminal and longshoring employers must ensure that first aid is readily available and that workers are trained to respond to emergencies. Citations involve inadequate first aid supplies, lack of trained first aid responders, and failure to establish emergency response procedures.</p>
      <p><strong>What to do:</strong> Ensure at least one person trained in first aid is present at all times during operations. Maintain adequately stocked first aid kits. Post emergency contact numbers and establish clear emergency response procedures.</p>

      <h2>The Bottom Line</h2>
      <p>Maritime OSHA standards are complex and often misunderstood. Many employers apply construction or general industry standards to maritime operations, which can result in non-compliance. OSHA's maritime standards have specific requirements that differ significantly from other industries.</p>
      <p>Bastion Risk & Safety Group provides OSHA Maritime Outreach Training (OSHA 10 and 30-Hour) for shipyard, marine terminal, and longshoring employers in San Diego and Los Angeles. <a href="/contact">Contact us</a> to schedule training for your maritime workforce.</p>
    `,
  },
  {
    id: "3",
    slug: "top-10-osha-violations-california-general-industry",
    title: "Top 10 OSHA Violations in California General Industry",
    excerpt:
      "General industry covers everything from manufacturing and warehousing to utilities and healthcare. These are the 10 most cited OSHA violations for California general industry employers and how to avoid them.",
    category: "General Industry",
    date: "May 10, 2026",
    readTime: "6 min read",
    content: `
      <p>General industry encompasses a broad range of workplaces, including manufacturing facilities, warehouses, utilities, food processing plants, healthcare facilities, and more. While construction gets much of the OSHA enforcement attention, general industry citations are equally costly and equally preventable. Here are the 10 most cited violations for California general industry employers.</p>

      <h2>1. Hazard Communication (29 CFR 1910.1200 / Cal/OSHA Title 8 §5194)</h2>
      <p>Hazard Communication, also known as HazCom or the "Right to Know" standard, is consistently the top citation in general industry. Violations include missing or outdated Safety Data Sheets (SDS), unlabeled chemical containers, and failure to train workers on chemical hazards. California's HazCom standard aligns with the federal GHS (Globally Harmonized System) standard.</p>
      <p><strong>What to do:</strong> Maintain a complete, current SDS binder for every hazardous chemical in the workplace. Ensure all containers are labeled with the product name and GHS hazard pictograms. Conduct annual HazCom training and document it.</p>

      <h2>2. Lockout/Tagout: Control of Hazardous Energy (29 CFR 1910.147 / Cal/OSHA Title 8 §3314)</h2>
      <p>Lockout/Tagout (LOTO) violations are the second most cited standard in general industry and one of the most dangerous. Failure to de-energize equipment before maintenance or servicing, or failure to implement a written LOTO program, results in amputations, electrocutions, and fatalities every year.</p>
      <p><strong>What to do:</strong> Develop a written Lockout/Tagout program with machine-specific procedures for every piece of equipment. Train all authorized employees and affected employees annually. Conduct annual LOTO audits. Maintain a complete set of lockout devices and tags.</p>

      <h2>3. Respiratory Protection (29 CFR 1910.134 / Cal/OSHA Title 8 §5144)</h2>
      <p>Respiratory protection violations are common in manufacturing, welding, painting, and chemical processing operations. Failure to conduct exposure assessments, implement a written Respiratory Protection Program, or provide properly fitted respirators are the most frequent triggers.</p>
      <p><strong>What to do:</strong> Conduct air monitoring to determine worker exposure levels. Implement a written Respiratory Protection Program if respirators are required. Provide NIOSH-approved respirators, conduct annual fit testing, and require medical evaluations before workers wear tight-fitting respirators.</p>

      <h2>4. Powered Industrial Trucks / Forklifts (29 CFR 1910.178 / Cal/OSHA Title 8 §3650)</h2>
      <p>Forklift violations are among the most cited in warehousing, manufacturing, and distribution operations. Common violations include operating forklifts without proper training and certification, failure to conduct pre-shift inspections, and unsafe operating practices such as elevated loads and excessive speeds.</p>
      <p><strong>What to do:</strong> Train and certify all forklift operators before they operate equipment. Conduct refresher training every three years or after an incident. Require pre-shift inspections and remove defective equipment from service. Establish and enforce safe operating procedures.</p>

      <h2>5. Machine Guarding (29 CFR 1910.212 / Cal/OSHA Title 8 §4002)</h2>
      <p>Machine guarding violations involve failure to protect workers from moving machine parts, including rotating parts, in-running nip points, and flying chips or sparks. Removed or bypassed guards are a frequent citation trigger, particularly in manufacturing environments.</p>
      <p><strong>What to do:</strong> Conduct a machine hazard assessment for all equipment. Install guards on all machines with exposed moving parts. Never allow workers to bypass or remove guards. Inspect guards regularly and replace damaged guards immediately.</p>

      <h2>6. Electrical: General Requirements (29 CFR 1910.303 / Cal/OSHA Title 8 §2500)</h2>
      <p>Electrical violations in general industry include exposed live parts, improper grounding, missing knockouts in electrical panels, and failure to maintain electrical equipment. These violations create serious shock and electrocution hazards.</p>
      <p><strong>What to do:</strong> Conduct regular electrical inspections. Ensure all electrical panels have covers and knockouts in place. Maintain clearance in front of electrical panels (minimum 36 inches). Use qualified electricians for electrical work.</p>

      <h2>7. Walking and Working Surfaces (29 CFR 1910.22 / Cal/OSHA Title 8 §3273)</h2>
      <p>Slip, trip, and fall hazards on walking and working surfaces are a consistent citation category. Violations include cluttered aisles, damaged flooring, inadequate lighting, and failure to mark floor load ratings.</p>
      <p><strong>What to do:</strong> Keep all aisles, passageways, and work areas clean and free of obstructions. Repair or replace damaged flooring. Ensure adequate lighting throughout the facility. Mark floor load ratings where required.</p>

      <h2>8. Exit Routes (29 CFR 1910.36 / Cal/OSHA Title 8 §3340)</h2>
      <p>Exit route violations include blocked exits, missing exit signs, inadequate emergency lighting, and failure to maintain exit routes free of obstructions. These violations are particularly dangerous during emergencies.</p>
      <p><strong>What to do:</strong> Conduct monthly inspections of all exit routes. Ensure exit signs are illuminated and visible. Test emergency lighting monthly. Never store materials in exit corridors or stairwells.</p>

      <h2>9. Personal Protective Equipment (29 CFR 1910.132 / Cal/OSHA Title 8 §3380)</h2>
      <p>PPE violations in general industry include failure to conduct a PPE hazard assessment, failure to provide required PPE, and failure to train workers on proper PPE use and maintenance. Eye protection, hearing protection, and foot protection are the most commonly cited PPE categories.</p>
      <p><strong>What to do:</strong> Conduct a written PPE hazard assessment for each job task. Provide task-appropriate PPE at no cost to employees. Train workers on PPE selection, use, and maintenance. Document all PPE training.</p>

      <h2>10. Injury and Illness Prevention Program (Cal/OSHA Title 8 §3203)</h2>
      <p>California's Injury and Illness Prevention Program (IIPP) requirement is unique to Cal/OSHA. There is no direct federal equivalent. Every California employer must have a written IIPP that includes a system for identifying and correcting hazards, a system for communicating with employees about safety, and a training program. The IIPP is the most frequently cited Cal/OSHA standard across all industries.</p>
      <p><strong>What to do:</strong> Develop and implement a written IIPP that meets all Cal/OSHA requirements. Conduct regular workplace inspections and document hazard corrections. Hold safety meetings at least quarterly. Maintain records of all IIPP activities.</p>

      <h2>The Bottom Line</h2>
      <p>Most general industry citations are preventable with a strong safety program, regular training, and consistent supervision. An OSHA 10 or OSHA 30-Hour General Industry course provides workers and supervisors with the foundational knowledge to recognize and address these hazards before they result in injuries or citations.</p>
      <p>Bastion Risk & Safety Group provides OSHA General Industry Outreach Training and safety program development for employers throughout Southern California. <a href="/contact">Contact us</a> to schedule training or request a safety program review.</p>
    `,
  },
  {
    id: "4",
    slug: "recent-federal-osha-cal-osha-changes-2025-2026",
    title: "Recent Federal OSHA & Cal/OSHA Regulatory Changes: What Employers Need to Know",
    excerpt:
      "From stricter lead exposure limits to new confined space rules and a forthcoming heat illness prevention standard. Here is a summary of the most important OSHA and Cal/OSHA regulatory changes affecting California employers in 2025 and 2026.",
    category: "OSHA Updates",
    date: "May 5, 2026",
    readTime: "7 min read",
    content: `
      <p>The regulatory landscape for workplace safety is constantly evolving. California employers face a dual compliance burden, meeting both federal OSHA standards and California's often stricter Cal/OSHA requirements. Here is a summary of the most significant regulatory changes affecting California employers in 2025 and 2026.</p>

      <h2>Cal/OSHA Changes Effective January 1, 2026</h2>

      <h3>1. Stricter Lead Exposure Limits</h3>
      <p>Cal/OSHA significantly revised its lead exposure regulations, with key provisions taking effect January 1, 2026. The most important change: employers must now remove a worker from lead-exposed work if their blood lead level reaches <strong>20 μg/dL</strong> (down from the previous threshold of 30 μg/dL). This applies to both construction and general industry.</p>
      <p>Additionally, employers must now provide change rooms, end-of-shift showers, and lunchroom facilities for employees whose airborne lead exposure exceeds the permissible exposure limit (PEL). These requirements apply to construction and general industry employers working with lead-containing materials, including renovation, demolition, and painting operations.</p>
      <p><strong>Action required:</strong> Review your lead exposure monitoring program. Update your written Lead Compliance Plan. Ensure medical surveillance is in place for all workers with potential lead exposure above the action level.</p>

      <h3>2. Enhanced Confined Space Requirements for Construction</h3>
      <p>Effective January 1, 2026, Cal/OSHA's revised confined space rules for construction require a competent person to conduct an initial survey at the start of work, perform frequent inspections to identify newly created confined spaces, and promptly notify employees and the controlling contractor when new confined spaces are identified.</p>
      <p>Key definitions were also updated, including "entry employer," "hazardous atmosphere," "lockout," and "tagout." Employers must verify that their written procedures, entry permits, coordination with host/controlling employers, and rescue capabilities align with the revised requirements.</p>
      <p><strong>Action required:</strong> Update your written Permit-Required Confined Space program. Ensure your competent person is trained on the new requirements. Review entry permit procedures and rescue capabilities.</p>

      <h3>3. New Training Recordkeeping Requirements</h3>
      <p>Effective January 1, 2026, California Labor Code section 1198.5 now requires employers who maintain education or training records to include in employee personnel files: the employee's name, training provider name, duration and date of training, core competencies covered, and any resulting certification or qualification.</p>
      <p><strong>Action required:</strong> Update your training recordkeeping system to capture all required data elements. Ensure OSHA training records include the trainer's name, course duration, topics covered, and any cards or certificates issued.</p>

      <h3>4. Annual Recordkeeping Posting Requirement</h3>
      <p>From February 1 through April 30, 2026, covered employers must post their 2025 Cal/OSHA Form 300A annual summary in a conspicuous location accessible to all employees. Certain employers must also electronically submit Forms 300, 300A, and 301 data to Cal/OSHA by March 2, 2026.</p>
      <p><strong>Action required:</strong> Complete your 2025 Form 300A and post it by February 1. Determine if your establishment is required to submit data electronically and submit by March 2.</p>

      <h2>Upcoming Cal/OSHA Rulemakings to Watch</h2>

      <h3>5. Workplace Violence Prevention Standard for General Industry</h3>
      <p>Cal/OSHA is developing a Workplace Violence Prevention standard for general industry, with adoption required no later than December 31, 2026. The proposed rule will require covered employers to establish, implement, and maintain a written Workplace Violence Prevention Plan — including hazard identification, employee training, incident response procedures, and post-incident investigation protocols.</p>
      <p>Note: Healthcare employers are already subject to California's existing Workplace Violence Prevention in Healthcare standard (SB 1299). The new general industry standard will extend these requirements to non-healthcare workplaces.</p>
      <p><strong>Action required:</strong> Begin developing a Workplace Violence Prevention Plan now. Review your current security procedures and incident reporting systems.</p>

      <h3>6. Worker Walkaround Rule</h3>
      <p>On February 13, 2026, Cal/OSHA proposed a California version of the federal OSHA worker walkaround rule, which would allow non-employee third parties (such as union representatives or safety consultants) to serve as employee representatives during workplace inspections. A public hearing is scheduled for April 1, 2026.</p>

      <h2>Federal OSHA Changes and Priorities for 2025–2026</h2>

      <h3>7. Increased Penalties</h3>
      <p>Federal OSHA increased its maximum penalty amounts effective January 15, 2025. Current maximum penalties are:</p>
      <ul>
        <li><strong>Serious violations:</strong> $16,550 per violation</li>
        <li><strong>Willful or repeat violations:</strong> $165,514 per violation</li>
        <li><strong>Other-than-serious violations:</strong> $16,550 per violation</li>
        <li><strong>Failure to abate:</strong> $16,550 per day</li>
      </ul>
      <p>Cal/OSHA penalties are calculated differently but can be equally significant, particularly for serious and willful violations.</p>

      <h3>8. Heat Illness Prevention Standard (Federal)</h3>
      <p>Federal OSHA is developing a national Heat Injury and Illness Prevention Standard, the first federal heat standard ever. The proposed rule would require employers in all industries to develop a written Heat Injury and Illness Prevention Plan, provide water and rest breaks, and implement acclimatization procedures for new and returning workers.</p>
      <p>California already has one of the most comprehensive heat illness prevention standards in the country (Cal/OSHA Title 8 §3395), but the federal standard would extend similar protections to workers in states without their own heat rules. California employers should already be in compliance with Cal/OSHA's heat standard, but should review their programs to ensure they meet all requirements.</p>

      <h3>9. Silica Enforcement Continues</h3>
      <p>Federal OSHA and Cal/OSHA continue to aggressively enforce the crystalline silica standard (29 CFR 1926.1153 for construction, 29 CFR 1910.1053 for general industry). Employers who cut, grind, drill, or crush silica-containing materials, including concrete, masonry, stone, and sand, must implement engineering controls, provide respiratory protection, conduct medical surveillance, and maintain exposure records.</p>
      <p>In Southern California, silica enforcement is particularly active in construction and landscaping operations.</p>

      <h3>10. Expanded Injury and Illness Recordkeeping</h3>
      <p>OSHA continues to expand electronic submission requirements for injury and illness records. Establishments with 100 or more employees in high-hazard industries must submit their complete Form 300 and Form 301 data electronically each year. Establishments with 20–99 employees in high-hazard industries must submit Form 300A data annually.</p>

      <h2>What This Means for Your Business</h2>
      <p>The pace of regulatory change in California is accelerating. Employers who rely on outdated safety programs or infrequent training are increasingly at risk of citations, penalties, and worker injuries.</p>
      <p>Staying current requires regular review of your safety programs, updated training for supervisors and workers, and a proactive approach to hazard identification and correction.</p>
      <p>Bastion Risk & Safety Group helps California employers navigate these regulatory changes with safety program development, compliance audits, and OSHA Outreach Training. <a href="/contact">Contact us</a> to schedule a compliance review or training session for your team.</p>
    `,
  },
];

// ─── Category Colors ──────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  "OSHA Updates":   { bg: "bg-blue-100",   text: "text-blue-700" },
  "Construction":   { bg: "bg-orange-100", text: "text-orange-700" },
  "Maritime":       { bg: "bg-sky-100",    text: "text-sky-800" },
  "General Industry": { bg: "bg-green-100", text: "text-green-800" },
  "Training Tips":  { bg: "bg-emerald-100", text: "text-emerald-700" },
  "Company News":   { bg: "bg-purple-100", text: "text-purple-700" },
};

const ALL_CATEGORIES = ["All", "OSHA Updates", "Construction", "Maritime", "General Industry"];

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: Article }) {
  const cat = CATEGORY_STYLES[article.category] ?? { bg: "bg-gray-100", text: "text-gray-700" };

  const icons: Record<string, string> = {
    "OSHA Updates": "📋",
    "Construction": "🔧",
    "Maritime": "⚓",
    "General Industry": "🏭",
    "Training Tips": "🎓",
    "Company News": "📣",
  };
  const gradients: Record<string, string> = {
    "OSHA Updates": "from-[#0070CC] to-[#00A3FF]",
    "Construction": "from-orange-600 to-orange-400",
    "Maritime": "from-[#0D47A1] to-[#1565C0]",
    "General Industry": "from-green-700 to-green-500",
    "Training Tips": "from-emerald-700 to-emerald-500",
    "Company News": "from-purple-700 to-purple-500",
  };

  return (
    <Link href={`/blog/${article.slug}`}>
      <div className="group bg-white rounded-xl shadow-md overflow-hidden flex flex-col cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-200 h-full">
        <div className={`w-full h-40 bg-gradient-to-br ${gradients[article.category] ?? "from-gray-600 to-gray-800"} flex items-center justify-center text-5xl`}>
          {icons[article.category] ?? "📄"}
        </div>
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded ${cat.bg} ${cat.text}`}>
              {article.category}
            </span>
            <span className="text-xs text-gray-400">{article.date}</span>
          </div>
          <h3 className="font-display font-extrabold text-[#0F1C2E] text-lg uppercase leading-tight mb-2 group-hover:text-[#00A3FF] transition-colors">
            {article.title}
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{article.excerpt}</p>
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0F1C2E] flex items-center justify-center text-[#00A3FF] text-[10px] font-bold">BR</div>
              <span className="text-xs font-semibold text-gray-500">Bastion RSG Team</span>
            </div>
            <span className="text-xs font-semibold text-[#00A3FF] group-hover:text-[#0070CC] transition-colors">Read →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Article Detail Page ──────────────────────────────────────────────────────

export function ArticleDetail({ slug }: { slug: string }) {
  const article = ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display font-extrabold text-4xl text-[#0F1C2E] mb-4 uppercase">Article Not Found</h1>
          <Link href="/blog">
            <span className="text-[#00A3FF] font-semibold hover:underline cursor-pointer">← Back to Blog</span>
          </Link>
        </div>
      </div>
    );
  }

  const cat = CATEGORY_STYLES[article.category] ?? { bg: "bg-gray-100", text: "text-gray-700" };

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Navbar />
      {/* Article Header */}
      <div className="bg-[#0F1C2E] pt-36 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog">
            <span className="text-[#00A3FF] text-sm font-semibold hover:underline cursor-pointer mb-6 inline-block">← Back to Resources</span>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded ${cat.bg} ${cat.text}`}>
              {article.category}
            </span>
            <span className="text-gray-400 text-sm">{article.date}</span>
            <span className="text-gray-400 text-sm">· {article.readTime}</span>
          </div>
          <h1 className="font-display font-extrabold text-white text-3xl md:text-4xl uppercase leading-tight mb-4">
            {article.title}
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">{article.excerpt}</p>
          <div className="flex items-center gap-2 mt-6">
            <div className="w-8 h-8 rounded-full bg-[#00A3FF] flex items-center justify-center text-white text-xs font-bold">BR</div>
            <span className="text-gray-300 text-sm font-medium">Bastion RSG Team</span>
          </div>
        </div>
      </div>

      {/* Article Body */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div
          className="prose prose-slate max-w-none
            prose-headings:font-display prose-headings:uppercase prose-headings:text-[#0F1C2E]
            prose-h2:text-2xl prose-h2:font-extrabold prose-h2:mt-10 prose-h2:mb-3
            prose-h3:text-xl prose-h3:font-bold prose-h3:mt-8 prose-h3:mb-2
            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4
            prose-strong:text-[#0F1C2E] prose-strong:font-semibold
            prose-a:text-[#00A3FF] prose-a:no-underline hover:prose-a:underline
            prose-ul:text-gray-600 prose-li:mb-1"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* CTA */}
        <div className="mt-12 bg-[#0F1C2E] rounded-xl p-8 text-center">
          <h3 className="font-display font-extrabold text-white text-2xl uppercase mb-3">
            Need OSHA Training or a Safety Audit?
          </h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Bastion Risk & Safety Group provides OSHA Outreach Training and safety consulting for construction, maritime, and general industry employers in San Diego and Los Angeles.
          </p>
          <Link href="/contact">
            <button className="bg-[#00A3FF] hover:bg-[#0070CC] text-white font-bold text-sm uppercase tracking-wider px-8 py-3 rounded transition-colors">
              Request a Free Quote
            </button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── Blog Index Page ──────────────────────────────────────────────────────────

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? ARTICLES
    : ARTICLES.filter((a) => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Navbar />
      {/* Page Header */}
      <div className="bg-[#0F1C2E] pt-36 pb-16 px-6 text-center">
        <h1 className="font-display font-extrabold text-white text-5xl md:text-6xl uppercase leading-none mb-4">
          Safety <span className="text-[#00A3FF]">Resources</span> & Blog
        </h1>
        <p className="text-gray-400 text-base max-w-lg mx-auto leading-relaxed">
          Expert insights on OSHA compliance, workplace safety, and industry best practices from the Bastion RSG team.
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 justify-center px-6 pt-8 pb-2">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded text-sm font-semibold border transition-all ${
              activeCategory === cat
                ? "bg-[#00A3FF] border-[#00A3FF] text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-[#0F1C2E] hover:text-[#0F1C2E]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Article Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-7">
        {filtered.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="bg-white border-t border-gray-200 py-12 px-6 text-center">
        <h2 className="font-display font-extrabold text-[#0F1C2E] text-3xl uppercase mb-3">
          Ready to Train Your Team?
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
          Bastion RSG delivers OSHA Outreach Training for construction, maritime, and general industry in San Diego and Los Angeles.
        </p>
        <Link href="/contact">
          <button className="bg-[#00A3FF] hover:bg-[#0070CC] text-white font-bold text-sm uppercase tracking-wider px-8 py-3 rounded transition-colors">
            Request a Free Quote
          </button>
        </Link>
      </div>
      <Footer />
    </div>
  );
}

export { ARTICLES };
