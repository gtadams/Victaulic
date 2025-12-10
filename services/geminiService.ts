import { UploadedImage } from "../types";

const API_URL = "http://localhost:8000/analyze"; // Your Python Backend URL

export const analyzeImages = async (
  images: UploadedImage[], 
  prompt: string
): Promise<string> => {
  try {
    const formData = new FormData();
    
    // Add the prompt
    formData.append('prompt', prompt);

    // Add all images
    images.forEach((img) => {
      formData.append('files', img.file);
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text; // Assuming your Python returns { "text": "..." }
    
  } catch (error: any) {
    console.error("Backend API Error:", error);
    throw new Error(error.message || "Failed to analyze images.");
  }
};