import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const disciplines = [
  {
    name: "Design",
    slug: "design",
    description: "Graphic design, UI/UX, branding, and visual communication",
    sortOrder: 1,
  },
  {
    name: "Illustration",
    slug: "illustration",
    description: "Digital and traditional illustration, concept art, character design",
    sortOrder: 2,
  },
  {
    name: "Music",
    slug: "music",
    description: "Music production, composition, sound design, and audio engineering",
    sortOrder: 3,
  },
  {
    name: "Video",
    slug: "video",
    description: "Video production, editing, motion graphics, and cinematography",
    sortOrder: 4,
  },
  {
    name: "Animation",
    slug: "animation",
    description: "2D and 3D animation, motion design, and visual effects",
    sortOrder: 5,
  },
  {
    name: "Writing",
    slug: "writing",
    description: "Copywriting, content writing, screenwriting, and creative writing",
    sortOrder: 6,
  },
  {
    name: "Photography",
    slug: "photography",
    description: "Commercial, portrait, product, and editorial photography",
    sortOrder: 7,
  },
  {
    name: "3D & CGI",
    slug: "3d",
    description: "3D modeling, texturing, rendering, and CGI production",
    sortOrder: 8,
  },
  {
    name: "Sound Design",
    slug: "sound-design",
    description: "Sound effects, foley, audio post-production, and game audio",
    sortOrder: 9,
  },
  {
    name: "Game Development",
    slug: "game-dev",
    description: "Game design, development, level design, and interactive media",
    sortOrder: 10,
  },
];

const skills = [
  // Design skills
  { name: "Figma", category: "Design" },
  { name: "Adobe Photoshop", category: "Design" },
  { name: "Adobe Illustrator", category: "Design" },
  { name: "Sketch", category: "Design" },
  { name: "UI Design", category: "Design" },
  { name: "UX Design", category: "Design" },
  { name: "Brand Identity", category: "Design" },
  { name: "Typography", category: "Design" },
  { name: "Web Design", category: "Design" },
  { name: "Mobile Design", category: "Design" },

  // Illustration skills
  { name: "Digital Painting", category: "Illustration" },
  { name: "Character Design", category: "Illustration" },
  { name: "Concept Art", category: "Illustration" },
  { name: "Procreate", category: "Illustration" },
  { name: "Adobe Fresco", category: "Illustration" },
  { name: "Editorial Illustration", category: "Illustration" },

  // Music skills
  { name: "Music Production", category: "Music" },
  { name: "Ableton Live", category: "Music" },
  { name: "Logic Pro", category: "Music" },
  { name: "FL Studio", category: "Music" },
  { name: "Pro Tools", category: "Music" },
  { name: "Mixing", category: "Music" },
  { name: "Mastering", category: "Music" },
  { name: "Composition", category: "Music" },

  // Video skills
  { name: "Adobe Premiere Pro", category: "Video" },
  { name: "Final Cut Pro", category: "Video" },
  { name: "DaVinci Resolve", category: "Video" },
  { name: "Video Editing", category: "Video" },
  { name: "Color Grading", category: "Video" },
  { name: "Cinematography", category: "Video" },

  // Animation skills
  { name: "After Effects", category: "Animation" },
  { name: "Motion Graphics", category: "Animation" },
  { name: "2D Animation", category: "Animation" },
  { name: "3D Animation", category: "Animation" },
  { name: "Character Animation", category: "Animation" },
  { name: "Lottie", category: "Animation" },

  // Writing skills
  { name: "Copywriting", category: "Writing" },
  { name: "Content Writing", category: "Writing" },
  { name: "Screenwriting", category: "Writing" },
  { name: "Creative Writing", category: "Writing" },
  { name: "Technical Writing", category: "Writing" },
  { name: "SEO Writing", category: "Writing" },

  // Photography skills
  { name: "Portrait Photography", category: "Photography" },
  { name: "Product Photography", category: "Photography" },
  { name: "Adobe Lightroom", category: "Photography" },
  { name: "Photo Editing", category: "Photography" },
  { name: "Studio Lighting", category: "Photography" },

  // 3D skills
  { name: "Blender", category: "3D" },
  { name: "Cinema 4D", category: "3D" },
  { name: "Maya", category: "3D" },
  { name: "3ds Max", category: "3D" },
  { name: "ZBrush", category: "3D" },
  { name: "Substance Painter", category: "3D" },
  { name: "3D Modeling", category: "3D" },
  { name: "Texturing", category: "3D" },
  { name: "Rendering", category: "3D" },

  // Sound Design skills
  { name: "Sound Effects", category: "Sound Design" },
  { name: "Foley", category: "Sound Design" },
  { name: "Game Audio", category: "Sound Design" },
  { name: "Podcast Production", category: "Sound Design" },
  { name: "Audio Post-Production", category: "Sound Design" },

  // Game Development skills
  { name: "Unity", category: "Game Development" },
  { name: "Unreal Engine", category: "Game Development" },
  { name: "Game Design", category: "Game Development" },
  { name: "Level Design", category: "Game Development" },
  { name: "Godot", category: "Game Development" },
];

async function main() {
  console.log("Seeding database...");

  // Seed disciplines
  console.log("Seeding disciplines...");
  for (const discipline of disciplines) {
    await prisma.discipline.upsert({
      where: { slug: discipline.slug },
      update: discipline,
      create: discipline,
    });
  }
  console.log(`Seeded ${disciplines.length} disciplines`);

  // Seed skills
  console.log("Seeding skills...");
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: skill,
      create: skill,
    });
  }
  console.log(`Seeded ${skills.length} skills`);

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
