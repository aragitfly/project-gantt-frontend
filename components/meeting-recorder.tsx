"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, Play, Pause, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { Task, Meeting, DesignTheme } from "../app/page"
import { ApiService } from "@/lib/api"

// Demo meeting recordings for demonstration
const demoMeetings: Meeting[] = [
  {
    id: "demo-1",
    title: "Sprint Planning - Q1 2024",
    date: new Date("2024-01-15T10:00:00"),
    duration: 1847, // 30 minutes 47 seconds
    transcript: `Sarah: Good morning everyone, let's start our sprint planning for Q1 2024. We have several key features to discuss.

Mike: Thanks Sarah. I've been working on the user authentication system. It's about 80% complete, but I'm running into some issues with the password reset functionality.

Lisa: On the frontend side, I've finished the dashboard mockups. The client approved them yesterday. I'm ready to start implementation once the API endpoints are ready.

Tom: I can have the user management APIs ready by Wednesday. The database schema is already updated on staging.

Sarah: Great. What about the mobile app progress?

Lisa: The mobile wireframes are done. I estimate 2 weeks for the core features once we finalize the design system.

Mike: I found a security vulnerability in the current auth flow. We need to address this before launch.

Sarah: That's critical. Let's prioritize the security fix. Can you have it resolved by Friday?

Mike: Yes, I'll work on it today and tomorrow.

Tom: I'll help with testing the security patches.

Sarah: Perfect. Let's also discuss the new reporting feature the client requested.`,
    summary:
      "Sprint planning meeting covering Q1 2024 priorities. Team discussed user authentication progress (80% complete), approved dashboard mockups, mobile app timeline (2 weeks for core features), and identified a critical security vulnerability that needs immediate attention. Key decisions made on prioritization and resource allocation.",
    taskProposals: [
      {
        id: "proposal-1",
        type: "update" as const,
        taskId: "task-1",
        field: "status",
        currentValue: "in-progress",
        proposedValue: "blocked",
        reason: "Security vulnerability discovered in authentication flow",
        confidence: 0.9,
        timestamp: new Date("2024-01-15T10:15:00"),
      },
      {
        id: "proposal-2",
        type: "create" as const,
        task: {
          id: "new-task-1",
          title: "Fix authentication security vulnerability",
          description: "Address critical security issue in password reset functionality",
          status: "todo" as const,
          priority: "high" as const,
          assignee: "Mike Johnson",
          dueDate: new Date("2024-01-19T17:00:00"),
          tags: ["security", "critical", "auth"],
          dependencies: [],
        },
        reason: "Critical security vulnerability identified during sprint planning",
        confidence: 0.95,
        timestamp: new Date("2024-01-15T10:20:00"),
      },
      {
        id: "proposal-3",
        type: "update" as const,
        taskId: "task-3",
        field: "dueDate",
        currentValue: "2024-01-20",
        proposedValue: "2024-01-17",
        reason: "API endpoints needed earlier to unblock frontend development",
        confidence: 0.8,
        timestamp: new Date("2024-01-15T10:25:00"),
      },
    ],
  },
  {
    id: "demo-2",
    title: "Client Review - Dashboard Features",
    date: new Date("2024-01-12T14:00:00"),
    duration: 2156, // 35 minutes 56 seconds
    transcript: `Jennifer: Thank you for joining us today. We're excited to show you the progress on the dashboard features.

Client (John): Great, I'm looking forward to seeing what the team has built.

Jennifer: Sarah will walk you through the new analytics dashboard, and then Mike will demo the user management features.

Sarah: Thanks Jennifer. As you can see, we've implemented the real-time analytics you requested. The dashboard shows user engagement, conversion rates, and system performance metrics.

Client (John): This looks fantastic. The charts are exactly what we envisioned. How's the performance with large datasets?

Sarah: We've tested with up to 100,000 data points and response times are under 2 seconds. We're using efficient caching strategies.

Client (John): Excellent. What about the mobile responsiveness?

Sarah: The dashboard is fully responsive. Let me show you how it looks on tablet and mobile devices.

Mike: Now I'll show you the user management system. Admins can create, edit, and deactivate users. We've also added role-based permissions.

Client (John): Perfect. I noticed the export functionality we discussed - is that implemented?

Mike: Yes, users can export data in CSV, Excel, and PDF formats. The reports include all the metrics you specified.

Client (John): This is great work. I do have one concern about the color scheme. Can we make it more aligned with our brand colors?

Sarah: Absolutely. I can update the theme to match your brand guidelines. Should take about a day.

Client (John): Wonderful. When can we expect the beta version?

Jennifer: Based on today's feedback, we can have the beta ready by next Friday.`,
    summary:
      "Client review meeting showcasing dashboard analytics and user management features. Client expressed satisfaction with real-time analytics, performance (sub-2 second response times), mobile responsiveness, and export functionality. Minor feedback on brand color alignment. Beta version scheduled for next Friday delivery.",
    taskProposals: [
      {
        id: "proposal-4",
        type: "create" as const,
        task: {
          id: "new-task-2",
          title: "Update dashboard theme to match client brand colors",
          description: "Modify color scheme and styling to align with client's brand guidelines",
          status: "todo" as const,
          priority: "medium" as const,
          assignee: "Sarah Wilson",
          dueDate: new Date("2024-01-13T17:00:00"),
          tags: ["design", "branding", "dashboard"],
          dependencies: [],
        },
        reason: "Client requested brand color alignment during review meeting",
        confidence: 0.9,
        timestamp: new Date("2024-01-12T14:30:00"),
      },
      {
        id: "proposal-5",
        type: "update" as const,
        taskId: "task-5",
        field: "status",
        currentValue: "in-progress",
        proposedValue: "completed",
        reason: "Export functionality demo confirmed all requirements are met",
        confidence: 0.85,
        timestamp: new Date("2024-01-12T14:45:00"),
      },
    ],
  },
  {
    id: "demo-3",
    title: "Technical Architecture Review",
    date: new Date("2024-01-10T09:00:00"),
    duration: 2734, // 45 minutes 34 seconds
    transcript: `David: Good morning team. Today we're reviewing our technical architecture and discussing scalability concerns.

Mike: I've been analyzing our current database performance. We're seeing some bottlenecks during peak usage hours.

Tom: The API response times have increased by 15% over the past month. I think we need to implement caching.

David: What's causing the performance degradation?

Mike: Mainly complex queries on the analytics tables. The user activity tracking is generating a lot of data.

Sarah: From the frontend perspective, we're also seeing slower page loads, especially on the dashboard.

Tom: I recommend implementing Redis for caching frequently accessed data. It should improve response times significantly.

David: Good suggestion. What's the implementation timeline?

Tom: I can have a basic caching layer ready in 3 days. Full optimization might take a week.

Mike: We should also consider database indexing improvements. Some of our queries aren't optimized.

David: Agreed. Let's prioritize both caching and database optimization.

Sarah: Should we also look into CDN implementation for static assets?

David: Yes, that's a good point. It will help with global performance.

Tom: I can research CDN options and provide recommendations by Thursday.

Mike: One more thing - we need to address the backup strategy. Current backups are taking too long.

David: Critical point. Let's schedule a separate meeting to discuss disaster recovery planning.`,
    summary:
      "Technical architecture review identifying performance bottlenecks and scalability solutions. Key issues: 15% increase in API response times, database query optimization needed, and backup strategy concerns. Proposed solutions include Redis caching implementation (3-7 days), database indexing improvements, CDN for static assets, and enhanced disaster recovery planning.",
    taskProposals: [
      {
        id: "proposal-6",
        type: "create" as const,
        task: {
          id: "new-task-3",
          title: "Implement Redis caching layer",
          description: "Set up Redis caching for frequently accessed data to improve API response times",
          status: "todo" as const,
          priority: "high" as const,
          assignee: "Tom Chen",
          dueDate: new Date("2024-01-17T17:00:00"),
          tags: ["performance", "caching", "backend"],
          dependencies: [],
        },
        reason: "API response times increased by 15%, caching needed for performance optimization",
        confidence: 0.92,
        timestamp: new Date("2024-01-10T09:20:00"),
      },
      {
        id: "proposal-7",
        type: "create" as const,
        task: {
          id: "new-task-4",
          title: "Database query optimization and indexing",
          description: "Optimize complex analytics queries and improve database indexing strategy",
          status: "todo" as const,
          priority: "high" as const,
          assignee: "Mike Johnson",
          dueDate: new Date("2024-01-18T17:00:00"),
          tags: ["database", "performance", "optimization"],
          dependencies: [],
        },
        reason: "Database bottlenecks identified during peak usage hours",
        confidence: 0.88,
        timestamp: new Date("2024-01-10T09:25:00"),
      },
      {
        id: "proposal-8",
        type: "create" as const,
        task: {
          id: "new-task-5",
          title: "Research and implement CDN solution",
          description: "Evaluate CDN options and implement solution for static asset delivery",
          status: "todo" as const,
          priority: "medium" as const,
          assignee: "Tom Chen",
          dueDate: new Date("2024-01-18T17:00:00"),
          tags: ["performance", "cdn", "infrastructure"],
          dependencies: [],
        },
        reason: "CDN implementation needed for improved global performance",
        confidence: 0.75,
        timestamp: new Date("2024-01-10T09:35:00"),
      },
    ],
  },
]

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
  const [demoMeetingsVisible, setDemoMeetingsVisible] = useState(true)

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
          sampleRate: 44100,
        },
      })
      streamRef.current = stream
      audioChunksRef.current = []
      // Create MediaRecorder - try WAV first, fallback to WebM
      let mediaRecorder
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/wav",
        })
        console.log("Using WAV format for recording")
      } catch (e) {
        // Fallback to WebM if WAV is not supported
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        })
        console.log("Using WebM format for recording (WAV not supported)")
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.ondataavailable = (event) => {
        console.log("Data available:", event.data.size, "bytes")
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
        streamRef.current.getTracks().forEach((track) => track.stop())
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
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })

      console.log("Audio chunks count:", audioChunksRef.current.length)
      console.log("Audio blob created:", audioBlob.size, "bytes, type:", audioBlob.type)

      if (audioBlob.size === 0) {
        throw new Error("No audio data recorded")
      }
      toast.info("Processing audio...")
      console.log("Audio blob size:", audioBlob.size, "type:", audioBlob.type)
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
        streamRef.current.getTracks().forEach((track) => track.stop())
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
                isRecording && !isPaused
                  ? "bg-red-500 animate-pulse"
                  : isProcessing
                    ? "bg-blue-500 animate-pulse"
                    : "bg-gray-300"
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
              <Button onClick={startRecording} disabled={!meetingTitle.trim() || !isSupported || isProcessing}>
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={pauseRecording} disabled={isProcessing}>
                  {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button variant="destructive" onClick={stopRecording} disabled={isProcessing}>
                  <Square className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Stop & Analyze"}
                </Button>
              </>
            )}
          </div>
        </div>

        {demoMeetingsVisible && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Demo Meeting Recordings</h3>
              <Button variant="outline" size="sm" onClick={() => setDemoMeetingsVisible(false)}>
                Hide Demos
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Sample meeting recordings showing AI analysis results. Click "Process Demo" to see how task proposals are
              generated.
            </p>

            <div className="grid gap-4">
              {demoMeetings.map((meeting) => (
                <div key={meeting.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{meeting.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {meeting.date.toLocaleDateString()} • {formatTime(meeting.duration)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onMeetingComplete(meeting)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Process Demo
                    </Button>
                  </div>

                  <div className="text-sm">
                    <p className="font-medium mb-1">Summary:</p>
                    <p className="text-muted-foreground line-clamp-2">{meeting.summary}</p>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="outline">{meeting.taskProposals.length} Task Proposals</Badge>
                    <Badge variant="outline">{meeting.transcript.split(" ").length} words transcribed</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!demoMeetingsVisible && (
          <div className="border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => setDemoMeetingsVisible(true)}>
              Show Demo Recordings
            </Button>
          </div>
        )}

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
