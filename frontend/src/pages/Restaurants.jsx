// src/pages/Restaurants.jsx
import IndustryPage from './IndustryPage'

export default function Restaurants() {
  return (
    <IndustryPage
      emoji="☕"
      title="Turn Food Reviews Into 5-Star Ratings"
      subtitle="Respond to every review professionally — even during dinner rush. AI-powered review management built for Indian restaurants and cafés."
      trustLine="Trusted by 50+ restaurants across India 🇮🇳"
      problems={[
          { icon: "😓", title: "Too Busy to Respond", desc: "Between managing kitchen, serving customers, and handling deliveries — who has time to write thoughtful review responses? Reviews pile up unanswered." },
          { icon: "⭐", title: "Negative Reviews Hurt", desc: "One 1-star review about "slow service" can cost you 30+ potential customers who read it and choose a competitor." },
          { icon: "💔", title: "Positive Reviews Get Ignored", desc: "Your happiest customers leave glowing 5-star reviews, but you never respond. They feel unappreciated — and don't become repeat customers." },
      ]}
      scenarios={[
          {
            stars: 5, review: "Best butter chicken in Delhi! Ambiance was amazing too!",
            reply: "Thank you so much for the wonderful review! We're thrilled you loved our butter chicken — it's our chef's special recipe! The ambiance is something we've put a lot of thought into. We'd love to have you back to try our new tandoori specials. See you soon! 🙏",
            why: ['Mentions specific dish', 'Acknowledges compliment', 'Invites return', 'Warm and personal'],
          },
          {
            stars: 2, review: "Food was good but waited 45 minutes for our order. Very disappointed.",
            reply: "We sincerely apologize for the long wait time. That's not the experience we want for our guests. We're glad you enjoyed the food, and we've taken your feedback seriously — we've added more kitchen staff to improve service speed during peak hours. We'd love to make it right — please DM us. Hope to serve you better next time!",
            why: ['Acknowledges problem', "Doesn't make excuses", 'Shows action taken', 'Offers to make it right'],
          },
          {
            stars: 4, review: "Loved the dal makhani but the naan was a bit cold. Overall good experience.",
            reply: "Hi, thank you for trying our dal makhani — we're so happy you loved it! We apologize the naan wasn't perfect — that's on us. We've shared your feedback with our kitchen team. Next time you visit, the naan will be piping hot! Looking forward to welcoming you back soon. 😊",
            why: ['Thanks for positive', 'Addresses the negative', 'Shows fix in progress', 'Invites return'],
          },
      ]}
      results={[
          {
            biz: "Brew & Beans Café, Delhi",
            before: ['4.1★ rating', '32% response rate'],
            after: ['4.6★ rating', '100% response rate'],
            quote: "We were drowning in reviews. ReviewPilot changed everything. Now we respond to every review in minutes, not days.",
            name: "Priya Sharma, Owner",
          },
      ]}
      faqs={[
          { q: "Will responses sound generic?", a: "No! AI references specific dishes, compliments, or complaints from each review." },
          { q: "Can it handle Hindi reviews?", a: "Yes! AI understands Hindi reviews and generates English responses. Full Hindi reply generation coming soon." },
          { q: "What about Zomato/Swiggy reviews?", a: "Coming in Phase 2 (Q3 2026). For now, we focus on Google Business reviews." },
      ]}
    />
  )
}
