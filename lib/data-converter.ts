import { BackendProject } from './api';
import { Task, AuditEntry } from '../app/page';

export function convertBackendToHierarchicalTasks(backendProjects: BackendProject[]): Task[] {
  console.log('=== DATA CONVERTER DEBUG ===')
  console.log('Input projects:', backendProjects.length)
  
  const tasks: Task[] = [];
  const mainTasks: Task[] = [];
  const subTasks: Task[] = [];

  // First pass: create all tasks
  backendProjects.forEach((project, index) => {
    console.log(`Processing project ${index}:`, project.name, 'is_title:', project.is_title, 'item_id:', project.item_id)
    
    const startDate = project.start_date ? new Date(project.start_date) : new Date();
    const endDate = project.end_date ? new Date(project.end_date) : new Date();
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Convert backend status to frontend status
    const status = convertStatus(project.status);
    
    // Convert backend priority based on activity type
    const priority = convertPriority(project.activity_type);

    // Create audit trail entry for initial load
    const auditEntry: AuditEntry = {
      id: `audit-${index}`,
      timestamp: new Date(),
      type: 'system',
      field: 'status',
      oldValue: 'Not Started',
      newValue: status,
      reason: 'Loaded from Excel file',
    };

    const task: Task = {
      id: project.item_id || `task-${index}`,
      name: project.name,
      startDate,
      endDate,
      duration,
      progress: project.completed,
      assignee: project.team,
      priority,
      status,
      auditTrail: [auditEntry],
      level: project.is_title ? 0 : 1,
      type: project.is_title ? 'main' : 'sub',
      isExpanded: project.is_title ? true : false,
    };

    if (project.is_title) {
      mainTasks.push(task);
      console.log(`Added main task: ${task.name} (ID: ${task.id})`)
    } else {
      subTasks.push(task);
      console.log(`Added sub task: ${task.name} (ID: ${task.id})`)
    }
  });

  console.log(`Created ${mainTasks.length} main tasks and ${subTasks.length} sub tasks`)

  // Second pass: assign parent-child relationships based on item IDs
  subTasks.forEach((subTask) => {
    const subTaskId = subTask.id;
    
    // Find the parent main task based on item ID structure
    // e.g., sub-task "1.1" belongs to main task "1"
    if (subTaskId.includes('.')) {
      const parentId = subTaskId.split('.')[0];
      const parentTask = mainTasks.find(task => task.id === parentId);
      
      if (parentTask) {
        subTask.parentId = parentTask.id;
        console.log(`Assigned sub task "${subTask.name}" to parent "${parentTask.name}"`)
      } else {
        console.log(`Could not find parent for sub task "${subTask.name}" with ID "${subTaskId}"`)
      }
    }
  });

  // Group sub-tasks under their main tasks
  mainTasks.forEach((mainTask) => {
    const subTasksForThisMain = subTasks.filter((subTask) => subTask.parentId === mainTask.id);
    mainTask.children = subTasksForThisMain;
    console.log(`Main task "${mainTask.name}" has ${subTasksForThisMain.length} children`)
  });

  // Return all tasks (both main and sub tasks)
  const allTasks = [...mainTasks, ...subTasks];
  console.log('Returning all tasks:', allTasks.length)
  console.log('=== END DATA CONVERTER DEBUG ===')
  return allTasks;
}

function convertStatus(backendStatus: string): Task['status'] {
  const statusLower = backendStatus.toLowerCase();
  
  if (statusLower.includes('completed') || statusLower.includes('akkoord') || statusLower.includes('gereed')) {
    return 'Completed';
  } else if (statusLower.includes('in progress') || statusLower.includes('gestart')) {
    return 'In Progress';
  } else if (statusLower.includes('blocked')) {
    return 'Blocked';
  } else if (statusLower.includes('delayed')) {
    return 'Delayed';
  } else {
    return 'Not Started';
  }
}

function convertPriority(activityType: string): Task['priority'] {
  const typeLower = activityType.toLowerCase();
  
  if (typeLower.includes('main') || typeLower.includes('critical')) {
    return 'High';
  } else if (typeLower.includes('sub') || typeLower.includes('secondary')) {
    return 'Medium';
  } else {
    return 'Low';
  }
}

export function convertV0ToBackendUpdate(taskId: string, updates: Partial<Task>, reason: string) {
  return {
    project_name: taskId,
    new_start_date: updates.startDate?.toISOString().split('T')[0],
    new_end_date: updates.endDate?.toISOString().split('T')[0],
    new_status: updates.status,
    new_progress: updates.progress,
    reason,
  };
} 