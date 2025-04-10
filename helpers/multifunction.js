export const truncateText = (value, num = 50) => {
  if (typeof value !== "string") return "";
  return value.length > num ? value.substring(0, num) + "..." : value;
};
