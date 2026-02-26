import { API_BASE_URL } from './apiConfig';
import { getStoredTokens } from '../utils/tokenUtils';

interface UploadResponse {
  message: string;
  image: string; // URL of the uploaded image
}

export const uploadService = {
  // Upload a single image (like avatar)
  uploadAvatar: async (imageUri: string): Promise<UploadResponse> => {
    console.log('uploadAvatar: Starting upload with URI:', imageUri);
    
    try {
      const { accessToken } = await getStoredTokens();

      if (!accessToken) {
        console.error('uploadAvatar: No access token available');
        throw new Error('No access token available');
      }

      // Create FormData for file upload
      const formData = new FormData() as any;

      // Determine the filename from the URI
      const fileName = imageUri.split('/').pop() || 'avatar.jpg';
      const fileType = fileName.split('.').pop()?.toLowerCase();
      console.log('uploadAvatar: Filename:', fileName, 'File type:', fileType);

      // Determine the MIME type based on file extension
      let mimeType = 'image/jpeg'; // default
      if (fileType === 'png') {
        mimeType = 'image/png';
      } else if (fileType === 'gif') {
        mimeType = 'image/gif';
      } else if (fileType === 'jpg' || fileType === 'jpeg') {
        mimeType = 'image/jpeg';
      }
      console.log('uploadAvatar: MIME type:', mimeType);

      // Append the image file to the form data
      // For React Native, we need to use the correct format
      const fileData: any = {
        uri: imageUri,
        type: mimeType,
        name: fileName,
      };
      
      console.log('uploadAvatar: File data:', { uri: imageUri, type: mimeType, name: fileName });
      formData.append('avatar', fileData);

      const uploadUrl = `${API_BASE_URL}/api/upload-image`;
      console.log('uploadAvatar: Uploading to:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      console.log('uploadAvatar: Response status:', response.status);

      const responseText = await response.text();
      console.log('uploadAvatar: Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('uploadAvatar: Failed to parse response JSON:', parseError);
        throw new Error('Invalid response from server');
      }

      if (response.ok) {
        console.log('uploadAvatar: Upload successful');
        return data;
      } else {
        console.error('uploadAvatar: Upload failed:', data);
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('uploadAvatar: Error during upload:', error.message);
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
      const formData = new FormData() as any;

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
        });
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
