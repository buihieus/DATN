import { postService } from './roomService';

// Reuse the same interfaces from roomService
export interface Province {
  Code: string;
  Name: string;
}

export interface Ward {
  Code: string;
  Name: string;
}

export const fetchProvinces = async (): Promise<Province[]> => {
  try {
    const response = await postService.getLocations();
    // The API returns provinces in the metadata.provinces field
    return response.metadata?.provinces || [];
  } catch (error: any) {
    console.error('Error fetching provinces:', error?.message || error);
    // Return an empty array instead of throwing to allow fallback in component
    return [];
  }
};

export const fetchDistrictsByProvince = async (provinceCode: string): Promise<Ward[]> => {
  try {
    const response = await postService.getLocations(provinceCode);
    // The API returns wards (districts) in the metadata.wards field
    return response.metadata?.wards || [];
  } catch (error: any) {
    console.error('Error fetching districts:', error?.message || error);
    // Return an empty array instead of throwing to allow fallback in component
    return [];
  }
};