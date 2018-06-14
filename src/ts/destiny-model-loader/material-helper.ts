import { Material } from "three";

export class MaterialHelper{
	static addPropertyToAllMaterials(materials:Material[], property:string, value:any){
		materials.forEach((material)=>{
			(material as any)[property] = value;
		})
	}
}
