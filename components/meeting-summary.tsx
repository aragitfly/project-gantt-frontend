"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  X,
  Check,
  CheckCheck,
  SkipForward,
} from "lucide-react"
import { useState } from "react"
import type { Meeting, DesignTheme } from "../app/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface MeetingSummaryProps {
  meetings: Meeting[]
  theme: DesignTheme
  themeClasses: any
}

export function MeetingSummary({ meetings, theme, themeClasses }: MeetingSummaryProps) {
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set())
  const [editingProposal, setEditingProposal] = useState<string | null>(null)
  const [editedProposal, setEditedProposal] = useState<any>(null)
  const [approvedProposals, setApprovedProposals] = useState<Set<string>>(new Set())
  const [skippedProposals, setSkippedProposals] = useState<Set<string>>(new Set())

  const toggleMeeting = (meetingId: string) => {
    const newExpanded = new Set(expandedMeetings)
    if (newExpanded.has(meetingId)) {
      newExpanded.delete(meetingId)
    } else {
      newExpanded.add(meetingId)
    }
    setExpandedMeetings(newExpanded)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getProposalIcon = (proposal: any) => {
    if (proposal.proposedStatus === "Completed") return <CheckCircle className="h-4 w-4 text-green-600" />
    if (proposal.proposedStatus === "Delayed" || proposal.proposedStatus === "Blocked")
      return <AlertTriangle className="h-4 w-4 text-orange-600" />
    return <TrendingUp className="h-4 w-4 text-blue-600" />
  }

  const handleEditProposal = (proposal: any) => {
    setEditingProposal(proposal.id)
    setEditedProposal({ ...proposal })
  }

  const handleSaveProposal = (meetingId: string, proposalId: string) => {
    // Here you would typically update the proposal in your state/backend
    console.log("Saving proposal:", editedProposal)
    setEditingProposal(null)
    setEditedProposal(null)
  }

  const handleCancelEdit = () => {
    setEditingProposal(null)
    setEditedProposal(null)
  }

  const handleApproveProposal = (meetingId: string, proposalId: string, proposal: any) => {
    // Here you would typically apply the proposal to the actual project tasks
    console.log("Approving proposal:", proposal)

    // Add to approved proposals set
    const newApproved = new Set(approvedProposals)
    newApproved.add(proposalId)
    setApprovedProposals(newApproved)

    // Remove from skipped if it was previously skipped
    const newSkipped = new Set(skippedProposals)
    newSkipped.delete(proposalId)
    setSkippedProposals(newSkipped)

    // You would also update the actual task in your project management system
    // For example: updateTask(proposal.taskId, {
    //   status: proposal.proposedStatus,
    //   progress: proposal.proposedProgress,
    //   endDate: proposal.proposedEndDate
    // })
  }

  const handleSkipProposal = (meetingId: string, proposalId: string) => {
    // Add to skipped proposals set
    const newSkipped = new Set(skippedProposals)
    newSkipped.add(proposalId)
    setSkippedProposals(newSkipped)

    // Remove from approved if it was previously approved
    const newApproved = new Set(approvedProposals)
    newApproved.delete(proposalId)
    setApprovedProposals(newApproved)

    console.log("Skipping proposal:", proposalId)
  }

  const getAllTasks = () => {
    // This would come from props or context - for now return sample tasks
    return [
      { id: "1", name: "Project Planning" },
      { id: "1.1", name: "Define Project Scope" },
      { id: "1.2", name: "Create Project Charter" },
      { id: "1.3", name: "Stakeholder Analysis" },
      { id: "2", name: "Requirements Gathering" },
      { id: "2.1", name: "Functional Requirements" },
      { id: "2.2", name: "Non-Functional Requirements" },
      { id: "2.3", name: "Requirements Documentation" },
      { id: "3", name: "Design Phase" },
      { id: "3.1", name: "UI/UX Design" },
      { id: "3.2", name: "System Architecture" },
    ]
  }

  return (
    <Card className={themeClasses.card}>
      <CardHeader className={themeClasses.header}>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Meeting Summaries
        </CardTitle>
        <CardDescription className={theme === "dark" ? "text-gray-300" : ""}>
          AI-generated insights and task proposals from recorded meetings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div key={meeting.id} className={`border rounded-lg ${theme === "dark" ? "border-gray-700" : ""}`}>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full p-4 justify-between hover:bg-gray-50"
                    onClick={() => toggleMeeting(meeting.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedMeetings.has(meeting.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div className="text-left">
                        <h3 className="font-semibold">{meeting.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(meeting.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.round(meeting.duration / 60)}min
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {meeting.taskProposals.length} proposals
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* Meeting Summary */}
                    <div>
                      <h4 className="font-medium mb-2">Executive Summary</h4>
                      <p className="text-sm text-muted-foreground">{meeting.summary}</p>
                    </div>

                    {/* Task Proposals */}
                    {meeting.taskProposals.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">AI Task Proposals</h4>
                        <div className="space-y-2">
                          {meeting.taskProposals.map((proposal) => (
                            <div
                              key={proposal.id}
                              className={`flex items-start gap-3 p-3 rounded-lg ${
                                approvedProposals.has(proposal.id)
                                  ? "bg-green-50 border border-green-200"
                                  : skippedProposals.has(proposal.id)
                                    ? "bg-gray-100 border border-gray-300 opacity-60"
                                    : "bg-gray-50"
                              }`}
                            >
                              {getProposalIcon(proposal)}
                              <div className="flex-1">
                                {editingProposal === proposal.id ? (
                                  // Edit mode
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-medium text-sm">Task:</span>
                                      <Select
                                        value={editedProposal?.taskId || proposal.taskId}
                                        onValueChange={(value) =>
                                          setEditedProposal((prev) => ({ ...prev, taskId: value }))
                                        }
                                      >
                                        <SelectTrigger className="w-48">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {getAllTasks().map((task) => (
                                            <SelectItem key={task.id} value={task.id}>
                                              {task.id} - {task.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Badge variant="outline" className="text-xs">
                                        {Math.round((editedProposal?.confidence || proposal.confidence) * 100)}%
                                        confidence
                                      </Badge>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Reason:</label>
                                      <Textarea
                                        value={editedProposal?.reason || proposal.reason}
                                        onChange={(e) =>
                                          setEditedProposal((prev) => ({ ...prev, reason: e.target.value }))
                                        }
                                        className="text-sm"
                                        rows={2}
                                      />
                                    </div>

                                    <div className="flex items-center gap-4 mt-2 text-xs">
                                      {(editedProposal?.proposedStatus || proposal.proposedStatus) && (
                                        <div className="flex items-center gap-2">
                                          <span>Status:</span>
                                          <Select
                                            value={editedProposal?.proposedStatus || proposal.proposedStatus}
                                            onValueChange={(value) =>
                                              setEditedProposal((prev) => ({ ...prev, proposedStatus: value }))
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
                                            value={editedProposal?.proposedProgress ?? proposal.proposedProgress}
                                            onChange={(e) =>
                                              setEditedProposal((prev) => ({
                                                ...prev,
                                                proposedProgress: Number.parseInt(e.target.value),
                                              }))
                                            }
                                            className="w-16 h-7"
                                          />
                                          <span>%</span>
                                        </div>
                                      )}
                                      {(editedProposal?.proposedEndDate || proposal.proposedEndDate) && (
                                        <div className="flex items-center gap-2">
                                          <span>End Date:</span>
                                          <Input
                                            type="date"
                                            value={
                                              editedProposal?.proposedEndDate
                                                ? new Date(editedProposal.proposedEndDate).toISOString().split("T")[0]
                                                : new Date(proposal.proposedEndDate).toISOString().split("T")[0]
                                            }
                                            onChange={(e) =>
                                              setEditedProposal((prev) => ({
                                                ...prev,
                                                proposedEndDate: new Date(e.target.value),
                                              }))
                                            }
                                            className="w-36 h-7"
                                          />
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                      <Button size="sm" onClick={() => handleSaveProposal(meeting.id, proposal.id)}>
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
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm">Task {proposal.taskId}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {Math.round(proposal.confidence * 100)}% confidence
                                      </Badge>
                                      {approvedProposals.has(proposal.id) && (
                                        <Badge variant="default" className="text-xs bg-green-600">
                                          <CheckCheck className="h-3 w-3 mr-1" />
                                          Applied
                                        </Badge>
                                      )}
                                      {skippedProposals.has(proposal.id) && (
                                        <Badge variant="secondary" className="text-xs bg-gray-500">
                                          <SkipForward className="h-3 w-3 mr-1" />
                                          Skipped
                                        </Badge>
                                      )}
                                      <div className="ml-auto flex gap-1">
                                        {!approvedProposals.has(proposal.id) && !skippedProposals.has(proposal.id) && (
                                          <>
                                            <Button
                                              size="sm"
                                              variant="default"
                                              onClick={() => handleApproveProposal(meeting.id, proposal.id, proposal)}
                                              className="h-6 px-2 bg-green-600 hover:bg-green-700"
                                            >
                                              <Check className="h-3 w-3 mr-1" />
                                              Approve
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleSkipProposal(meeting.id, proposal.id)}
                                              className="h-6 px-2"
                                            >
                                              <SkipForward className="h-3 w-3 mr-1" />
                                              Skip
                                            </Button>
                                          </>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleEditProposal(proposal)}
                                          className="h-6 w-6 p-0"
                                          disabled={
                                            approvedProposals.has(proposal.id) || skippedProposals.has(proposal.id)
                                          }
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <p
                                      className={`text-sm ${skippedProposals.has(proposal.id) ? "text-gray-400" : "text-muted-foreground"}`}
                                    >
                                      {proposal.reason}
                                    </p>
                                    <div
                                      className={`flex items-center gap-4 mt-2 text-xs ${skippedProposals.has(proposal.id) ? "text-gray-400" : ""}`}
                                    >
                                      {proposal.proposedStatus && <span>Status → {proposal.proposedStatus}</span>}
                                      {proposal.proposedProgress !== undefined && (
                                        <span>Progress → {proposal.proposedProgress}%</span>
                                      )}
                                      {proposal.proposedEndDate && (
                                        <span>End Date → {proposal.proposedEndDate.toLocaleDateString()}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full Transcript */}
                    <div>
                      <h4 className="font-medium mb-2">Meeting Transcript</h4>
                      <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                        {meeting.transcript}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
