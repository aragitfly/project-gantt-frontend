const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  async uploadExcel(file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${this.baseUrl}/upload-excel`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error uploading Excel file:', error)
      throw error
    }
  }

  async processAudio(audioBlob: Blob): Promise<any> {
    const formData = new FormData()
    formData.append('audio_file', audioBlob, 'recording.wav')

    try {
      const response = await fetch(`${this.baseUrl}/process-audio`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error processing audio:', error)
      throw error
    }
  }

  async updateExcel(updates: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/update-excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating Excel:', error)
      throw error
    }
  }

  async downloadExcel(): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/download-excel`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.blob()
    } catch (error) {
      console.error('Error downloading Excel:', error)
      throw error
    }
  }
} 