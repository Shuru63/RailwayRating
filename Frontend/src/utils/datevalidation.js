const checkDateSelection = (inputDate) => {
  console.log('Input date:', inputDate);
  const currentDate = new Date();
  const selectedDate = new Date(inputDate);
  currentDate.setHours(22, 0, 0, 0);
  const nextDayEpoch = new Date(
    currentDate.getTime() + 24 * 60 * 60 * 1000
  ).setHours(0, 0, 0, 0);
  const dayAfterNextEpoch = new Date(nextDayEpoch + 24 * 60 * 60 * 1000);
  if (selectedDate >= currentDate && selectedDate < dayAfterNextEpoch) {
    console.log('Selected date is the next day after the current date.');
    return true;
  } else if (selectedDate < currentDate) {
    console.log('Selected date is a past date.');
    return true;
  } else {
    console.log('Selected date is not allowed.');
    return false;
  }
};

export default checkDateSelection;
