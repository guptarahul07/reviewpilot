// src/pages/Salons.jsx
import IndustryPage from './IndustryPage'

export default function Salons() {
  return (
    <IndustryPage
      emoji="💇"
      title="Build Client Loyalty Through Better Review Management"
      subtitle="Show every client you care about their experience. AI-powered review responses that strengthen relationships and grow your salon business."
      trustLine="Trusted by salons and spas across India 🇮🇳"
      problems={[
          { icon: "📅", title: "Busy Schedule, Zero Time", desc: "Between appointments, walk-ins, and managing staff — when do you find time to respond to reviews? Most go unanswered for days." },
          { icon: "😰", title: "Negative Reviews Spread Fast", desc: "One bad review about "rude staff" or "bad haircut" can cost you 50+ potential clients before you even see it." },
          { icon: "💸", title: "Miss Out on Repeat Business", desc: "Your best clients leave glowing reviews but you never respond. They feel undervalued — and go elsewhere next time." },
      ]}
      scenarios={[
          {
            stars: 5, review: "Best hair spa experience! My hair feels so soft and shiny now!",
            reply: "Thank you so much! We're thrilled you loved the hair spa treatment! Soft, shiny hair is exactly what we aim for. 😊 Can't wait to pamper you again soon! Book your next appointment at our front desk.",
            why: ['Thanks specifically', 'Reinforces outcome', 'Invites return booking'],
          },
          {
            stars: 2, review: "Haircut was too short, not what I asked for.",
            reply: "We're so sorry the haircut didn't match your expectations. That's not the experience we want for our clients. We'd love to make this right — please reach out to us directly. Our senior stylist would be happy to fix it at no charge. Your satisfaction matters to us! 🙏",
            why: ['Acknowledges mistake', 'Offers to fix for free', 'Professional and empathetic'],
          },
      ]}
      results={[
          {
            biz: "Glow Beauty Salon, Mumbai",
            before: ['4.2★ rating', '45% response rate'],
            after: ['4.8★ rating', '100% response rate'],
            quote: "As a salon owner, I don't have time to write replies. ReviewPilot's AI does it in seconds. Game changer!",
            name: "Neha Patel, Owner",
          },
      ]}
      faqs={[
          { q: "Will the AI understand beauty service terminology?", a: "Yes! The AI understands terms like balayage, keratin, facials, and more — generating natural, relevant responses." },
          { q: "Can I customise the tone?", a: "Absolutely. Choose Friendly, Professional, or Apologetic tone for each reply, or regenerate for a different version." },
      ]}
    />
  )
}
