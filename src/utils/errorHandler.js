export function getErrorMessage(error) {
  if (!error) {
    return "Something went wrong.";
  }

  if (typeof error === "string") {
    return error;
  }

  const data = error.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data?.msg) {
    return data.msg;
  }

  if (data?.error) {
    return data.error;
  }

  if (error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}