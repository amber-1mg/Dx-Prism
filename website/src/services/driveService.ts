export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  createdTime: string;
}

const FOLDER_ID = '1H7wsT3O3fS8oquQWRqV-H9hKgO9Lyd1U';

export const fetchReportsFromDrive = async (accessToken: string): Promise<DriveFile[]> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,webViewLink,thumbnailLink,createdTime)&orderBy=createdTime+desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch files from Google Drive');
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error fetching drive files:', error);
    throw error;
  }
};
