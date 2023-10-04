export enum LoaderType {
  OBJ = "obj",
  OBJMTL = "obj/mtl",
  PIXI = "pixi",
  FBX = "fbx",
  GLTF = "gltf",
  WASM = "wasm",
  JSON = "json"
}

export const BootAssets: Array<{key: string, path: string, type: LoaderType}> = [
  {
    key: "bg3-shared-spritesheet",
    path: "sprites/Spritesheets/bg3-shared.json",
    type: LoaderType.PIXI,
  },
  {
    key: "Logo",
    path: "sprites/logo.png",
    type: LoaderType.PIXI,
  },
  {
    key: "Glow",
    path: "sprites/glow.png",
    type: LoaderType.PIXI,
  },
  {
    key: "color-mask",
    path: "sprites/color-mask.png",
    type: LoaderType.PIXI,
  },
  {
    key: "inner-container-nineslice",
    path: "sprites/inner-container-nineslice.png",
    type: LoaderType.PIXI,
  },
  {
    key: "white-square-stroke",
    path: "sprites/white-square-stroke.png",
    type: LoaderType.PIXI,
  },
  {
    key: "inv-slot",
    type: LoaderType.PIXI,
    path: "sprites/inv-slot.png",
  },
];
