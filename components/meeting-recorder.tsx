"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, Play, Pause, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { Task, Meeting, TaskProposal, DesignTheme } from "../app/page"
import { ApiService } from "@/lib/api"

interface MeetingRecorderProps {
  tasks: Task[]
  onMeetingComplete: (meeting: Meeting) => void
  theme: DesignTheme
  themeClasses: any
}

export function MeetingRecorder({ tasks, onMeetingComplete, theme, themeClasses }: MeetingRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [meetingTitle, setMeetingTitle] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check if browser supports audio recording
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false)
      setError("Audio recording is not supported in this browser")
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      streamRef.current = stream
      audioChunksRef.current = []
      // Create MediaRecorder - try WAV first, fallback to WebM
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/wav'
        });
        console.log('Using WAV format for recording');
      } catch (e) {
        // Fallback to WebM if WAV is not supported
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        console.log('Using WebM format for recording (WAV not supported)');
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes')
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      mediaRecorder.start(1000)
      setIsRecording(true)
      setIsPaused(false)
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
      toast.success("Recording started")
    } catch (err) {
      console.error("Error starting recording:", err)
      setError("Failed to start recording. Please check microphone permissions.")
      toast.error("Failed to start recording")
    }
  }

  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return

    if (isPaused) {
      // Resume recording
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      toast.success("Recording resumed")
    } else {
      // Pause recording
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      toast.info("Recording paused")
    }
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return

    try {
      setIsProcessing(true)
      mediaRecorderRef.current.stop()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      setIsRecording(false)
      setIsPaused(false)
      await new Promise<void>((resolve) => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.onstop = () => resolve()
        } else {
          resolve()
        }
      })
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      
      console.log('Audio chunks count:', audioChunksRef.current.length)
      console.log('Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type)
      
      if (audioBlob.size === 0) {
        throw new Error("No audio data recorded")
      }
      toast.info("Processing audio...")
      console.log('Audio blob size:', audioBlob.size, 'type:', audioBlob.type)
      const apiService = new ApiService()
      const result = await apiService.processAudio(audioBlob)
      const meeting: Meeting = {
        id: `meeting-${Date.now()}`,
        title: meetingTitle || `Project Meeting - ${new Date().toLocaleDateString()}`,
        date: new Date(),
        duration: recordingTime,
        transcript: result.transcript || "Audio processed successfully",
        summary: result.summary || "Meeting audio has been processed and analyzed.",
        taskProposals: result.taskProposals || [],
      }
      onMeetingComplete(meeting)
      setRecordingTime(0)
      setMeetingTitle("")
      audioChunksRef.current = []
      mediaRecorderRef.current = null
      toast.success("Meeting processed successfully")
    } catch (err) {
      console.error("Error processing audio:", err)
      setError("Failed to process audio. Please try again.")
      toast.error("Failed to process audio")
      // Reset state
      setIsRecording(false)
      setIsPaused(false)
      setRecordingTime(0)
      audioChunksRef.current = []
      mediaRecorderRef.current = null
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className={themeClasses.card}>
      <CardHeader className={themeClasses.header}>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Meeting Recorder
        </CardTitle>
        <CardDescription className={theme === "dark" ? "text-gray-300" : ""}>
          Record project meetings and get AI-powered task status analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="meeting-title">Meeting Title</Label>
          <Input
            id="meeting-title"
            placeholder="Enter meeting title..."
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            disabled={isRecording}
          />
        </div>

        {!isSupported && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Audio recording is not supported in this browser. Please use Chrome, Firefox, or Safari.
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full ${
                isRecording && !isPaused ? "bg-red-500 animate-pulse" :
                isProcessing ? "bg-blue-500 animate-pulse" : "bg-gray-300"
              }`}
            />
            <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
            {isRecording && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {isPaused ? "Paused" : "Recording"}
              </Badge>
            )}
            {isProcessing && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Processing...
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={!meetingTitle.trim() || !isSupported || isProcessing}
              >
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={pauseRecording}
                  disabled={isProcessing}
                >
                  {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={stopRecording}
                  disabled={isProcessing}
                >
                  <Square className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Stop & Analyze"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            <strong>How it works:</strong> Record your project meetings and our AI will automatically analyze the
            discussion to identify task status updates, delays, and blockers. Proposed changes will appear in the Task
            Management section for your review.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
