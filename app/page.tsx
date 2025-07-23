"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, List, BarChart3, Upload, Mic, FileText, Download } from "lucide-react"
import * as XLSX from "xlsx"
import { MeetingRecorder } from "../components/meeting-recorder"
import { TaskManager } from "../components/task-manager"
import { MeetingSummary } from "../components/meeting-summary"
import { DesignSelector } from "../components/design-selector"
import { ApiService } from "../lib/api"
import { convertBackendToHierarchicalTasks, convertV0ToBackendUpdate } from "../lib/data-converter"

export interface Task {
  id: string
  name: string
  startDate: Date
  endDate: Date
  duration: number
  progress: number
  assignee?: string
  priority: "Low" | "Medium" | "High"
  status: "Not Started" | "In Progress" | "Completed" | "Delayed" | "Blocked"
  dependencies?: string[]
  auditTrail: AuditEntry[]
  proposedChanges?: TaskProposal
  // Hierarchical properties
  parentId?: string
  level: number // 0 = main activity, 1+ = subactivity
  isExpanded?: boolean
  children?: Task[]
  type: "main" | "sub"
}

export interface AuditEntry {
  id: string
  timestamp: Date
  type: "manual" | "meeting" | "system"
  field: string
  oldValue: any
  newValue: any
  reason?: string
  meetingId?: string
  userId?: string
}

export interface TaskProposal {
  id: string
  taskId: string
  proposedStatus?: Task["status"]
  proposedProgress?: number
  proposedEndDate?: Date
  reason: string
  confidence: number
  meetingId: string
  timestamp: Date
}

export interface Meeting {
  id: string
  title: string
  date: Date
  duration: number
  transcript: string
  summary: string
  taskProposals: TaskProposal[]
  audioBlob?: Blob
}

export type DesignTheme = "default" | "modern" | "minimal" | "corporate" | "dark"

