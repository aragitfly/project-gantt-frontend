"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronRight,
  Move,
  ScalingIcon as Resize,
  RotateCcw,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Check,
  X,
  Edit,
  Save,
  SkipForward,
  Brain,
  Clock,
} from "lucide-react"
import type { Task, DesignTheme, Meeting, TaskProposal } from "../app/page"

interface DynamicGanttChartProps {
  tasks: Task[]
  allTasks: Task[]
  meetings: Meeting[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>, reason: string) => void
  onToggleExpansion: (taskId: string) => void
  getPriorityColor: (priority: string) => string
  getStatusColor: (status: string) => string
  formatDate: (date: Date) => string
  theme: DesignTheme
  themeClasses: any
}

type ViewMode = "day" | "week" | "month" | "quarter"
type DragState = {
  isDragging: boolean
  taskId: string | null
  dragType: "move" | "resize-start" | "resize-end" | null
  startX: number
  originalStart?: Date
  originalEnd?: Date
  currentDeltaDays?: number
}

export function DynamicGanttChart({
  tasks,
  allTasks,
  meetings,
  onTaskUpdate,
  onToggleExpansion,
  getPriorityColor,
  getStatusColor,
  formatDate,
  theme,
  themeClasses,
}: DynamicGanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [zoomLevel, setZoomLevel] = useState(100)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    taskId: null,
    dragType: null,
    startX: 0,
  })
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [showProposals, setShowProposals] = useState(true)
  const [editingProposal, setEditingProposal] = useState<string | null>(null)
  const [editedProposal, setEditedProposal] = useState<TaskProposal | null>(null)
  const [approvedProposals, setApprovedProposals] = useState<Set<string>>(new Set())
  const [skippedProposals, setSkippedProposals] = useState<Set<string>>(new Set())

  const ganttRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const chartScrollRef = useRef<HTMLDivElement>(null)

  // Get all task proposals from meetings
  const getAllTaskProposals = useCallback(() => {
    return meetings.flatMap((meeting) => meeting.taskProposals)
  }, [meetings])

  // Get proposals for a specific task
  const getTaskProposals = useCallback(
    (taskId: string) => {
      return getAllTaskProposals().filter((proposal) => proposal.taskId === taskId)
    },
    [getAllTaskProposals],
  )

  // Calculate time range and scale
  const getTimeRange = useCallback(() => {
    if (tasks.length === 0) return { start: new Date(), end: new Date(), totalDays: 0 }

    const allDates = tasks.flatMap((t) => [t.startDate, t.endDate])
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))

    // Add padding
    const padding = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    const start = new Date(minDate.getTime() - padding)
    const end = new Date(maxDate.getTime() + padding)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))

    return { start, end, totalDays }
  }, [tasks])

  const { start: timeStart, end: timeEnd, totalDays } = getTimeRange()

  // Calculate pixel width per day based on view mode and zoom
  const getPixelsPerDay = useCallback(() => {
    const basePixels = {
      day: 80,
      week: 20,
      month: 8,
      quarter: 3,
    }
    return (basePixels[viewMode] * zoomLevel) / 100
  }, [viewMode, zoomLevel])

  const pixelsPerDay = getPixelsPerDay()
  const totalWidth = totalDays * pixelsPerDay

  // Synchronize horizontal scrolling between timeline and chart
  useEffect(() => {
    const timelineScrollElement = timelineScrollRef.current
    const chartScrollElement = chartScrollRef.current

    if (!timelineScrollElement || !chartScrollElement) return

    const handleTimelineScroll = () => {
      if (chartScrollElement.scrollLeft !== timelineScrollElement.scrollLeft) {
        chartScrollElement.scrollLeft = timelineScrollElement.scrollLeft
      }
    }

    const handleChartScroll = () => {
      if (timelineScrollElement.scrollLeft !== chartScrollElement.scrollLeft) {
        timelineScrollElement.scrollLeft = chartScrollElement.scrollLeft
      }
    }

    timelineScrollElement.addEventListener("scroll", handleTimelineScroll)
    chartScrollElement.addEventListener("scroll", handleChartScroll)

    return () => {
      timelineScrollElement.removeEventListener("scroll", handleTimelineScroll)
      chartScrollElement.removeEventListener("scroll", handleChartScroll)
    }
  }, [])

  // Generate timeline markers
  const generateTimelineMarkers = useCallback(() => {
    const markers = []
    const current = new Date(timeStart)
    const increment = {
      day: 1,
      week: 7,
      month: 30,
      quarter: 90,
    }[viewMode]

    while (current <= timeEnd) {
      const daysSinceStart = Math.floor((current.getTime() - timeStart.getTime()) / (24 * 60 * 60 * 1000))
      const x = daysSinceStart * pixelsPerDay

      let label = ""
      let sublabel = ""

      if (viewMode === "day") {
        label = current.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
        })
        sublabel = current.toLocaleDateString("en-US", { weekday: "short" })
      } else if (viewMode === "week") {
        label = `W${Math.ceil(current.getDate() / 7)}`
        sublabel = current.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      } else if (viewMode === "month") {
        label = current.toLocaleDateString("en-US", { month: "short" })
        sublabel = current.getFullYear().toString()
      } else {
        label = `Q${Math.ceil((current.getMonth() + 1) / 3)}`
        sublabel = current.getFullYear().toString()
      }

      markers.push({
        date: new Date(current),
        x,
        label,
        sublabel,
        isWeekend: viewMode === "day" && (current.getDay() === 0 || current.getDay() === 6),
        isToday: viewMode === "day" && current.toDateString() === new Date().toDateString(),
      })

      current.setDate(current.getDate() + increment)
    }

    return markers
  }, [timeStart, timeEnd, viewMode, pixelsPerDay])

  // Calculate task position and width
  const getTaskPosition = useCallback(
    (task: Task) => {
      const startDays = Math.floor((task.startDate.getTime() - timeStart.getTime()) / (24 * 60 * 60 * 1000))
      const endDays = Math.floor((task.endDate.getTime() - timeStart.getTime()) / (24 * 60 * 60 * 1000))

      const left = startDays * pixelsPerDay
      const width = Math.max((endDays - startDays) * pixelsPerDay, 20)

      return { left, width }
    },
    [timeStart, pixelsPerDay],
  )

  // Filter tasks based on status and priority
  const getFilteredTasks = useCallback(() => {
    return tasks.filter((task) => {
      const statusMatch = filterStatus === "all" || task.status === filterStatus
      const priorityMatch = filterPriority === "all" || task.priority === filterPriority
      return statusMatch && priorityMatch
    })
  }, [tasks, filterStatus, filterPriority])

  // Handle mouse events for drag and drop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, taskId: string, dragType: "move" | "resize-start" | "resize-end") => {
      e.preventDefault()
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      setDragState({
        isDragging: true,
        taskId,
        dragType,
        startX: e.clientX,
        originalStart: new Date(task.startDate),
        originalEnd: new Date(task.endDate),
      })

      setSelectedTask(taskId)
    },
    [tasks],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.taskId || !dragState.originalStart || !dragState.originalEnd) return

      const deltaX = e.clientX - dragState.startX
      const deltaDays = Math.round(deltaX / pixelsPerDay)

      setDragState((prev) => ({ ...prev, currentDeltaDays: deltaDays }))
    },
    [dragState, pixelsPerDay],
  )

  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging || !dragState.taskId || !dragState.originalStart || !dragState.originalEnd) return

    const task = tasks.find((t) => t.id === dragState.taskId)
    if (!task) return

    const deltaDays = dragState.currentDeltaDays || 0

    let newStart = new Date(dragState.originalStart)
    let newEnd = new Date(dragState.originalEnd)
    let duration = Math.ceil((newEnd.getTime() - newStart.getTime()) / (24 * 60 * 60 * 1000))

    switch (dragState.dragType) {
      case "move":
        newStart.setDate(newStart.getDate() + deltaDays)
        newEnd.setDate(newEnd.getDate() + deltaDays)
        break
      case "resize-start":
        newStart.setDate(newStart.getDate() + deltaDays)
        if (newStart >= newEnd) {
          newStart = new Date(newEnd.getTime() - 24 * 60 * 60 * 1000)
        }
        duration = Math.ceil((newEnd.getTime() - newStart.getTime()) / (24 * 60 * 60 * 1000))
        break
      case "resize-end":
        newEnd.setDate(newEnd.getDate() + deltaDays)
        if (newEnd <= newStart) {
          newEnd = new Date(newStart.getTime() + 24 * 60 * 60 * 1000)
        }
        duration = Math.ceil((newEnd.getTime() - newStart.getTime()) / (24 * 60 * 60 * 1000))
        break
    }

    onTaskUpdate(
      dragState.taskId,
      { startDate: newStart, endDate: newEnd, duration },
      `Task ${dragState.dragType === "move" ? "moved" : "resized"} via drag and drop`,
    )

    setDragState({
      isDragging: false,
      taskId: null,
      dragType: null,
      startX: 0,
    })
  }, [dragState, tasks, onTaskUpdate])

  // Add event listeners for mouse events
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp])

  // Proposal management functions
  const handleEditProposal = (proposal: TaskProposal) => {
    setEditingProposal(proposal.id)
    setEditedProposal({ ...proposal })
  }

  const handleSaveProposal = () => {
    if (!editedProposal) return
    console.log("Saving proposal:", editedProposal)
    setEditingProposal(null)
    setEditedProposal(null)
  }

  const handleCancelEdit = () => {
    setEditingProposal(null)
    setEditedProposal(null)
  }

  const handleApproveProposal = (proposal: TaskProposal) => {
    console.log("Approving proposal:", proposal)

    // Apply the proposal to the actual task
    const updates: Partial<Task> = {}
    if (proposal.proposedStatus) updates.status = proposal.proposedStatus
    if (proposal.proposedProgress !== undefined) updates.progress = proposal.proposedProgress
    if (proposal.proposedEndDate) updates.endDate = proposal.proposedEndDate

    onTaskUpdate(proposal.taskId, updates, `Applied AI proposal: ${proposal.reason}`)

    // Mark as approved
    const newApproved = new Set(approvedProposals)
    newApproved.add(proposal.id)
    setApprovedProposals(newApproved)

    // Remove from skipped if it was previously skipped
    const newSkipped = new Set(skippedProposals)
    newSkipped.delete(proposal.id)
    setSkippedProposals(newSkipped)
  }

  const handleSkipProposal = (proposalId: string) => {
    const newSkipped = new Set(skippedProposals)
    newSkipped.add(proposalId)
    setSkippedProposals(newSkipped)

    const newApproved = new Set(approvedProposals)
    newApproved.delete(proposalId)
    setApprovedProposals(newApproved)
  }

  const getProposalIcon = (proposal: TaskProposal) => {
    if (proposal.proposedStatus === "Completed") return <CheckCircle className="h-3 w-3 text-green-600" />
    if (proposal.proposedStatus === "Delayed" || proposal.proposedStatus === "Blocked")
      return <AlertTriangle className="h-3 w-3 text-orange-600" />
    return <TrendingUp className="h-3 w-3 text-blue-600" />
  }

  const timelineMarkers = generateTimelineMarkers()
  const filteredTasks = getFilteredTasks()

  const resetView = () => {
    setZoomLevel(100)
    setViewMode("week")
    setFilterStatus("all")
    setFilterPriority("all")
    setSelectedTask(null)
  }

  const exportGantt = () => {
    console.log("Exporting Gantt chart...")
  }

  return (
    <Card className={themeClasses.card}>
      <CardHeader className={themeClasses.header}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dynamic Gantt Chart</CardTitle>
            <CardDescription className={theme === "dark" ? "text-gray-300" : ""}>
              Interactive timeline with drag-and-drop, resizing, and AI task proposals
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showProposals ? "default" : "outline"}
              size="sm"
              onClick={() => setShowProposals(!showProposals)}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Proposals
            </Button>
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset View
            </Button>
            <Button variant="outline" size="sm" onClick={exportGantt}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">View:</label>
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
              disabled={zoomLevel <= 25}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 min-w-[120px]">
              <Slider
                value={[zoomLevel]}
                onValueChange={([value]) => setZoomLevel(value)}
                min={25}
                max={200}
                step={25}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12">{zoomLevel}%</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
              disabled={zoomLevel >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Delayed">Delayed</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          {/* Timeline Header */}
          <div className={`border-b bg-gray-50 ${theme === "dark" ? "bg-gray-800" : ""}`} style={{ minHeight: "60px" }}>
            <div className="flex">
              {/* Task names column - Fixed */}
              <div className="w-80 border-r bg-white dark:bg-gray-900 flex-shrink-0 p-2 z-10">
                <div className="font-medium text-sm">Tasks</div>
              </div>

              {/* Timeline - Scrollable */}
              <div
                ref={timelineScrollRef}
                className="flex-1 overflow-x-auto overflow-y-hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <div className="relative" style={{ width: totalWidth }}>
                  {timelineMarkers.map((marker, index) => (
                    <div
                      key={index}
                      className={`absolute top-0 h-full border-l ${
                        marker.isWeekend
                          ? "border-gray-300 dark:border-gray-600 bg-gray-100/50 dark:bg-gray-700/30"
                          : "border-gray-200 dark:border-gray-700"
                      } ${marker.isToday ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600" : ""}`}
                      style={{
                        left: marker.x,
                        width: viewMode === "day" ? pixelsPerDay : "auto",
                      }}
                    >
                      <div className="p-1 text-center min-w-0">
                        <div
                          className={`text-xs font-medium leading-tight ${
                            marker.isToday
                              ? "text-blue-700 dark:text-blue-300"
                              : marker.isWeekend
                                ? "text-gray-500 dark:text-gray-400"
                                : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {marker.label}
                        </div>
                        <div
                          className={`text-xs leading-tight ${
                            marker.isToday
                              ? "text-blue-600 dark:text-blue-400"
                              : marker.isWeekend
                                ? "text-gray-400 dark:text-gray-500"
                                : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {marker.sublabel}
                        </div>
                      </div>
                      {marker.isToday && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  ))}

                  {/* Today indicator line for non-daily views */}
                  {viewMode !== "day" &&
                    (() => {
                      const today = new Date()
                      const todayDays = Math.floor((today.getTime() - timeStart.getTime()) / (24 * 60 * 60 * 1000))
                      const todayX = todayDays * pixelsPerDay

                      if (todayX >= 0 && todayX <= totalWidth) {
                        return (
                          <div
                            className="absolute top-0 h-full border-l-2 border-red-500 z-10"
                            style={{ left: todayX }}
                          >
                            <div className="bg-red-500 text-white text-xs px-1 rounded">Today</div>
                          </div>
                        )
                      }
                      return null
                    })()}
                </div>
              </div>
            </div>
          </div>

          {/* Gantt Chart Body */}
          <div className="overflow-y-auto max-h-96" style={{ cursor: dragState.isDragging ? "grabbing" : "default" }}>
            <div className="flex">
              {/* Task names column - Fixed horizontally, scrolls vertically with content */}
              <div className="w-80 border-r bg-white dark:bg-gray-900 flex-shrink-0">
                {filteredTasks
                  .filter((task) => task.level === 0)
                  .map((mainTask) => {
                    const taskProposals = getTaskProposals(mainTask.id)
                    const pendingProposals = taskProposals.filter(
                      (p) => !approvedProposals.has(p.id) && !skippedProposals.has(p.id),
                    )

                    return (
                      <div key={mainTask.id}>
                        {/* Main task row */}
                        <div
                          className={`p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            selectedTask === mainTask.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          }`}
                          style={{ minHeight: "60px" }}
                          onClick={() => setSelectedTask(selectedTask === mainTask.id ? null : mainTask.id)}
                        >
                          <div className="flex items-start gap-2 h-full">
                            {allTasks.some((t) => t.parentId === mainTask.id) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 mt-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onToggleExpansion(mainTask.id)
                                }}
                              >
                                {mainTask.isExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate mb-1">{mainTask.name}</div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className={getStatusColor(mainTask.status)}>
                                  {mainTask.status}
                                </Badge>
                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(mainTask.priority)}`} />
                              </div>

                              {/* AI Proposals integrated into task row */}
                              {showProposals && pendingProposals.length > 0 && (
                                <div className="space-y-1">
                                  {pendingProposals.slice(0, 2).map((proposal) => (
                                    <div
                                      key={proposal.id}
                                      className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-xs"
                                    >
                                      <div className="flex items-center gap-1">
                                        {getProposalIcon(proposal)}
                                        <span className="font-medium">AI:</span>
                                      </div>
                                      <span className="flex-1 truncate">{proposal.reason}</span>
                                      <div className="flex items-center gap-1">
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-80" align="start">
                                            <div className="space-y-3">
                                              <div className="flex items-center gap-2">
                                                <Brain className="h-4 w-4 text-orange-500" />
                                                <span className="font-medium text-sm">AI Task Proposal</span>
                                                <Badge variant="outline" className="text-xs">
                                                  {Math.round(proposal.confidence * 100)}% confidence
                                                </Badge>
                                              </div>

                                              {editingProposal === proposal.id ? (
                                                // Edit mode
                                                <div className="space-y-3">
                                                  <div>
                                                    <label className="text-sm font-medium">Reason:</label>
                                                    <Textarea
                                                      value={editedProposal?.reason || proposal.reason}
                                                      onChange={(e) =>
                                                        setEditedProposal((prev) =>
                                                          prev ? { ...prev, reason: e.target.value } : null,
                                                        )
                                                      }
                                                      className="text-sm mt-1"
                                                      rows={2}
                                                    />
                                                  </div>

                                                  <div className="flex items-center gap-4 text-xs">
                                                    {(editedProposal?.proposedStatus || proposal.proposedStatus) && (
                                                      <div className="flex items-center gap-2">
                                                        <span>Status:</span>
                                                        <Select
                                                          value={
                                                            editedProposal?.proposedStatus || proposal.proposedStatus
                                                          }
                                                          onValueChange={(value) =>
                                                            setEditedProposal((prev) =>
                                                              prev ? { ...prev, proposedStatus: value as any } : null,
                                                            )
                                                          }
                                                        >
                                                          <SelectTrigger className="w-32 h-7">
                                                            <SelectValue />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            <SelectItem value="Not Started">Not Started</SelectItem>
                                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                                            <SelectItem value="Completed">Completed</SelectItem>
                                                            <SelectItem value="Delayed">Delayed</SelectItem>
                                                            <SelectItem value="Blocked">Blocked</SelectItem>
                                                          </SelectContent>
                                                        </Select>
                                                      </div>
                                                    )}
                                                    {(editedProposal?.proposedProgress !== undefined ||
                                                      proposal.proposedProgress !== undefined) && (
                                                      <div className="flex items-center gap-2">
                                                        <span>Progress:</span>
                                                        <Input
                                                          type="number"
                                                          min="0"
                                                          max="100"
                                                          value={
                                                            editedProposal?.proposedProgress ??
                                                            proposal.proposedProgress
                                                          }
                                                          onChange={(e) =>
                                                            setEditedProposal((prev) =>
                                                              prev
                                                                ? {
                                                                    ...prev,
                                                                    proposedProgress: Number.parseInt(e.target.value),
                                                                  }
                                                                : null,
                                                            )
                                                          }
                                                          className="w-16 h-7"
                                                        />
                                                        <span>%</span>
                                                      </div>
                                                    )}
                                                  </div>

                                                  <div className="flex gap-2">
                                                    <Button size="sm" onClick={handleSaveProposal}>
                                                      <Save className="h-3 w-3 mr-1" />
                                                      Save
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                                      <X className="h-3 w-3 mr-1" />
                                                      Cancel
                                                    </Button>
                                                  </div>
                                                </div>
                                              ) : (
                                                // View mode
                                                <div className="space-y-3">
                                                  <p className="text-sm text-muted-foreground">{proposal.reason}</p>

                                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    {proposal.proposedStatus && (
                                                      <span>Status → {proposal.proposedStatus}</span>
                                                    )}
                                                    {proposal.proposedProgress !== undefined && (
                                                      <span>Progress → {proposal.proposedProgress}%</span>
                                                    )}
                                                    {proposal.proposedEndDate && (
                                                      <span>End Date → {formatDate(proposal.proposedEndDate)}</span>
                                                    )}
                                                  </div>

                                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{formatDate(proposal.timestamp)}</span>
                                                  </div>

                                                  <div className="flex gap-2">
                                                    <Button
                                                      size="sm"
                                                      onClick={() => handleApproveProposal(proposal)}
                                                      className="bg-green-600 hover:bg-green-700"
                                                    >
                                                      <Check className="h-3 w-3 mr-1" />
                                                      Approve
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleSkipProposal(proposal.id)}
                                                    >
                                                      <SkipForward className="h-3 w-3 mr-1" />
                                                      Skip
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => handleEditProposal(proposal)}
                                                    >
                                                      <Edit className="h-3 w-3 mr-1" />
                                                      Edit
                                                    </Button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </PopoverContent>
                                        </Popover>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 text-green-600 hover:text-green-700"
                                          onClick={() => handleApproveProposal(proposal)}
                                        >
                                          <Check className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 text-gray-600 hover:text-gray-700"
                                          onClick={() => handleSkipProposal(proposal.id)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                  {pendingProposals.length > 2 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{pendingProposals.length - 2} more proposals
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Show approved/skipped proposals summary */}
                              {showProposals && taskProposals.length > 0 && (
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  {taskProposals.filter((p) => approvedProposals.has(p.id)).length > 0 && (
                                    <Badge variant="default" className="bg-green-600 text-xs">
                                      {taskProposals.filter((p) => approvedProposals.has(p.id)).length} applied
                                    </Badge>
                                  )}
                                  {taskProposals.filter((p) => skippedProposals.has(p.id)).length > 0 && (
                                    <Badge variant="secondary" className="bg-gray-500 text-xs">
                                      {taskProposals.filter((p) => skippedProposals.has(p.id)).length} skipped
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sub tasks */}
                        {mainTask.isExpanded &&
                          allTasks
                            .filter((task) => task.parentId === mainTask.id)
                            .map((subTask) => {
                              const subTaskProposals = getTaskProposals(subTask.id)
                              const pendingSubProposals = subTaskProposals.filter(
                                (p) => !approvedProposals.has(p.id) && !skippedProposals.has(p.id),
                              )

                              return (
                                <div
                                  key={subTask.id}
                                  className={`p-3 pl-8 border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                    selectedTask === subTask.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                  }`}
                                  style={{ minHeight: "60px" }}
                                  onClick={() => setSelectedTask(selectedTask === subTask.id ? null : subTask.id)}
                                >
                                  <div className="flex items-start h-full">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate mb-1">{subTask.name}</div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className={getStatusColor(subTask.status)}>
                                          {subTask.status}
                                        </Badge>
                                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(subTask.priority)}`} />
                                      </div>

                                      {/* AI Proposals for sub tasks */}
                                      {showProposals && pendingSubProposals.length > 0 && (
                                        <div className="space-y-1">
                                          {pendingSubProposals.slice(0, 1).map((proposal) => (
                                            <div
                                              key={proposal.id}
                                              className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-xs"
                                            >
                                              <div className="flex items-center gap-1">
                                                {getProposalIcon(proposal)}
                                                <span className="font-medium">AI:</span>
                                              </div>
                                              <span className="flex-1 truncate">{proposal.reason}</span>
                                              <div className="flex items-center gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-5 w-5 p-0 text-green-600 hover:text-green-700"
                                                  onClick={() => handleApproveProposal(proposal)}
                                                >
                                                  <Check className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-5 w-5 p-0 text-gray-600 hover:text-gray-700"
                                                  onClick={() => handleSkipProposal(proposal.id)}
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Show approved/skipped proposals summary for sub tasks */}
                                      {showProposals && subTaskProposals.length > 0 && (
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                          {subTaskProposals.filter((p) => approvedProposals.has(p.id)).length > 0 && (
                                            <Badge variant="default" className="bg-green-600 text-xs">
                                              {subTaskProposals.filter((p) => approvedProposals.has(p.id)).length}{" "}
                                              applied
                                            </Badge>
                                          )}
                                          {subTaskProposals.filter((p) => skippedProposals.has(p.id)).length > 0 && (
                                            <Badge variant="secondary" className="bg-gray-500 text-xs">
                                              {subTaskProposals.filter((p) => skippedProposals.has(p.id)).length}{" "}
                                              skipped
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                      </div>
                    )
                  })}
              </div>

              {/* Gantt bars - Scrollable horizontally, aligned with tasks */}
              <div
                ref={chartScrollRef}
                className="flex-1 overflow-x-auto"
                style={{ cursor: dragState.isDragging ? "grabbing" : "default" }}
              >
                <div className="relative" style={{ width: totalWidth }}>
                  {/* Grid lines with weekend highlighting */}
                  {timelineMarkers.map((marker, index) => (
                    <div
                      key={`grid-${index}`}
                      className={`absolute top-0 bottom-0 ${
                        marker.isWeekend
                          ? "bg-gray-100/50 dark:bg-gray-800/30 border-l border-gray-300 dark:border-gray-600"
                          : "border-l border-gray-100 dark:border-gray-800"
                      } ${
                        marker.isToday ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-700" : ""
                      }`}
                      style={{
                        left: marker.x,
                        width: viewMode === "day" ? pixelsPerDay : "1px",
                      }}
                    />
                  ))}

                  {/* Task bars */}
                  {(() => {
                    let currentRowIndex = 0

                    return filteredTasks
                      .filter((task) => task.level === 0)
                      .map((mainTask) => {
                        const mainPosition = getTaskPosition(mainTask)
                        const subTasks = allTasks.filter((t) => t.parentId === mainTask.id)
                        const taskProposals = getTaskProposals(mainTask.id)
                        const pendingProposals = taskProposals.filter(
                          (p) => !approvedProposals.has(p.id) && !skippedProposals.has(p.id),
                        )

                        // Calculate row height based on content
                        const baseHeight = 60
                        const proposalHeight = showProposals ? pendingProposals.length * 25 : 0
                        const summaryHeight = showProposals && taskProposals.length > 0 ? 20 : 0
                        const mainRowHeight = Math.max(baseHeight, baseHeight + proposalHeight + summaryHeight)
                        const mainRowTop = currentRowIndex * mainRowHeight + 15

                        const result = (
                          <div key={`bars-${mainTask.id}`}>
                            {/* Main task bar */}
                            <div
                              className="absolute flex items-center"
                              style={{
                                top: mainRowTop,
                                left: mainPosition.left,
                                width: mainPosition.width,
                                height: 30,
                              }}
                            >
                              <div
                                className={`relative w-full h-full rounded cursor-move ${
                                  theme === "modern"
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600"
                                    : theme === "dark"
                                      ? "bg-blue-700"
                                      : "bg-primary"
                                } ${selectedTask === mainTask.id ? "ring-2 ring-blue-400" : ""} ${
                                  dragState.isDragging && dragState.taskId === mainTask.id ? "opacity-70" : ""
                                } shadow-sm`}
                                onMouseDown={(e) => handleMouseDown(e, mainTask.id, "move")}
                              >
                                {/* Resize handles */}
                                <div
                                  className="absolute left-0 top-0 w-2 h-full cursor-w-resize bg-black bg-opacity-20 hover:bg-opacity-40 rounded-l"
                                  onMouseDown={(e) => {
                                    e.stopPropagation()
                                    handleMouseDown(e, mainTask.id, "resize-start")
                                  }}
                                />
                                <div
                                  className="absolute right-0 top-0 w-2 h-full cursor-e-resize bg-black bg-opacity-20 hover:bg-opacity-40 rounded-r"
                                  onMouseDown={(e) => {
                                    e.stopPropagation()
                                    handleMouseDown(e, mainTask.id, "resize-end")
                                  }}
                                />

                                {/* Progress indicator */}
                                <div
                                  className="absolute left-0 top-0 h-full bg-white bg-opacity-30 rounded-l"
                                  style={{ width: `${mainTask.progress}%` }}
                                />

                                {/* Task info */}
                                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                                  {mainTask.progress > 0 && `${mainTask.progress}%`}
                                </div>
                              </div>
                            </div>

                            {/* Sub task bars */}
                            {mainTask.isExpanded &&
                              subTasks.map((subTask, subIndex) => {
                                const subPosition = getTaskPosition(subTask)
                                const subTaskProposals = getTaskProposals(subTask.id)
                                const pendingSubProposals = subTaskProposals.filter(
                                  (p) => !approvedProposals.has(p.id) && !skippedProposals.has(p.id),
                                )

                                // Calculate sub task row height
                                const subBaseHeight = 60
                                const subProposalHeight = showProposals ? pendingSubProposals.length * 25 : 0
                                const subSummaryHeight = showProposals && subTaskProposals.length > 0 ? 20 : 0
                                const subRowHeight = Math.max(
                                  subBaseHeight,
                                  subBaseHeight + subProposalHeight + subSummaryHeight,
                                )
                                const subRowTop = mainRowTop + mainRowHeight + subIndex * subRowHeight

                                return (
                                  <div
                                    key={`sub-bar-${subTask.id}`}
                                    className="absolute flex items-center"
                                    style={{
                                      top: subRowTop,
                                      left: subPosition.left,
                                      width: subPosition.width,
                                      height: 24,
                                    }}
                                  >
                                    <div
                                      className={`relative w-full h-full rounded cursor-move ${
                                        theme === "modern"
                                          ? "bg-gradient-to-r from-blue-400 to-purple-400"
                                          : theme === "dark"
                                            ? "bg-blue-500"
                                            : "bg-primary/80"
                                      } ${selectedTask === subTask.id ? "ring-2 ring-blue-400" : ""} ${
                                        dragState.isDragging && dragState.taskId === subTask.id ? "opacity-70" : ""
                                      } shadow-sm`}
                                      onMouseDown={(e) => handleMouseDown(e, subTask.id, "move")}
                                    >
                                      {/* Resize handles */}
                                      <div
                                        className="absolute left-0 top-0 w-2 h-full cursor-w-resize bg-black bg-opacity-20 hover:bg-opacity-40 rounded-l"
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          handleMouseDown(e, subTask.id, "resize-start")
                                        }}
                                      />
                                      <div
                                        className="absolute right-0 top-0 w-2 h-full cursor-e-resize bg-black bg-opacity-20 hover:bg-opacity-40 rounded-r"
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          handleMouseDown(e, subTask.id, "resize-end")
                                        }}
                                      />

                                      {/* Progress indicator */}
                                      <div
                                        className="absolute left-0 top-0 h-full bg-white bg-opacity-30 rounded-l"
                                        style={{ width: `${subTask.progress}%` }}
                                      />

                                      {/* Task info */}
                                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                                        {subTask.progress > 0 && `${subTask.progress}%`}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        )

                        // Update currentRowIndex for next main task
                        currentRowIndex += 1 + (mainTask.isExpanded ? subTasks.length : 0)

                        return result
                      })
                  })()}

                  {/* Dependencies */}
                  {filteredTasks
                    .filter((task) => task.dependencies && task.dependencies.length > 0)
                    .map((task) => {
                      const taskPos = getTaskPosition(task)
                      return task.dependencies?.map((depId) => {
                        const depTask = tasks.find((t) => t.id === depId)
                        if (!depTask) return null

                        const depPos = getTaskPosition(depTask)

                        return (
                          <svg
                            key={`dep-${task.id}-${depId}`}
                            className="absolute top-0 left-0 pointer-events-none"
                            style={{ width: totalWidth, height: "100%" }}
                          >
                            <line
                              x1={depPos.left + depPos.width}
                              y1={30}
                              x2={taskPos.left}
                              y2={30}
                              stroke="#666"
                              strokeWidth="2"
                              markerEnd="url(#arrowhead)"
                            />
                            <defs>
                              <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                              >
                                <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                              </marker>
                            </defs>
                          </svg>
                        )
                      })
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task details panel */}
        {selectedTask &&
          (() => {
            const task = tasks.find((t) => t.id === selectedTask)
            if (!task) return null

            const taskProposals = getTaskProposals(task.id)

            return (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="font-medium mb-2">Task Details: {task.name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-medium">Start:</span> {formatDate(task.startDate)}
                  </div>
                  <div>
                    <span className="font-medium">End:</span> {formatDate(task.endDate)}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {task.duration} days
                  </div>
                  <div>
                    <span className="font-medium">Progress:</span> {task.progress}%
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge variant="outline" className={`ml-2 ${getStatusColor(task.status)}`}>
                      {task.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Priority:</span>
                    <div className={`inline-block w-3 h-3 rounded-full ml-2 ${getPriorityColor(task.priority)}`} />
                    <span className="ml-1">{task.priority}</span>
                  </div>
                  {task.assignee && (
                    <div>
                      <span className="font-medium">Assignee:</span> {task.assignee}
                    </div>
                  )}
                </div>

                {/* AI Proposals for selected task */}
                {taskProposals.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-orange-500" />
                      AI Proposals ({taskProposals.length})
                    </h5>
                    <div className="space-y-2">
                      {taskProposals.map((proposal) => (
                        <div
                          key={proposal.id}
                          className={`p-3 rounded-lg border text-sm ${
                            approvedProposals.has(proposal.id)
                              ? "bg-green-50 border-green-200"
                              : skippedProposals.has(proposal.id)
                                ? "bg-gray-100 border-gray-300 opacity-60"
                                : "bg-orange-50 border-orange-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getProposalIcon(proposal)}
                              <span className="font-medium">{Math.round(proposal.confidence * 100)}% confidence</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDate(proposal.timestamp)}
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-2">{proposal.reason}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {proposal.proposedStatus && <span>Status → {proposal.proposedStatus}</span>}
                            {proposal.proposedProgress !== undefined && (
                              <span>Progress → {proposal.proposedProgress}%</span>
                            )}
                            {proposal.proposedEndDate && <span>End Date → {formatDate(proposal.proposedEndDate)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4" />
            <span>Drag to move</span>
          </div>
          <div className="flex items-center gap-2">
            <Resize className="h-4 w-4" />
            <span>Drag edges to resize</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-blue-500 rounded" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-gray-200 rounded" />
            <span>Weekend</span>
          </div>
          {showProposals && (
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-orange-500" />
              <span>AI Proposals</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
