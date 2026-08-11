/**
 * Order State Machine & Transition Rules Engine
 */

export const ALLOWED_TRANSITIONS = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['UNDER_REVIEW', 'QUOTATION_SENT', 'CANCELLED', 'REJECTED'],
  UNDER_REVIEW: ['QUOTATION_SENT', 'CANCELLED', 'REJECTED'],
  QUOTATION_SENT: ['AWAITING_CUSTOMER_CONFIRMATION', 'CONFIRMED', 'CANCELLED', 'REJECTED'],
  AWAITING_CUSTOMER_CONFIRMATION: ['CONFIRMED', 'CANCELLED', 'REJECTED'],
  CONFIRMED: ['WORKERS_ASSIGNED', 'SETUP_IN_PROGRESS', 'CANCELLED'],
  WORKERS_ASSIGNED: ['SETUP_IN_PROGRESS', 'CANCELLED'],
  SETUP_IN_PROGRESS: ['EVENT_IN_PROGRESS', 'CANCELLED'],
  EVENT_IN_PROGRESS: ['EVENT_COMPLETED', 'CANCELLED'],
  EVENT_COMPLETED: ['FINAL_PAYMENT_PENDING', 'COMPLETED'],
  FINAL_PAYMENT_PENDING: ['COMPLETED', 'CLOSED'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
  REJECTED: [],
};

export class StateMachineService {
  /**
   * Validate state machine transition
   * @param {string} currentStatus 
   * @param {string} nextStatus 
   * @returns {{ valid: boolean, message?: string }}
   */
  static validateTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) {
      return { valid: true };
    }

    const validNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!validNextStates.includes(nextStatus)) {
      return {
        valid: false,
        message: `Invalid order state transition from '${currentStatus}' to '${nextStatus}'. Allowed transitions: [${validNextStates.join(', ')}]`,
      };
    }

    return { valid: true };
  }
}
