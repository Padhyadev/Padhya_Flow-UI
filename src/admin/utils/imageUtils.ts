/**
 * Image Utility Functions
 * 
 * This module provides utilities for handling image data in different formats:
 * - Binary data (byte arrays from backend)
 * - Base64 encoded strings
 * - Regular URL strings
 * 
 * It also handles memory management for blob URLs to prevent memory leaks.
 */

/**
 * Converts binary image data (byte array or base64 string) to a browser-readable URL
 * 
 * @param binaryData - Image data as number[] (byte array) or base64 string
 * @returns Object URL (blob:) that can be used in img src, or null if conversion fails
 * 
 * @example
 * // From byte array
 * const url = convertBinaryToImageUrl([255, 216, 255, ...]);
 * 
 * // From base64 string
 * const url = convertBinaryToImageUrl('data:image/png;base64,iVBORw0KGgo...');
 */
export function convertBinaryToImageUrl(binaryData: number[] | string | null | undefined): string | null {
    if (!binaryData) {
        return null;
    }

    try {
        // Handle base64 string (data:image/... or plain base64)
        if (typeof binaryData === 'string') {
            // If it's already a data URL, return as-is
            if (binaryData.startsWith('data:image/')) {
                return binaryData;
            }

            // If it's a plain base64 string, convert to data URL
            // Assume JPEG format by default (most common)
            return `data:image/jpeg;base64,${binaryData}`;
        }

        // Handle byte array (number[])
        if (Array.isArray(binaryData)) {
            // Convert number array to Uint8Array
            const uint8Array = new Uint8Array(binaryData);

            // Detect image type from magic bytes (first few bytes)
            let mimeType = 'image/jpeg'; // Default

            if (uint8Array.length >= 2) {
                // PNG: 89 50 4E 47
                if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50) {
                    mimeType = 'image/png';
                }
                // JPEG: FF D8 FF
                else if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8) {
                    mimeType = 'image/jpeg';
                }
                // GIF: 47 49 46
                else if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49) {
                    mimeType = 'image/gif';
                }
                // WebP: 52 49 46 46
                else if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49) {
                    mimeType = 'image/webp';
                }
            }

            // Create Blob from byte array
            const blob = new Blob([uint8Array], { type: mimeType });

            // Create and return object URL
            const objectUrl = URL.createObjectURL(blob);

            console.log('🖼️ Created blob URL from binary data:', {
                mimeType,
                blobSize: blob.size,
                objectUrl: objectUrl.substring(0, 50) + '...'
            });

            return objectUrl;
        }

        console.warn('🖼️ Unsupported binary data format:', typeof binaryData);
        return null;

    } catch (error) {
        console.error('🖼️ Error converting binary to image URL:', error);
        return null;
    }
}

/**
 * Type guard to check if data is in binary format (byte array or base64)
 * 
 * @param data - Data to check
 * @returns true if data is binary format, false otherwise
 */
export function isImageBinary(data: any): data is number[] | string {
    if (!data) return false;

    // Check if it's a byte array
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
        return true;
    }

    // Check if it's a base64 string (without data: prefix)
    if (typeof data === 'string' && !data.startsWith('http') && !data.startsWith('blob:')) {
        // Base64 strings typically contain only alphanumeric, +, /, and =
        return /^[A-Za-z0-9+/=]+$/.test(data) || data.startsWith('data:image/');
    }

    return false;
}

/**
 * Safely revokes an object URL to free memory
 * Only revokes blob: URLs, ignores http/https URLs
 * 
 * @param url - URL to revoke
 * 
 * @example
 * const blobUrl = URL.createObjectURL(blob);
 * // ... use the URL ...
 * revokeImageUrl(blobUrl); // Clean up when done
 */
export function revokeImageUrl(url: string | null | undefined): void {
    if (!url) return;

    // Only revoke blob URLs (object URLs)
    if (url.startsWith('blob:')) {
        try {
            URL.revokeObjectURL(url);
            console.log('🖼️ Revoked blob URL:', url.substring(0, 50) + '...');
        } catch (error) {
            console.error('🖼️ Error revoking blob URL:', error);
        }
    }
}

/**
 * Main helper function to get a displayable image URL from any format
 * Handles:
 * - Regular URL strings (http://, https://)
 * - Blob URLs (blob:)
 * - Binary data (byte arrays)
 * - Base64 strings
 * - null/undefined
 * 
 * @param imageData - Image data in any supported format
 * @returns Displayable URL string, or empty string if no valid data
 * 
 * @example
 * // In a React component
 * const imageUrl = getImageUrl(service.imageBinary || service.imageUrl);
 * <img src={imageUrl} alt="Service" />
 */
export function getImageUrl(imageData: string | number[] | null | undefined): string {
    if (!imageData) {
        return '';
    }

    // If it's already a URL string (http, https, blob, data:)
    if (typeof imageData === 'string') {
        if (imageData.startsWith('http') ||
            imageData.startsWith('blob:') ||
            imageData.startsWith('data:image/')) {
            return imageData;
        }

        // If it's a base64 string without prefix, convert it
        if (isImageBinary(imageData)) {
            return convertBinaryToImageUrl(imageData) || '';
        }

        // Otherwise, assume it's a relative URL
        return imageData;
    }

    // If it's binary data (byte array), convert it
    if (isImageBinary(imageData)) {
        return convertBinaryToImageUrl(imageData) || '';
    }

    return '';
}

/**
 * Hook-style function to manage image URLs with automatic cleanup
 * Use this in React components to automatically clean up blob URLs
 * 
 * @param imageData - Image data in any supported format
 * @returns Tuple of [imageUrl, cleanupFunction]
 * 
 * @example
 * const [imageUrl, cleanup] = useImageUrl(service.imageBinary);
 * 
 * useEffect(() => {
 *     return cleanup; // Cleanup on unmount
 * }, [cleanup]);
 */
export function useImageUrl(imageData: string | number[] | null | undefined): [string, () => void] {
    const url = getImageUrl(imageData);

    const cleanup = () => {
        if (url && url.startsWith('blob:')) {
            revokeImageUrl(url);
        }
    };

    return [url, cleanup];
}
