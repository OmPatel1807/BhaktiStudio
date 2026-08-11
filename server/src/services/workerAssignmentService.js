/**
 * Worker Assignment & Conflict Detection Service
 */
export class WorkerAssignmentService {
  /**
   * Check if worker schedule conflicts with proposed event window
   * @param {Object} params
   * @param {string} params.workerId
   * @param {Date} params.eventStart
   * @param {Date} params.eventEnd
   * @param {Array} params.existingAssignments List of worker's active assignments
   * @param {Array} params.leaveRecords List of worker's approved leave dates
   * @param {number} bufferHours Setup/transit buffer in hours (default 2h)
   */
  static checkWorkerConflict({
    workerId,
    eventStart,
    eventEnd,
    existingAssignments = [],
    leaveRecords = [],
    bufferHours = 2
  }) {
    const start = new Date(eventStart).getTime();
    const end = new Date(eventEnd).getTime();
    const bufferMs = bufferHours * 60 * 60 * 1000;

    // 1. Check Leave Records
    for (const leave of leaveRecords) {
      const leaveStart = new Date(leave.startDate).getTime();
      const leaveEnd = new Date(leave.endDate).getTime();
      if (start <= leaveEnd && end >= leaveStart) {
        return {
          hasConflict: true,
          reason: 'LEAVE_CONFLICT',
          message: `Worker is on approved leave from ${leave.startDate} to ${leave.endDate}`
        };
      }
    }

    // 2. Check Assignment Schedule Overlap (including buffer)
    for (const assignment of existingAssignments) {
      const existStart = new Date(assignment.eventStart).getTime() - bufferMs;
      const existEnd = new Date(assignment.eventEnd).getTime() + bufferMs;

      if (start < existEnd && end > existStart) {
        return {
          hasConflict: true,
          reason: 'SCHEDULE_OVERLAP',
          message: `Worker is assigned to Order #${assignment.orderId} (${assignment.eventName}) during this window (with ${bufferHours}h buffer)`
        };
      }
    }

    return {
      hasConflict: false,
      reason: null,
      message: 'Worker is available for assignment'
    };
  }
}
