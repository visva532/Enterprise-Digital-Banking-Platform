import Icon from "./Icon.jsx";

export default function AsyncView({ loading, error, onRetry, children }) {
  if (loading) return <p className="note">Loading...</p>;
  if (error) {
    return (
      <div>
        <div className="notice error" role="alert">
          <Icon name="alert" size={18} />
          {error}
        </div>
        {onRetry && (
          <button type="button" className="btn btn-outline" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }
  return children;
}