import { LoaderType } from "../../config/BootAssets";

export const FileExtToLoaderTypeMap: { [key: string]: LoaderType } = {
    "fbx": LoaderType.FBX,
    "gltf": LoaderType.GLTF,
    "obj": LoaderType.OBJMTL,
    "json": LoaderType.JSON
};
