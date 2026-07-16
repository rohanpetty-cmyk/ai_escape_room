export const roomImages: Record<string, { src: string; alt: string }> = {
  laboratory: {
    src: "/images/laboratory.svg",
    alt: "Dim abandoned AI laboratory",
  },
  archive: {
    src: "/images/archive.svg",
    alt: "Cold memory archive shelves",
  },
  control: {
    src: "/images/control-room.svg",
    alt: "Emergency control room",
  },
  observatory: {
    src: "/images/observatory.svg",
    alt: "Night observatory chamber",
  },
  cellar: {
    src: "/images/cellar.svg",
    alt: "Underground mechanical cellar",
  },
  library: {
    src: "/images/library.svg",
    alt: "Shadowed research library",
  },
};

export function getRoomImage(imageKey: string) {
  return roomImages[imageKey] ?? roomImages.laboratory;
}
