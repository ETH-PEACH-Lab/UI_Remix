import { UserAction, UserActionType } from '../store/userTrackingSlice';

// CSV column headers.
const CSV_HEADERS = [
  'ID',
  'Timestamp',
  'DateTime',
  'ActionType',
  'UserName',
  'SessionId',
  'Message',
  'MessageMode',
  'CardId',
  'CardTitle',
  'ElementXPath',
  'ElementTag',
  'DrawingData',
  'CodeContent',
  'Mode',
  'PreviousValue',
  'NewValue',
  'Duration',
  'CoordinatesX',
  'CoordinatesY',
  'Metadata',
];

// Human-readable labels for action types.
const ACTION_TYPE_LABELS: Record<UserActionType, string> = {
  'message_sent': 'send message',
  'ui_card_clicked': 'click ui card',
  'ui_card_selected': 'select ui card',
  'ui_card_enlarged': 'zoom ui card',
  'drawing_started': 'start drawing',
  'drawing_ended': 'end drawing',
  'drawing_saved': 'save drawing',
  'iframe_element_clicked': 'iframe click',
  'mode_changed': 'change mode',
  'code_edited': 'edit code',
  'tag_selected': 'select tag',
  'tag_deselected': 'deselect tag',
  'session_started': 'start session',
  'session_ended': 'end session',
};

// Format a timestamp into a readable date-time string.
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

// Escape special characters in a CSV field.
const escapeCsvField = (field: any): string => {
  if (field === null || field === undefined) {
    return '';
  }
  
  const stringField = String(field);
  
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    const escapedField = stringField.replace(/"/g, '""');
    return `"${escapedField}"`;
  }
  
  return stringField;
};

// Convert a user action into a CSV row.
const actionToCsvRow = (action: UserAction): string => {
  const {
    id,
    timestamp,
    actionType,
    userName,
    details = {},
  } = action;

  const {
    sessionId = '',
    message = '',
    messageMode = '',
    cardId = '',
    cardTitle = '',
    elementXPath = '',
    elementTag = '',
    drawingData = '',
    codeContent = '',
    mode = '',
    previousValue = '',
    newValue = '',
    duration = '',
    coordinates,
    metadata = {},
  } = details;

  const csvRow = [
    escapeCsvField(id),
    escapeCsvField(timestamp),
    escapeCsvField(formatTimestamp(timestamp)),
    escapeCsvField(ACTION_TYPE_LABELS[actionType] || actionType),
    escapeCsvField(userName),
    escapeCsvField(sessionId),
    escapeCsvField(message),
    escapeCsvField(messageMode),
    escapeCsvField(cardId),
    escapeCsvField(cardTitle),
    escapeCsvField(elementXPath),
    escapeCsvField(elementTag),
    escapeCsvField(drawingData ? '[drawing data]' : ''),
    escapeCsvField(codeContent ? '[code content]' : ''),
    escapeCsvField(mode),
    escapeCsvField(previousValue),
    escapeCsvField(newValue),
    escapeCsvField(duration),
    escapeCsvField(coordinates?.x || ''),
    escapeCsvField(coordinates?.y || ''),
    escapeCsvField(Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : ''),
  ];

  return csvRow.join(',');
};

// Generate CSV content from user actions.
export const generateUserActionsCSVString = (actions: UserAction[]): string => {
  if (actions.length === 0) {
    throw new Error('No user action data to export.');
  }

  const csvLines = [
    CSV_HEADERS.join(','),
    ...actions.map(actionToCsvRow),
  ];

  return csvLines.join('\n');
};

// Export user actions as a CSV file.
export const exportUserActionsToCSV = (
  actions: UserAction[],
  fileName?: string
): void => {
  try {
    const csvContent = generateUserActionsCSVString(actions);
    
    // Add UTF-8 BOM to improve compatibility (e.g., Excel).
    const bom = '\uFEFF';
    const csvContentWithBom = bom + csvContent;

    const blob = new Blob([csvContentWithBom], {
      type: 'text/csv;charset=utf-8;',
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName || `user_behavior_${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    console.log(`Exported ${actions.length} user action records to a CSV file.`);
  } catch (error) {
    console.error('Failed to export CSV file:', error);
    throw error;
  }
};

// Export actions filtered by session ID.
export const exportUserActionsBySession = (
  actions: UserAction[],
  sessionId: string,
  fileName?: string
): void => {
  const sessionActions = actions.filter(
    action => action.details.sessionId === sessionId
  );
  
  if (sessionActions.length === 0) {
    throw new Error(`No user action data found for sessionId: ${sessionId}`);
  }

  const defaultFileName = `user_behavior_session_${sessionId}_${Date.now()}.csv`;
  exportUserActionsToCSV(sessionActions, fileName || defaultFileName);
};

// Export actions filtered by a time range.
export const exportUserActionsByTimeRange = (
  actions: UserAction[],
  startTime: number,
  endTime: number,
  fileName?: string
): void => {
  const filteredActions = actions.filter(
    action => action.timestamp >= startTime && action.timestamp <= endTime
  );
  
  if (filteredActions.length === 0) {
    throw new Error('No user action data found in the specified time range.');
  }

  const startDate = formatTimestamp(startTime).replace(/[:/\s]/g, '_');
  const endDate = formatTimestamp(endTime).replace(/[:/\s]/g, '_');
  const defaultFileName = `user_behavior_${startDate}_to_${endDate}.csv`;
  
  exportUserActionsToCSV(filteredActions, fileName || defaultFileName);
};

// Export actions filtered by user name.
export const exportUserActionsByUser = (
  actions: UserAction[],
  userName: string,
  fileName?: string
): void => {
  const userActions = actions.filter(
    action => action.userName === userName
  );
  
  if (userActions.length === 0) {
    throw new Error(`No user action data found for user: ${userName}`);
  }

  const defaultFileName = `user_behavior_${userName}_${Date.now()}.csv`;
  exportUserActionsToCSV(userActions, fileName || defaultFileName);
};

// Get basic statistics for user actions.
export const getUserActionStatistics = (actions: UserAction[]) => {
  const stats = {
    totalActions: actions.length,
    actionsByType: {} as Record<string, number>,
    sessionCount: new Set<string>(),
    userCount: new Set<string>(),
    timeRange: {
      start: 0,
      end: 0,
    },
  };

  actions.forEach(action => {
    const typeLabel = ACTION_TYPE_LABELS[action.actionType] || action.actionType;
    stats.actionsByType[typeLabel] = (stats.actionsByType[typeLabel] || 0) + 1;
    
    if (action.details.sessionId) {
      stats.sessionCount.add(action.details.sessionId);
    }
    
    stats.userCount.add(action.userName);
    
    if (stats.timeRange.start === 0 || action.timestamp < stats.timeRange.start) {
      stats.timeRange.start = action.timestamp;
    }
    if (action.timestamp > stats.timeRange.end) {
      stats.timeRange.end = action.timestamp;
    }
  });

  return {
    ...stats,
    sessionCount: stats.sessionCount.size,
    userCount: stats.userCount.size,
    timeRange: {
      start: stats.timeRange.start,
      end: stats.timeRange.end,
      startFormatted: stats.timeRange.start ? formatTimestamp(stats.timeRange.start) : '',
      endFormatted: stats.timeRange.end ? formatTimestamp(stats.timeRange.end) : '',
    },
  };
};
