export interface DestinyGear{
	custom_dyes:DestinyDye[];
	default_dyes:DestinyDye[];
	locked_dyes:DestinyDye[];
	reference_id:string;
}

export interface DestinyDye{
	cloth:boolean;
	hash:number;
	investment_hash:number;
	material_properties:DestinyDyeMaterialProperties;
	textures:DestinyDyeTextures;
	slot_type_index:number;
}

export interface DestinyDyeMaterialProperties{
	detail_diffuse_transform:number[];
	detail_normal_transform:number[];
	emissive_pbr_params:number[];
	emissive_tint_color_and_intensity_bias:number[];
	lobe_pbr_params:number[];
	primary_albedo_tint:number[];
	primary_material_advanced_params:number[];
	primary_material_params:number[];
	primary_roughness_remap:number[];
	secondary_albedo_tint:number[];
	secondary_material_params:number[];
	secondary_roughness_remap:number[];
	spec_aa_xform:number[];
	specular_properties:number[];
	subsurface_scattering_strength_and_emissive:number[];
	tint_pbr_params:number[];
	wear_remap:number[];
	worn_albedo_tint:number[];
	worn_material_parameters:number[];
	worn_roughness_remap:number[];
}
//primary/secondary material params 
// 0 - ????
// 1 - ????
// 2 - metalness ?

export interface DestinyDyeTextures{
	diffuse:DestinyDyeTexture;
	normal:DestinyDyeTexture;
	primary_diffuse:DestinyDyeTexture;
	secondary_diffuse:DestinyDyeTexture;
}

export interface DestinyDyeTexture{
	name:string;
	reference_id:string;
}
