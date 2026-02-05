import { API_BASE_URL } from './apiConfig';
import { getStoredTokens } from '../utils/tokenUtils';

interface UploadResponse {
  message: string;
  image: string; // URL of the uploaded image
}

export const uploadService = {
  // Upload a single image (like avatar)
  uploadAvatar: async (imageUri: string): Promise<UploadResponse> => {
    try {
      const { accessToken } = await getStoredTokens();

      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // Determine the filename from the URI
      const fileName = imageUri.split('/').pop() || 'avatar.jpg';
      const fileType = fileName.split('.').pop()?.toLowerCase();
      
      // Determine the MIME type based on file extension
      let mimeType = 'image/jpeg'; // default
      if (fileType === 'png') {
        mimeType = 'image/png';
      } else if (fileType === 'gif') {
        mimeType = 'image/gif';
      } else if (fileType === 'jpg' || fileType === 'jpeg') {
        mimeType = 'image/jpeg';
      }

      // Append the image file to the form data
      formData.append('avatar', {
        uri: imageUri,
        type: mimeType,
        name: fileName,
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error during upload');
    }
  },

  // Upload multiple images (for posts)
  uploadImages: async (imageUris: string[]): Promise<{ message: string; images: string[] }> => {
    try {
      const { accessToken } = await getStoredTokens();

      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // Add each image to the form data
      imageUris.forEach((imageUri, index) => {
        const fileName = imageUri.split('/').pop() || `image_${index}.jpg`;
        const fileType = fileName.split('.').pop()?.toLowerCase();
        
        // Determine the MIME type based on file extension
        let mimeType = 'image/jpeg'; // default
        if (fileType === 'png') {
          mimeType = 'image/png';
        } else if (fileType === 'gif') {
          mimeType = 'image/gif';
        } else if (fileType === 'jpg' || fileType === 'jpeg') {
          mimeType = 'image/jpeg';
        }

        // Append the image file to the form data
        formData.append('images', {
          uri: imageUri,
          type: mimeType,
          name: fileName,
        } as any);
      });

      const response = await fetch(`${API_BASE_URL}/api/upload-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error during upload');
    }
  },
};