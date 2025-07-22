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
} from "lucide-react"
import { useState } from "react"
import type { Meeting, DesignTheme } from "../app/page"

interface MeetingSummaryProps {
  meetings: Meeting[]
  theme: DesignTheme
  themeClasses: any
}

export function MeetingSummary({ meetings, theme, themeClasses }: MeetingSummaryProps) {
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set())

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
                            <div key={proposal.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              {getProposalIcon(proposal)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">Task {proposal.taskId}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(proposal.confidence * 100)}% confidence
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{proposal.reason}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                  {proposal.proposedStatus && <span>Status → {proposal.proposedStatus}</span>}
                                  {proposal.proposedProgress !== undefined && (
                                    <span>Progress → {proposal.proposedProgress}%</span>
                                  )}
                                  {proposal.proposedEndDate && (
                                    <span>End Date → {proposal.proposedEndDate.toLocaleDateString()}</span>
                                  )}
                                </div>
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
