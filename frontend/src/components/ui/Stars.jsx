import './Stars.css'

export default function Stars({ rating, max = 5 }) {
  return (
    <span className="stars" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`star ${i < rating ? 'star--filled' : 'star--empty'}`}
        >
          ★
        </span>
      ))}
    </span>
  )
}
