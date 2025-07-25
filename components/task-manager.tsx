"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Calendar,
  History,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import type { Task, DesignTheme } from "../app/page"

interface TaskManagerProps {
  tasks: Task[]
  allTasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>, reason: string) => void
  onToggleExpansion: (taskId: string) => void
  getPriorityColor: (priority: string) => string
  getStatusColor: (status: string) => string
  formatDate: (date: Date) => string
  theme: DesignTheme
  themeClasses: any
}

export function TaskManager({
  tasks,
  allTasks,
  onTaskUpdate,
  onToggleExpansion,
  getPriorityColor,
  getStatusColor,
  formatDate,
  theme,
  themeClasses,
}: TaskManagerProps) {
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [updateReason, setUpdateReason] = useState("")

  // Debug logging
  console.log('=== TASK MANAGER DEBUG ===')
  console.log('TaskManager received tasks:', tasks.length)
  console.log('All tasks:', allTasks.length)
  console.log('Main tasks (level 0):', tasks.filter(t => t.level === 0).length)
  console.log('Sub tasks (level 1):', tasks.filter(t => t.level === 1).length)
  console.log('Sample tasks:', tasks.slice(0, 3).map(t => ({ name: t.name, level: t.level, isExpanded: t.isExpanded })))
  console.log('Sample allTasks:', allTasks.slice(0, 3).map(t => ({ name: t.name, level: t.level, parentId: t.parentId })))
  console.log('=== END TASK MANAGER DEBUG ===')


  const handleAcceptProposal = (task: Task) => {
    if (!task.proposedChanges) return

    const updates: Partial<Task> = {}

    if (task.proposedChanges.proposedStatus) {
      updates.status = task.proposedChanges.proposedStatus
    }
    if (task.proposedChanges.proposedProgress !== undefined) {
      updates.progress = task.proposedChanges.proposedProgress
    }
    if (task.proposedChanges.proposedEndDate) {
      updates.endDate = task.proposedChanges.proposedEndDate
    }

    onTaskUpdate(task.id, updates, `Accepted AI proposal: ${task.proposedChanges.reason}`)
  }

  const handleRejectProposal = (task: Task) => {
    onTaskUpdate(task.id, { proposedChanges: undefined }, "Rejected AI proposal")
  }

  const handleManualUpdate = (task: Task, field: string, value: any) => {
    if (!updateReason.trim()) {
      alert("Please provide a reason for the update")
      return
    }

    onTaskUpdate(task.id, { [field]: value }, updateReason)
    setEditingTask(null)
    setUpdateReason("")
  }

  const getAuditIcon = (type: string) => {
    switch (type) {
      case "manual":
        return <User className="h-3 w-3" />
      case "meeting":
        return <Calendar className="h-3 w-3" />
      case "system":
        return <Clock className="h-3 w-3" />
      default:
        return <History className="h-3 w-3" />
    }
  }

  const getAuditColor = (type: string) => {
    switch (type) {
      case "manual":
        return "text-blue-600"
      case "meeting":
        return "text-green-600"
      case "system":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  const hasChildren = (taskId: string) => {
    return allTasks.some((t) => t.parentId === taskId)
  }

  const getChildrenSummary = (taskId: string) => {
    const children = allTasks.filter((t) => t.parentId === taskId)
    if (children.length === 0) return null

    const completed = children.filter((t) => t.status === "Completed").length
    const inProgress = children.filter((t) => t.status === "In Progress").length
    const delayed = children.filter((t) => t.status === "Delayed").length
    const blocked = children.filter((t) => t.status === "Blocked").length
    const avgProgress = Math.round(children.reduce((sum, t) => sum + t.progress, 0) / children.length)

    return {
      total: children.length,
      completed,
      inProgress,
      delayed,
      blocked,
      avgProgress,
    }
  }

  const renderTask = (task: Task) => {
    const isMainActivity = task.level === 0
    const childrenSummary = isMainActivity ? getChildrenSummary(task.id) : null
    const hasChildTasks = hasChildren(task.id)

    return (
      <div
        key={task.id}
        className={`border rounded-lg space-y-4 ${theme === "dark" ? "border-gray-700" : ""} ${
          isMainActivity ? "p-6 shadow-md" : "p-4 ml-8 border-l-4 border-l-blue-200"
        }`}
        style={{
          backgroundColor: isMainActivity
            ? theme === "dark"
              ? "rgba(55, 65, 81, 0.5)"
              : "rgba(248, 250, 252, 0.8)"
            : undefined,
        }}
      >
        {/* Task Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              {isMainActivity && hasChildTasks && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onToggleExpansion(task.id)}
                >
                  {task.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              )}
              <h3 className={`font-semibold ${isMainActivity ? "text-xl" : "text-lg"}`}>{task.name}</h3>
              {isMainActivity && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Main Activity
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(task.startDate)} - {formatDate(task.endDate)}
                <span>({task.duration} days)</span>
              </div>
              {task.assignee && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {task.assignee}
                </div>
              )}
            </div>

            {/* Children Summary for Main Activities */}
            {isMainActivity && childrenSummary && (
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">Subtasks: {childrenSummary.total}</span>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓ {childrenSummary.completed}</span>
                  <span className="text-blue-600">⟳ {childrenSummary.inProgress}</span>
                  {childrenSummary.delayed > 0 && (
                    <span className="text-orange-600">⚠ {childrenSummary.delayed}</span>
                  )}
                  {childrenSummary.blocked > 0 && (
                    <span className="text-red-600">⚫ {childrenSummary.blocked}</span>
                  )}
                </div>
                <span className="text-muted-foreground">Avg Progress: {childrenSummary.avgProgress}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {task.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  Audit Trail ({task.auditTrail.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80">
                <div className="p-2">
                  <h4 className="font-medium mb-2">Change History</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {task.auditTrail
                      .slice()
                      .reverse()
                      .map((entry) => (
                        <div key={entry.id} className="text-xs border-l-2 border-gray-200 pl-2">
                          <div className="flex items-center gap-1 font-medium">
                            <span className={getAuditColor(entry.type)}>{getAuditIcon(entry.type)}</span>
                            <span className="capitalize">{entry.type}</span>
                            <span className="text-muted-foreground">
                              {entry.timestamp.toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className="font-medium">{entry.field}:</span>
                            <span className="text-red-600 line-through ml-1">{String(entry.oldValue)}</span>
                            <span className="text-green-600 ml-1">{String(entry.newValue)}</span>
                          </div>
                          {entry.reason && <div className="text-muted-foreground mt-1">{entry.reason}</div>}
                        </div>
                      ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* AI Proposed Changes */}
        {task.proposedChanges && (
          <div
            className={`border rounded-lg p-3 ${
              theme === "dark"
                ? "bg-yellow-900/20 border-yellow-700"
                : theme === "modern"
                  ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200"
                  : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">AI Proposed Changes</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(task.proposedChanges.confidence * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-yellow-700">{task.proposedChanges.reason}</p>
                <div className="space-y-1 text-xs">
                  {task.proposedChanges.proposedStatus && (
                    <div>
                      Status: <span className="font-medium">{task.status}</span> →{" "}
                      <span className="font-medium text-yellow-800">{task.proposedChanges.proposedStatus}</span>
                    </div>
                  )}
                  {task.proposedChanges.proposedProgress !== undefined && (
                    <div>
                      Progress: <span className="font-medium">{task.progress}%</span> →{" "}
                      <span className="font-medium text-yellow-800">
                        {task.proposedChanges.proposedProgress}%
                      </span>
                    </div>
                  )}
                  {task.proposedChanges.proposedEndDate && (
                    <div>
                      End Date: <span className="font-medium">{formatDate(task.endDate)}</span> →{" "}
                      <span className="font-medium text-yellow-800">
                        {formatDate(task.proposedChanges.proposedEndDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAcceptProposal(task)}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRejectProposal(task)}>
                  <XCircle className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Task Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Priority</Label>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
              <span className="text-sm font-medium">{task.priority}</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            {editingTask === task.id ? (
              <div className="space-y-2">
                <Select
                  defaultValue={task.status}
                  onValueChange={(value) => handleManualUpdate(task, "status", value)}
                >
                  <SelectTrigger className="h-8">
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
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 justify-start"
                onClick={() => setEditingTask(task.id)}
              >
                <Badge variant="outline" className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </Button>
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Progress</Label>
            <div className="flex items-center gap-2">
              <Progress value={task.progress} className="flex-1" />
              <span className="text-sm font-medium">{task.progress}%</span>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Duration</Label>
            <p className="text-sm font-medium">{task.duration} days</p>
          </div>
        </div>

        {/* Update Reason Input */}
        {editingTask === task.id && (
          <div className="space-y-2 bg-gray-50 p-3 rounded">
            <Label htmlFor="update-reason">Reason for Update</Label>
            <Textarea
              id="update-reason"
              placeholder="Explain why you're making this change..."
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              className="h-20"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={themeClasses.card}>
      <CardHeader className={themeClasses.header}>
        <CardTitle>Hierarchical Task Management</CardTitle>
        <CardDescription>
          Review AI-proposed changes and manage main activities and subactivities with full audit trail
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks
            .filter((task) => task.level === 0) // Only show main tasks
            .map((mainTask) => (
              <div key={mainTask.id}>
                {renderTask(mainTask)}
                {/* Render children if expanded */}
                {mainTask.isExpanded &&
                  allTasks
                    .filter((task) => task.parentId === mainTask.id)
                    .map((childTask) => (
                      <div key={childTask.id} className="ml-8 mt-2">
                        {renderTask(childTask)}
                      </div>
                    ))}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
