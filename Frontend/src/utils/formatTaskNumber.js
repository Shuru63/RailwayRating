export const formatTaskNumber = (taskNumber) => {
  if (taskNumber >= 100) {
    const remainder = taskNumber % 100;
    return remainder;
  } else {
    return taskNumber;
  }
};
