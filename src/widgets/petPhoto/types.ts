export type PetPhotoSettings = {
  provider: "staticManifest";
  manifestPath: string;
  selection: "twiceDaily";
};

export type PetPhoto = {
  id: string;
  src: string;
  favorite: boolean;
};

export type PetPhotoManifest = {
  photos: PetPhoto[];
};

export type PetPhotoData = {
  photo?: PetPhoto;
  totalPhotos: number;
  selectedForPeriod: string;
};
