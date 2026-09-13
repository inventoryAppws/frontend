function ErrorMessage({
  message,
  onRetry,
}) {
  if (!message) {
    return null;
  }

  return (
    <div className="error-box">
      <p>{message}</p>

      {onRetry && (
        <button
          className="btn btn-danger"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;