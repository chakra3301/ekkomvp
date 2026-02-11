export interface Discipline {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export const DISCIPLINES: Discipline[] = [
  {
    id: "design",
    name: "Design",
    slug: "design",
    description: "Graphic design, UI/UX, branding, and visual communication",
    icon: "palette",
  },
  {
    id: "illustration",
    name: "Illustration",
    slug: "illustration",
    description: "Digital and traditional illustration, concept art, character design",
    icon: "pencil",
  },
  {
    id: "music",
    name: "Music",
    slug: "music",
    description: "Music production, composition, sound design, and audio engineering",
    icon: "music",
  },
  {
    id: "video",
    name: "Video",
    slug: "video",
    description: "Video production, editing, motion graphics, and cinematography",
    icon: "video",
  },
  {
    id: "animation",
    name: "Animation",
    slug: "animation",
    description: "2D and 3D animation, motion design, and visual effects",
    icon: "play",
  },
  {
    id: "writing",
    name: "Writing",
    slug: "writing",
    description: "Copywriting, content writing, screenwriting, and creative writing",
    icon: "pen-tool",
  },
  {
    id: "photography",
    name: "Photography",
    slug: "photography",
    description: "Commercial, portrait, product, and editorial photography",
    icon: "camera",
  },
  {
    id: "3d",
    name: "3D & CGI",
    slug: "3d",
    description: "3D modeling, texturing, rendering, and CGI production",
    icon: "box",
  },
  {
    id: "sound-design",
    name: "Sound Design",
    slug: "sound-design",
    description: "Sound effects, foley, audio post-production, and game audio",
    icon: "volume-2",
  },
  {
    id: "game-dev",
    name: "Game Development",
    slug: "game-dev",
    description: "Game design, development, level design, and interactive media",
    icon: "gamepad-2",
  },
] as const;

export const DISCIPLINE_SLUGS = DISCIPLINES.map((d) => d.slug);

export type DisciplineSlug = (typeof DISCIPLINES)[number]["slug"];
