// src/pages/Gyms.jsx
import IndustryPage from './IndustryPage'

export default function Gyms() {
  return (
    <IndustryPage
      emoji="💪"
      title="Turn Members Into Fans — One Review at a Time"
      subtitle="Build a strong fitness community through better review engagement. AI-powered responses that motivate and retain members."
      trustLine="Trusted by gyms and fitness centres across India 🇮🇳"
      problems={[
          { icon: "🏋️", title: "Member Complaints Hurt Sign-ups", desc: "One review about 'broken equipment' or 'unhygienic facilities' stops potential members before they even walk in." },
          { icon: "💪", title: "Positive Reviews Get Lost", desc: "Your dedicated members share incredible transformation stories — but you never respond. They feel like just another number." },
          { icon: "⚔️", title: "Competition is Fierce", desc: "Other gyms nearby are responding faster and looking more engaged. Online reputation is the new competitive advantage." },
      ]}
      scenarios={[
          {
            stars: 5, review: "Lost 15 kgs in 6 months! Best trainers and equipment!",
            reply: "WOW! 15 kgs — that's incredible! 🎉 We're so proud of your dedication and hard work! Our trainers love working with committed members like you. Thank you for trusting us with your fitness journey. Keep crushing those goals! 💪",
            why: ['Celebrates achievement', 'Credits the member', 'Builds community'],
          },
          {
            stars: 3, review: "Good gym but some equipment needs maintenance.",
            reply: "Thank you for bringing this to our attention! We take equipment maintenance very seriously. Our team has scheduled an inspection this week. Please DM us to let us know which equipment needs attention — we appreciate members like you who help us improve!",
            why: ['Acknowledges concern', 'Shows action taken', 'Invites follow-up'],
          },
      ]}
      results={[
          {
            biz: "FitLife Gym, Pune",
            before: ['4.0★ rating', '40% response rate'],
            after: ['4.7★ rating', '100% response rate'],
            quote: "Members now feel genuinely appreciated. Our referrals have doubled since we started responding to every review.",
            name: "Vikram Sharma, Owner",
          },
      ]}
      faqs={[
          { q: "Can it handle reviews about trainers?", a: "Yes! AI generates appropriate responses whether reviews praise specific trainers or raise concerns about them." },
          { q: "What about membership cancellation reviews?", a: "AI handles these sensitively, acknowledging feedback without being defensive and inviting the member to return." },
      ]}
    />
  )
}
