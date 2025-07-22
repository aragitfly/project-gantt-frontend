const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface BackendProject {
  name: string;
  item_id: string;
  activity_type: string;
  is_title: boolean;
  start_date: string | null;
  end_date: string | null;
  team: string;
  status: string;
  completed: number;
}

export interface BackendResponse {
  projects: BackendProject[];
  message?: string;
}

export class ApiService {
  static async uploadExcel(file: File): Promise<BackendResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-excel`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload Excel file');
    }

    return await response.json();
  }

  static async processAudio(audioBlob: Blob): Promise<any> {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.wav');

    const response = await fetch(`${API_BASE_URL}/process-audio`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to process audio');
    }

    return await response.json();
  }

  static async updateExcel(updates: any[]): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/update-excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update Excel file');
    }

    return await response.json();
  }

  static async downloadExcel(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/download-excel`);
    
    if (!response.ok) {
      throw new Error('Failed to download Excel file');
    }

    return await response.blob();
  }
} 