export default function ProjectManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [activeTab, setActiveTab] = useState("gantt")
  const [currentTheme, setCurrentTheme] = useState<DesignTheme>("default")

  // Sample hierarchical data for demonstration
  const sampleTasks: Task[] = [
    {
      id: "1",
      name: "Project Planning",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-20"),
      duration: 20,
      progress: 85,
      assignee: "Project Manager",
      priority: "High",
      status: "In Progress",
      level: 0,
      type: "main",
      isExpanded: true,
      auditTrail: [
        {
          id: "audit-1",
          timestamp: new Date("2024-01-01"),
          type: "manual",
          field: "status",
          oldValue: "Not Started",
          newValue: "In Progress",
          reason: "Project kickoff",
        },
      ],
    },
    {
      id: "1.1",
      name: "Define Project Scope",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-05"),
      duration: 5,
      progress: 100,
      assignee: "John Doe",
      priority: "High",
      status: "Completed",
      parentId: "1",
      level: 1,
      type: "sub",
      auditTrail: [
        {
          id: "audit-1.1",
          timestamp: new Date("2024-01-05"),
          type: "manual",
          field: "status",
          oldValue: "In Progress",
          newValue: "Completed",
          reason: "Scope document approved",
        },
      ],
    },
    {
      id: "1.2",
      name: "Create Project Charter",
      startDate: new Date("2024-01-06"),
      endDate: new Date("2024-01-12"),
      duration: 7,
      progress: 90,
      assignee: "Jane Smith",
      priority: "High",
      status: "In Progress",
      parentId: "1",
      level: 1,
      type: "sub",
      auditTrail: [
        {
          id: "audit-1.2",
          timestamp: new Date("2024-01-06"),
          type: "manual",
          field: "status",
          oldValue: "Not Started",
          newValue: "In Progress",
          reason: "Started charter development",
        },
      ],
    },
    {
      id: "1.3",
      name: "Stakeholder Analysis",
      startDate: new Date("2024-01-10"),
      endDate: new Date("2024-01-20"),
      duration: 10,
      progress: 60,
      assignee: "Mike Johnson",
      priority: "Medium",
      status: "In Progress",
      parentId: "1",
      level: 1,
      type: "sub",
      auditTrail: [
        {
          id: "audit-1.3",
          timestamp: new Date("2024-01-10"),
          type: "manual",
          field: "status",
          oldValue: "Not Started",
          newValue: "In Progress",
          reason: "Stakeholder interviews started",
        },
      ],
    },
    {
      id: "2",
      name: "Requirements Gathering",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-02-10"),
      duration: 26,
      progress: 40,
      assignee: "Business Analyst",
      priority: "High",
      status: "In Progress",
      level: 0,
      type: "main",
      isExpanded: true,
      auditTrail: [
        {
          id: "audit-2",
          timestamp: new Date("2024-01-15"),
          type: "manual",
          field: "status",
          oldValue: "Not Started",
          newValue: "In Progress",
          reason: "Requirements phase started",
        },
      ],
    },
    {
      id: "2.1",
      name: "Functional Requirements",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-01-25"),
      duration: 10,
      progress: 80,
      assignee: "Sarah Wilson",
      priority: "High",
      status: "In Progress",
      parentId: "2",
      level: 1,
      type: "sub",
      auditTrail: [
        {
          id: "audit-2.1",
          timestamp: new Date("2024-01-15"),
          type: "manual",
          field: "status",
          oldValue: "Not Started",
          newValue: "In Progress",
          reason: "Functional analysis started",
        },
      ],
    },
    {
      id: "2.2",
      name: "Non-Functional Requirements",
      startDate: new Date("2024-01-20"),
      endDate: new Date("2024-02-05"),
      duration: 16,
      progress: 30,
      assignee: "Tom Brown",
      priority: "Medium",
      status: "In Progress",
      parentId: "2",
      level: 1,
      type: "sub",
      auditTrail: [
        {
          id: "audit-2.2",
          timestamp: new Date("2024-01-20"),
          type: "manual",
          field: "status",
          oldValue: "Not Started",
          newValue: "In Progress",
          reason: "Performance requirements analysis",
        },
      ],
    },
    {
      id: "2.3",
      name: "Requirements Documentation",
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-02-10"),
      duration: 9,
      progress: 0,
      assignee: "Lisa Davis",
      priority: "Medium",
      status: "Not Started",
      parentId: "2",
      level: 1,
      type: "sub",
      auditTrail: [
        {
          id: "audit-2.3",
          timestamp: new Date("2024-02-01"),
          type: "system",
          field: "created",
          oldValue: null,
          newValue: "task created",
          reason: "Initial task creation",
        },
      ],
    },
    {
      id: "3",
      name: "Design Phase",
      startDate: new Date("2024-02-05"),
      endDate: new Date("2024-03-15"),
      duration: 38,
      progress: 15,
      assignee: "Design Team",
      priority: "High",
      status: "Delayed",
      level: 0,
      type: "main",
      isExpanded: false,
      auditTrail: [
        {
          id: "audit-3",
          timestamp: new Date("2024-02-05"),
          type: "meeting",
          field: "status",
          oldValue: "Not Started",
          newValue: "Delayed",
          reason: "Waiting for requirements completion",
          meetingId: "meeting-1",
        },
      ],
    },
    {
      id: "3.1",
      name: "UI/UX Design",
      startDate: new Date("2024-02-05"),
      endDate: new Date("2024-02-25"),
      duration: 20,
      progress: 25,
      assignee: "Alex Chen",
      priority: "High",
      status: "Delayed",
      parentId: "3",
      level: 1,
      type: "sub",
      auditTrail: [
        {
          id: "audit-3.1",
          timestamp: new Date("2024-02-05"),
          type: "manual",
          field: "status",
          oldValue: "Not Started",
          newValue: "Delayed",
          reason: "Waiting for requirements",
        },
      ],
    },
    {
      id: "3.2",
      name: "System Architecture",
      startDate: new Date("2024-02-10"),
      endDate: new Date("2024-03-05"),
      duration: 23,
      progress: 10,
      assignee: "David Kim",
      priority: "High",
      status: "Not Started",
      parentId: "3",
      level: 1,
      type: "sub",
      auditTrail: [
        {
          id: "audit-3.2",
          timestamp: new Date("2024-02-10"),
          type: "system",
          field: "created",
          oldValue: null,
          newValue: "task created",
          reason: "Initial task creation",
        },
      ],
    },
  ]

  const apiService = new ApiService()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload an Excel file (.xlsx or .xls)')
      return
    }

    setFileName(file.name)

    try {
      // Upload to backend
      const response = await apiService.uploadExcel(file)
      
      // Convert backend response to hierarchical format
      const hierarchicalTasks = convertBackendToHierarchicalTasks(response.projects)
      
      // Debug: Log the data at each step
      console.log('=== DEBUG INFO ===')
      console.log('Backend response:', response)
      console.log('Projects from backend:', response.projects.length)
      console.log('Main tasks from backend:', response.projects.filter((p: any) => p.is_title).length)
      console.log('Sub tasks from backend:', response.projects.filter((p: any) => !p.is_title).length)
      console.log('Sample main tasks:', response.projects.filter((p: any) => p.is_title).slice(0, 2))
      console.log('Sample sub tasks:', response.projects.filter((p: any) => !p.is_title).slice(0, 2))
      
      console.log('Hierarchical tasks after conversion:', hierarchicalTasks.length)
      console.log('Main tasks after conversion:', hierarchicalTasks.filter(t => t.level === 0).length)
      console.log('Sample hierarchical tasks:', hierarchicalTasks.slice(0, 2))
      console.log('=== END DEBUG ===')
      
      setTasks(hierarchicalTasks)
    } catch (error) {
      console.error('Error uploading Excel file:', error)
      alert('Error uploading Excel file. Please ensure the backend is running and try again.')
    }
  }

  const loadSampleData = () => {
    setTasks(sampleTasks)
    setFileName("sample-hierarchical-project.xlsx")
  }

  const handleDownloadExcel = async () => {
    try {
      const blob = await apiService.downloadExcel()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'updated_gantt_chart.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      console.log('Successfully downloaded updated Excel file')
    } catch (error) {
      console.error('Error downloading Excel file:', error)
      alert('Error downloading Excel file. Please try again.')
    }
  }

  const toggleTaskExpansion = (taskId: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, isExpanded: !task.isExpanded } : task)))
  }

  const getVisibleTasks = () => {
    // Return all tasks so TaskManager can handle the hierarchical display
    return tasks
  }

  const handleMeetingComplete = (meeting: Meeting) => {
    setMeetings((prev) => [...prev, meeting])

          const updatedTasks = tasks.map((task) => {
        const proposal = meeting.taskProposals.find((p: TaskProposal) => p.taskId === task.id)
        if (proposal) {
          return {
            ...task,
            proposedChanges: proposal,
          }
        }
        return task
      })

    setTasks(updatedTasks)
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>, reason: string) => {
    try {
      // Convert v0 updates to backend format
      const backendUpdate = convertV0ToBackendUpdate(taskId, updates, reason)
      
      // Send update to backend
      await apiService.updateExcel([backendUpdate])
      
      // Update local state
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) {
            const auditEntries: AuditEntry[] = []

            Object.entries(updates).forEach(([field, newValue]) => {
              if (field !== "auditTrail" && task[field as keyof Task] !== newValue) {
                auditEntries.push({
                  id: `audit-${Date.now()}-${field}`,
                  timestamp: new Date(),
                  type: "manual",
                  field,
                  oldValue: task[field as keyof Task],
                  newValue,
                  reason,
                })
              }
            })

            return {
              ...task,
              ...updates,
              auditTrail: [...task.auditTrail, ...auditEntries],
              proposedChanges: undefined,
            }
          }
          return task
        }),
      )
      
      console.log('Successfully updated task', taskId, 'in backend')
    } catch (error) {
      console.error('Error updating task in backend:', error)
      alert('Error updating task. Please try again.')
    }
  }

  const handleReorderTasks = async (parentId: string, taskIds: string[]) => {
    try {
      // Create audit entries for the reorder
      const auditEntries: AuditEntry[] = taskIds.map((taskId: string, index: number) => ({
        id: `audit-${Date.now()}-reorder-${taskId}`,
        timestamp: new Date(),
        type: "manual",
        field: "order",
        oldValue: `Previous position in parent ${parentId}`,
        newValue: `New position ${index + 1} in parent ${parentId}`,
        reason: "Task reordered via drag and drop",
      }))

      // Update local state to reflect the new order
      setTasks((prev) => {
        const updatedTasks = [...prev]
        
        // Get all tasks that belong to this parent
        const parentTasks = updatedTasks.filter(task => task.parentId === parentId && task.level === 1)
        
        // Reorder the tasks based on the new order
        taskIds.forEach((taskId, newIndex) => {
          const taskIndex = updatedTasks.findIndex(task => task.id === taskId)
          if (taskIndex !== -1) {
            // Add audit entry to the task
            updatedTasks[taskIndex] = {
              ...updatedTasks[taskIndex],
              auditTrail: [...updatedTasks[taskIndex].auditTrail, auditEntries[newIndex]]
            }
          }
        })

        return updatedTasks
      })

      console.log('Successfully reordered tasks for parent', parentId)
    } catch (error) {
      console.error('Error reordering tasks:', error)
      alert('Error reordering tasks. Please try again.')
    }
  }

  const getThemeClasses = () => {
    switch (currentTheme) {
      case "modern":
        return {
          container: "bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen",
          card: "bg-white/80 backdrop-blur-sm border-0 shadow-xl",
          header: "bg-gradient-to-r from-blue-600 to-purple-600 text-white",
          accent: "text-blue-600",
        }
      case "minimal":
        return {
          container: "bg-gray-50 min-h-screen",
          card: "bg-white border border-gray-200 shadow-sm",
          header: "bg-white border-b border-gray-200",
          accent: "text-gray-900",
        }
      case "corporate":
        return {
          container: "bg-slate-100 min-h-screen",
          card: "bg-white border border-slate-300 shadow-md",
          header: "bg-slate-800 text-white",
          accent: "text-slate-700",
        }
      case "dark":
        return {
          container: "bg-gray-900 min-h-screen text-white",
          card: "bg-gray-800 border border-gray-700 shadow-xl",
          header: "bg-gray-800 border-b border-gray-700 text-white",
          accent: "text-blue-400",
        }
      default:
        return {
          container: "bg-background min-h-screen",
          card: "bg-card",
          header: "bg-background",
          accent: "text-primary",
        }
    }
  }

  const themeClasses = getThemeClasses()

  const getPriorityColor = (priority: string) => {
    const colors = {
      default: {
        High: "bg-red-500",
        Medium: "bg-yellow-500",
        Low: "bg-green-500",
      },
      modern: {
        High: "bg-gradient-to-r from-red-500 to-pink-500",
        Medium: "bg-gradient-to-r from-yellow-500 to-orange-500",
        Low: "bg-gradient-to-r from-green-500 to-emerald-500",
      },
      minimal: {
        High: "bg-gray-800",
        Medium: "bg-gray-600",
        Low: "bg-gray-400",
      },
      corporate: {
        High: "bg-red-600",
        Medium: "bg-amber-600",
        Low: "bg-green-600",
      },
      dark: {
        High: "bg-red-400",
        Medium: "bg-yellow-400",
        Low: "bg-green-400",
      },
    }
    return (
      colors[currentTheme]?.[priority as keyof typeof colors.default] ||
      colors.default[priority as keyof typeof colors.default] ||
      "bg-gray-500"
    )
  }

  const getStatusColor = (status: string) => {
    const colors = {
      default: {
        Completed: "bg-green-100 text-green-800",
        "In Progress": "bg-blue-100 text-blue-800",
        "Not Started": "bg-gray-100 text-gray-800",
        Delayed: "bg-orange-100 text-orange-800",
        Blocked: "bg-red-100 text-red-800",
      },
      modern: {
        Completed: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800",
        "In Progress": "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800",
        "Not Started": "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800",
        Delayed: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800",
        Blocked: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800",
      },
      minimal: {
        Completed: "bg-gray-100 text-gray-800 border border-gray-300",
        "In Progress": "bg-gray-50 text-gray-700 border border-gray-300",
        "Not Started": "bg-white text-gray-600 border border-gray-300",
        Delayed: "bg-gray-100 text-gray-800 border border-gray-400",
        Blocked: "bg-gray-200 text-gray-900 border border-gray-400",
      },
      corporate: {
        Completed: "bg-green-50 text-green-700 border border-green-200",
        "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
        "Not Started": "bg-slate-50 text-slate-700 border border-slate-200",
        Delayed: "bg-amber-50 text-amber-700 border border-amber-200",
        Blocked: "bg-red-50 text-red-700 border border-red-200",
      },
      dark: {
        Completed: "bg-green-900/50 text-green-300 border border-green-700",
        "In Progress": "bg-blue-900/50 text-blue-300 border border-blue-700",
        "Not Started": "bg-gray-800 text-gray-300 border border-gray-600",
        Delayed: "bg-orange-900/50 text-orange-300 border border-orange-700",
        Blocked: "bg-red-900/50 text-red-300 border border-red-700",
      },
    }
    return (
      colors[currentTheme]?.[status as keyof typeof colors.default] ||
      colors.default[status as keyof typeof colors.default] ||
      "bg-gray-100 text-gray-800"
    )
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getTaskPosition = (task: Task) => {
    if (tasks.length === 0) return { left: 0, width: 0 }

    const allDates = tasks.flatMap((t) => [t.startDate, t.endDate])
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))
    const totalDuration = maxDate.getTime() - minDate.getTime()

    const startOffset = task.startDate.getTime() - minDate.getTime()
    const taskDuration = task.endDate.getTime() - task.startDate.getTime()

    const left = (startOffset / totalDuration) * 100
    const width = (taskDuration / totalDuration) * 100

    return { left: `${left}%`, width: `${Math.max(width, 2)}%` }
  }

  return (
    <div className={themeClasses.container}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${themeClasses.accent}`}>Project Management Dashboard</h1>
            <p className="text-muted-foreground">
              Import Excel files, record meetings, and track hierarchical project progress with AI insights
            </p>
          </div>
          <div className="flex items-center gap-4">
            <DesignSelector currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
            <div className="flex items-center gap-2">
              <BarChart3 className={`h-8 w-8 ${themeClasses.accent}`} />
            </div>
          </div>
        </div>

        <Card className={themeClasses.card}>
          <CardHeader className={themeClasses.header}>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Excel File
            </CardTitle>
            <CardDescription className={currentTheme === "dark" ? "text-gray-300" : ""}>
              Upload an Excel file with columns: Task Name, Start Date, End Date, Duration, Progress, Assignee,
              Priority, Status, Level, Parent ID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="excel-file">Choose Excel File</Label>
                <Input id="excel-file" type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="mt-1" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Or try sample data</Label>
                <Button onClick={loadSampleData} variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Load Sample
                </Button>
              </div>
            </div>
            {fileName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                Loaded: {fileName}
              </div>
            )}
          </CardContent>
        </Card>

        {tasks.length > 0 && (
          <>
            <MeetingRecorder
              tasks={tasks}
              onMeetingComplete={handleMeetingComplete}
              theme={currentTheme}
              themeClasses={themeClasses}
            />

            {meetings.length > 0 && (
              <MeetingSummary meetings={meetings} theme={currentTheme} themeClasses={themeClasses} />
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className={currentTheme === "dark" ? "bg-gray-800 border-gray-700" : ""}>
                <TabsTrigger value="gantt" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Gantt Chart
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Task Management
                </TabsTrigger>
                <TabsTrigger value="meetings" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Meetings ({meetings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gantt" className="space-y-4">
                <Card className={themeClasses.card}>
                  <CardHeader className={themeClasses.header}>
                    <CardTitle>Project Timeline</CardTitle>
                    <CardDescription className={currentTheme === "dark" ? "text-gray-300" : ""}>
                      Hierarchical view of project tasks and their timelines
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getVisibleTasks().map((task) => {
                        const position = getTaskPosition(task)
                        const isMainActivity = task.level === 0
                        const hasChildren = tasks.some((t) => t.parentId === task.id)

                        return (
                          <div key={task.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div style={{ marginLeft: `${task.level * 20}px` }} className="flex items-center gap-2">
                                  {isMainActivity && hasChildren && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0"
                                      onClick={() => toggleTaskExpansion(task.id)}
                                    >
                                      {task.isExpanded ? "−" : "+"}
                                    </Button>
                                  )}
                                  {!isMainActivity && <div className="w-4" />}
                                  <span className={`font-medium ${isMainActivity ? "text-lg" : "text-sm"}`}>
                                    {task.name}
                                  </span>
                                </div>
                                <Badge variant="outline" className={getStatusColor(task.status)}>
                                  {task.status}
                                </Badge>
                                {task.proposedChanges && (
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                    Pending Changes
                                  </Badge>
                                )}
                              </div>
                              <div className="text-muted-foreground">
                                {formatDate(task.startDate)} - {formatDate(task.endDate)}
                              </div>
                            </div>
                            <div
                              className={`relative rounded ${currentTheme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
                              style={{
                                height: isMainActivity ? "32px" : "24px",
                                marginLeft: `${task.level * 20}px`,
                              }}
                            >
                              <div
                                className={`absolute h-full rounded flex items-center justify-center text-white text-xs font-medium ${
                                  isMainActivity
                                    ? currentTheme === "modern"
                                      ? "bg-gradient-to-r from-blue-600 to-purple-600"
                                      : currentTheme === "dark"
                                        ? "bg-blue-700"
                                        : "bg-primary"
                                    : currentTheme === "modern"
                                      ? "bg-gradient-to-r from-blue-400 to-purple-400"
                                      : currentTheme === "dark"
                                        ? "bg-blue-500"
                                        : "bg-primary/80"
                                }`}
                                style={position}
                              >
                                {task.progress > 0 && `${task.progress}%`}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="list" className="space-y-4">
                <TaskManager
                  tasks={getVisibleTasks()}
                  allTasks={tasks}
                  onTaskUpdate={handleTaskUpdate}
                  onToggleExpansion={toggleTaskExpansion}
                  onReorderTasks={handleReorderTasks}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                  formatDate={formatDate}
                  theme={currentTheme}
                  themeClasses={themeClasses}
                />
              </TabsContent>

              <TabsContent value="meetings" className="space-y-4">
                <Card className={themeClasses.card}>
                  <CardHeader className={themeClasses.header}>
                    <CardTitle>Meeting History</CardTitle>
                    <CardDescription className={currentTheme === "dark" ? "text-gray-300" : ""}>
                      All recorded meetings and their summaries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {meetings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No meetings recorded yet. Start by recording a meeting in the Meeting Recorder section.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {meetings.map((meeting) => (
                          <div
                            key={meeting.id}
                            className={`border rounded-lg p-4 ${currentTheme === "dark" ? "border-gray-700" : ""}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold">{meeting.title}</h3>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(meeting.date)} • {Math.round(meeting.duration / 60)}min
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{meeting.summary}</p>
                            <div className="text-xs text-muted-foreground">
                              {meeting.taskProposals.length} task updates proposed
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {tasks.length === 0 && (
          <Card className={themeClasses.card}>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Project Data</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload an Excel file or load sample data to get started with your hierarchical project management
                dashboard.
              </p>
              <Button onClick={loadSampleData}>Load Sample Data</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
