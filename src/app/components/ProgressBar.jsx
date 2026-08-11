import { Progress } from "@mantine/core";

const getBarColor = (progress, inverseColor) => {
  if (progress >= 100) {
    return inverseColor ? "red" : "green";
  }

  if (progress >= 75 && progress < 100) {
    return inverseColor ? "orange" : "lime";
  }

  if (progress >= 50 && progress < 75) {
    return "yellow";
  }

  if (progress >= 25 && progress < 50) {
    return inverseColor ? "lime" : "orange";
  }

  return inverseColor ? "green" : "red";
};

const ProgressBar = ({
  usedValue,
  maxValue,
  inverseColor = false,
  ...props
}) => {
  const progress = (usedValue / maxValue) * 100;

  return (
    <Progress
      value={progress}
      striped={progress >= 100}
      color={getBarColor(progress, inverseColor)}
      {...props}
    />
  );
};

export default ProgressBar;
