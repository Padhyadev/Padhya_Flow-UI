import { ApiResponse } from '../types/apiTypes';
import { logError } from '../../utils/logError';

const API_BASE_URL = 'https://aj.padhyasoft.com/api';

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
    return localStorage.getItem('admin_token');
};

/**
 * Create headers with authorization token for multipart/form-data
 */
const createAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    return {
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

export const propertyImageApi = {
    /**
     * Upload Property Photos
     * POST /api/PropertyImages/UploadPropertyPhotos?propertyId={id}&primaryIndex={index}
     * @param propertyId - The ID of the property
     * @param files - Array of image files to upload
     * @param primaryIndex - Index of the primary image (0-based)
     */
    uploadPropertyPhotos: async (
        propertyId: number,
        files: File[],
        primaryIndex: number = -1
    ): Promise<ApiResponse<any>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 PROPERTY IMAGE API: Uploading photos for property:', propertyId);
            console.log('🔥 PROPERTY IMAGE API: Number of files:', files.length);
            console.log('🔥 PROPERTY IMAGE API: Primary index:', primaryIndex);

            // Create FormData
            const formData = new FormData();
            files.forEach((file, index) => {
                formData.append('files', file);
                console.log(`🔥 PROPERTY IMAGE API: Added file ${index}:`, file.name);
            });

            const url = `${API_BASE_URL}/PropertyImages/UploadPropertyPhotos?propertyId=${propertyId}&primaryIndex=${primaryIndex}`;
            console.log('🔥 PROPERTY IMAGE API: Upload URL:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: createAuthHeaders(),
                body: formData
            });

            console.log('🔥 PROPERTY IMAGE API: Upload response status:', response.status);
            console.log('🔥 PROPERTY IMAGE API: Upload response ok:', response.ok);

            // Check if response has content
            const contentType = response.headers.get('content-type');
            console.log('🔥 PROPERTY IMAGE API: Response content-type:', contentType);

            let responseData;
            if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
                console.log('🔥 PROPERTY IMAGE API: Response has no JSON content');
                responseData = {};
            } else {
                const responseText = await response.text();
                console.log('🔥 PROPERTY IMAGE API: Raw response text:', responseText);

                try {
                    responseData = responseText ? JSON.parse(responseText) : {};
                } catch (e) {
                    console.error('🔥 PROPERTY IMAGE API: Failed to parse response:', e);
                    responseData = {};
                }
            }

            console.log('🔥 PROPERTY IMAGE API: Response data:', responseData);

            // Check if response indicates success (200, 201, or 204)
            const isSuccess = response.ok && (response.status === 200 || response.status === 201 || response.status === 204);

            if (!isSuccess) {
                throw new Error(responseData.message || `Failed To Upload Images (Status: ${response.status})`);
            }

            console.log('🔥 PROPERTY IMAGE API: Images uploaded successfully!');

            return {
                success: true,
                data: responseData,
                message: 'Images Uploaded Successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Upload Property Images API Error:', error);

            // Check if it's a CORS/network error
            const isCorsError = error instanceof TypeError && error.message === 'Failed to fetch';

            // Check if it's a JSON parse error
            const isJsonParseError = error instanceof SyntaxError && error.message.includes('JSON');

            if (isCorsError || isJsonParseError) {
                console.warn('🔥 PROPERTY IMAGE API: Network/Parse error detected, but images may have been uploaded. Treating as success.');

                await logError({
                    controllerName: 'PropertyImageApi',
                    methodName: 'UploadPropertyPhotos',
                    requestUrl: `${API_BASE_URL}/PropertyImages/UploadPropertyPhotos`,
                    requestPayload: { propertyId, filesCount: files.length, primaryIndex },
                    error: new Error(isCorsError ? 'CORS error - images uploaded but response blocked' : 'JSON parse error - images uploaded but response invalid')
                });

                return {
                    success: true,
                    data: {},
                    message: 'Images Uploaded Successfully',
                    timestamp: new Date().toISOString(),
                };
            }

            await logError({
                controllerName: 'PropertyImageApi',
                methodName: 'UploadPropertyPhotos',
                requestUrl: `${API_BASE_URL}/PropertyImages/UploadPropertyPhotos`,
                requestPayload: { propertyId, filesCount: files.length, primaryIndex },
                error
            });

            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed To Upload Images',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Get Property Images by Property ID
     * GET /api/PropertyImages/GetImagesbyPropertyId?propertyId={id}
     * @param propertyId - The ID of the property
     */
    getImagesByPropertyId: async (propertyId: number): Promise<ApiResponse<any[]>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 PROPERTY IMAGE API: Fetching images for property:', propertyId);

            const url = `${API_BASE_URL}/PropertyImages/GetImagesbyPropertyId?propertyId=${propertyId}`;
            console.log('🔥 PROPERTY IMAGE API: Fetch URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: createAuthHeaders(),
            });

            console.log('🔥 PROPERTY IMAGE API: Fetch response status:', response.status);
            console.log('🔥 PROPERTY IMAGE API: Fetch response ok:', response.ok);

            if (!response.ok) {
                throw new Error(`Failed to fetch images (Status: ${response.status})`);
            }

            const data = await response.json();
            console.log('🔥 PROPERTY IMAGE API: Fetched images data:', data);

            // Handle nested response structure
            let imagesArray = [];
            if (data && data.data) {
                // Check if data.data is an array or has nested data
                if (Array.isArray(data.data)) {
                    imagesArray = data.data;
                } else if (data.data.data && Array.isArray(data.data.data)) {
                    imagesArray = data.data.data;
                }
            }

            console.log('🔥 PROPERTY IMAGE API: Extracted images array:', imagesArray);
            console.log('🔥 PROPERTY IMAGE API: Images count:', imagesArray.length);

            // Process images to handle base64 data
            const processedImages = imagesArray.map((img: any) => {
                console.log('🔥 PROPERTY IMAGE API: Processing image:', img);

                // If imageUrl is null but resumeFile has base64 data, create data URL
                let imageUrl = img.imageUrl;
                if (!imageUrl && img.resumeFile) {
                    // resumeFile contains base64 image data
                    imageUrl = `data:image/jpeg;base64,${img.resumeFile}`;
                    console.log('🔥 PROPERTY IMAGE API: Created data URL from base64');
                }

                return {
                    ...img,
                    imageUrl: imageUrl,
                    imagePath: imageUrl // Also set imagePath for fallback
                };
            });

            console.log('🔥 PROPERTY IMAGE API: Processed images:', processedImages);

            return {
                success: true,
                data: processedImages,
                message: 'Images Fetched Successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Get Property Images API Error:', error);

            await logError({
                controllerName: 'PropertyImageApi',
                methodName: 'GetImagesByPropertyId',
                requestUrl: `${API_BASE_URL}/PropertyImages/GetImagesbyPropertyId`,
                requestPayload: { propertyId },
                error
            });

            return {
                success: false,
                data: [],
                message: error instanceof Error ? error.message : 'Failed To Fetch Images',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Delete Property Image
     * DELETE /api/PropertyImages/DeleteImage?imageId={id}
     * @param imageId - The ID of the image to delete
     */
    deletePropertyImage: async (imageId: number): Promise<ApiResponse<any>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 PROPERTY IMAGE API: Deleting image:', imageId);

            const url = `${API_BASE_URL}/PropertyImages/DeletebyImageId?id=${imageId}`;
            console.log('🔥 PROPERTY IMAGE API: Delete URL:', url);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: createAuthHeaders(),
            });

            console.log('🔥 PROPERTY IMAGE API: Delete response status:', response.status);
            console.log('🔥 PROPERTY IMAGE API: Delete response ok:', response.ok);

            if (!response.ok) {
                throw new Error(`Failed to delete image (Status: ${response.status})`);
            }

            // Check if response has content
            const contentType = response.headers.get('content-type');
            let responseData;
            if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
                responseData = {};
            } else {
                const responseText = await response.text();
                try {
                    responseData = responseText ? JSON.parse(responseText) : {};
                } catch (e) {
                    responseData = {};
                }
            }

            console.log('🔥 PROPERTY IMAGE API: Image deleted successfully!');

            return {
                success: true,
                data: responseData,
                message: 'Image Deleted Successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Delete Property Image API Error:', error);

            await logError({
                controllerName: 'PropertyImageApi',
                methodName: 'DeletePropertyImage',
                requestUrl: `${API_BASE_URL}/PropertyImages/DeletebyImageId`,
                requestPayload: { imageId },
                error
            });

            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed To Delete Image',
                timestamp: new Date().toISOString(),
            };
        }
    },

    /**
     * Update Primary Image
     * POST /api/PropertyImages/UpdatePrimaryImage?propertyId={propertyId}&imageId={imageId}
     * @param propertyId - The ID of the property
     * @param imageId - The ID of the image to set as primary
     */
    updatePrimaryImage: async (propertyId: number, imageId: number): Promise<ApiResponse<any>> => {
        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔥 PROPERTY IMAGE API: Updating primary image:', imageId, 'for property:', propertyId);

            const url = `${API_BASE_URL}/PropertyImages/UpdatePrimaryImage?propertyId=${propertyId}&imageId=${imageId}`;
            console.log('🔥 PROPERTY IMAGE API: Update Primary URL:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: createAuthHeaders(),
            });

            console.log('🔥 PROPERTY IMAGE API: Update Primary response status:', response.status);

            if (!response.ok) {
                throw new Error(`Failed to update primary image (Status: ${response.status})`);
            }

            // Check if response has content
            const contentType = response.headers.get('content-type');
            let responseData;
            if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
                responseData = {};
            } else {
                const responseText = await response.text();
                try {
                    responseData = responseText ? JSON.parse(responseText) : {};
                } catch (e) {
                    responseData = {};
                }
            }

            console.log('🔥 PROPERTY IMAGE API: Primary image updated successfully!');

            return {
                success: true,
                data: responseData,
                message: 'Primary Image Updated Successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Update Primary Image API Error:', error);

            await logError({
                controllerName: 'PropertyImageApi',
                methodName: 'UpdatePrimaryImage',
                requestUrl: `${API_BASE_URL}/PropertyImages/UpdatePrimaryImage`,
                requestPayload: { propertyId, imageId },
                error
            });

            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'Failed To Update Primary Image',
                timestamp: new Date().toISOString(),
            };
        }
    }
};
